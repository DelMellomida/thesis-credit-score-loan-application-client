"use client";

import React, { useState, useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Header } from '../components/layout/Header';
import { ProcessForm } from '../components/loan/ProcessForm';
import { ResultPreview } from '../components/loan/ResultPreview';
import { ApplicantsList, Applicant } from '../components/loan/ApplicantList';
import { ApplicantOverview } from '../components/loan/ApplicantOverview';
import { getLoanApplication, updateLoanApplication } from '../lib/api';
import { transformToApplicant } from '../lib/utils/transformData';
import type { ApplicationResponse } from '../lib/types';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export interface PersonalData {
  fullName: string;
  contactNo: string;
  address: string;
  headOfHousehold: string;
  dependents: string;
  yearsLivingHere: string;
  housingStatus: string;
}

export interface EmployeeData {
  companyName: string;
  sector: string;
  position: string;
  employmentDuration: string;
  salary: string;
  typeOfSalary: string;
}

export interface OtherData {
  communityPosition: string;
  paluwagaParticipation: string;
  otherIncomeSources: string;
  disasterPreparednessStrategy: string;
}

export interface CoMakerData {
  fullName: string;
  contactNo: string;
  address: string;
  howManyMonthsYears: string;
  salary: string;
  relationshipWithApplicant: string;
}

export interface FormData {
  personal: PersonalData;
  employee: EmployeeData;
  other: OtherData;
  coMaker: CoMakerData;
}

type ViewType = 'loan-process' | 'applicants-list' | 'applicant-overview';

import { loadFormData, saveFormData, clearFormData } from '../lib/forms/storage';
import { useSearchParams, useRouter } from 'next/navigation';

const INITIAL_FORM_DATA: FormData = {
  personal: {
    fullName: '',
    contactNo: '',
    address: '',
    headOfHousehold: '',
    dependents: '',
    yearsLivingHere: '',
    housingStatus: '',
  },
  employee: {
    companyName: '',
    sector: '',
    position: '',
    employmentDuration: '',
    salary: '',
    typeOfSalary: '',
  },
  other: {
    communityPosition: '',
    paluwagaParticipation: '',
    otherIncomeSources: '',
    disasterPreparednessStrategy: '',
  },
  coMaker: {
    fullName: '',
    contactNo: '',
    address: '',
    howManyMonthsYears: '',
    salary: '',
    relationshipWithApplicant: '',
  },
};

export default function App() {
  const { user, loading, error } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('applicants-list');

  // Reset to applicants list whenever auth state changes
  React.useEffect(() => {
    if (user) {
      setCurrentView('applicants-list');
      newApplicant();
    }
  }, [user]);

  const searchParams = useSearchParams();
  const router = useRouter();

  // If the URL includes a query to open the loan process, handle it
  useEffect(() => {
    try {
      const v = searchParams?.get?.('view');
      if (v === 'loan-process') {
        newApplicant();
        setCurrentView('loan-process');
        // remove query param so it doesn't persist in the URL
        try {
          router.replace(window.location.pathname);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Initialize form data from storage or use initial data
  const [formData, setFormData] = useState<FormData>(() => {
    const loaded = loadFormData();
    // debug
    // if (loaded) {
    //   // eslint-disable-next-line no-console
    //   console.log('[App] Loaded form data from storage');
    // }
    return loaded || INITIAL_FORM_DATA;
  });

  // Store backend result
  const [loanResult, setLoanResult] = useState<any>(null);

  // Applicants state
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const handleToggleView = () => {
    if (currentView === 'applicants-list') {
      // When switching to loan process, ensure we start with a clean form
      newApplicant(); // This clears the form data
      setCurrentView('loan-process');
    } else {
      // When going back to list, clear any selected applicant
      setCurrentView('applicants-list');
      setSelectedApplicant(null);
    }
  };

  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [section]: { ...prev[section], ...data }
      };
      // Save to storage whenever form is updated
      saveFormData(newData);
      return newData;
    });
  };

  React.useEffect(() => {
    try {
      saveFormData(formData);
    } catch (err) {
      console.error('[App] Error saving formData in effect', err);
    }
  }, [formData]);

  const newApplicant = () => {
    clearFormData();
    setFormData(INITIAL_FORM_DATA);
    setLoanResult(null);
  };

  const handleApprove = (id: string) => {
    setApplicants(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'approved' as const } : app))
    );
    toast.success('Applicant approved successfully!');
  };

  const handleDeny = (id: string) => {
    setApplicants(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'denied' as const } : app))
    );
    toast.error('Applicant denied.');
  };

  const handleViewEdit = async (applicant: Applicant) => {
    try {
      const fullApplication = await getLoanApplication(applicant.id, user?.token);
      // console.log('Full Application Data:', fullApplication);
      
      const isValidApplication = (data: any): data is ApplicationResponse => {
        return data && typeof data === 'object' && '_id' in data;
      };

      if (!isValidApplication(fullApplication)) {
        throw new Error('Invalid application data received');
      }

      const enrichedApplicant = {
        ...applicant,
        formData: transformToApplicant(fullApplication).formData
      };
      
      setSelectedApplicant(enrichedApplicant);
      setCurrentView('applicant-overview');
    } catch (error) {
      console.error('Error fetching full application details:', error);
      toast.error('Failed to load complete application details');
    }
  };

  const handleBackFromOverview = () => {
    setCurrentView('applicants-list');
    setSelectedApplicant(null);
  };

  const handleSaveApplicant = async (updatedData: any) => {
    if (!selectedApplicant || !user?.token) {
      toast.error('Unable to save changes: missing applicant data or authentication');
      return;
    }

    try {
      setApplicants(prev =>
        prev.map(app =>
          app.id === selectedApplicant.id
            ? { ...app, formData: updatedData.formData }
            : app
        )
      );
    } catch (error) {
      console.error('Failed to save application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save changes');
    }
  };

  // Show loading spinner if loading
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  
  // Show error if error
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  
  // Show login if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <Header currentView={currentView} onToggleView={handleToggleView} />
      
      <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-hidden">
        {currentView === 'loan-process' && (
          <div className="flex gap-6 h-full overflow-hidden">
            <div className="flex-1">
              <ProcessForm
                formData={formData}
                updateFormData={updateFormData}
                newApplicant={newApplicant}
                setLoanResult={setLoanResult}
                token={user.token}
              />
            </div>

            <div className="w-96 overflow-hidden">
              <ResultPreview formData={formData} loanResult={loanResult} />
            </div>
          </div>
        )}

        {currentView === 'applicants-list' && (
          <ApplicantsList
            applicants={applicants}
            onApprove={handleApprove}
            onDeny={handleDeny}
            onViewEdit={handleViewEdit}
          />
        )}

        {currentView === 'applicant-overview' && selectedApplicant && (
          <ApplicantOverview
            applicant={selectedApplicant}
            onBack={handleBackFromOverview}
            onSave={handleSaveApplicant}
          />
        )}
      </div>
    </div>
  );
}