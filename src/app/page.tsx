"use client";

import React, { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { Header } from '../components/Header';
import { ProcessForm } from '../components/ProcessForm';
import { ResultPreview } from '../components/ResultPreview';
import { ApplicantsList, Applicant } from '../components/ApplicantList';
import { ApplicantOverview } from '../components/ApplicantOverview';
import { getLoanApplication, updateLoanApplication } from '../lib/api';
import { transformToApplicant } from '../lib/transformData';
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

// Mock applicants data (can be replaced with API calls later)
// const mockApplicants: Applicant[] = [
//   {
//     id: '1',
//     name: 'Juan dela Cruz',
//     brgyCity: 'Manila',
//     email: 'juan.delacruz@example.com',
//     loanProduct: 'Regular Loan',
//     loanAmount: '₱50,000',
//     status: 'pending',
//     formData: {
//       personal: {
//         fullName: 'Juan dela Cruz',
//         contactNo: '09123456789',
//         address: '123 Main St, Manila',
//         headOfHousehold: 'Self',
//         dependents: '3',
//         yearsLivingHere: '5 years',
//         housingStatus: 'Owned',
//       },
//       employee: {
//         companyName: 'ABC Corporation',
//         sector: 'Manufacturing',
//         position: 'Supervisor',
//         employmentDuration: '5 years',
//         salary: '₱25,000',
//         typeOfSalary: 'Monthly',
//       },
//       other: {
//         communityPosition: 'Barangay Council',
//         paluwagaParticipation: 'Yes',
//         otherIncomeSources: 'Small business',
//         disasterPreparednessStrategy: 'Emergency fund',
//       },
//       coMaker: {
//         fullName: 'Maria Santos',
//         contactNo: '09198765432',
//         address: '456 Oak Ave, Manila',
//         howManyMonthsYears: '3 years',
//         salary: '₱20,000',
//         relationshipWithApplicant: 'Sister',
//       },
//     },
//   },
//   // Add more mock data as needed
// ];

import { loadFormData, saveFormData, clearFormData } from '../lib/formStorage';

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
    if (currentView === 'loan-process') {
      setCurrentView('applicants-list');
    } else {
      setCurrentView('loan-process');
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

  // As a fallback, ensure any change to formData is persisted.
  // This covers cases where child components might update values locally
  // and the parent state is updated in a way that doesn't call updateFormData.
  React.useEffect(() => {
    try {
      saveFormData(formData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[App] Error saving formData in effect', err);
    }
  }, [formData]);

  const newApplicant = () => {
    // Clear storage and reset form to initial state
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
      // Get the application using MongoDB ObjectId
      const fullApplication = await getLoanApplication(applicant.id, user?.token);
      // console.log('Full Application Data:', fullApplication);
      
      // Type guard function to check if response is valid
      const isValidApplication = (data: any): data is ApplicationResponse => {
        return data && typeof data === 'object' && '_id' in data;
      };

      // Ensure we have the complete application response
      if (!isValidApplication(fullApplication)) {
        throw new Error('Invalid application data received');
      }

      // Transform the full application data
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
      // Update local state only - the API call is already handled in ApplicantOverview

      // Just update local state since the API call and toast are handled in ApplicantOverview
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
            {/* Process Form Section */}
            <div className="flex-1">
              <ProcessForm
                formData={formData}
                updateFormData={updateFormData}
                newApplicant={newApplicant}
                setLoanResult={setLoanResult}
                token={user.token}
              />
            </div>

            {/* Result Preview Section */}
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