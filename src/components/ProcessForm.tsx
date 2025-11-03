import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { StepProgress } from "./StepProgress";
import { PersonalDataForm } from "./forms/PersonalDataForm";
import { EmployeeDataForm } from "./forms/EmployeeDataForm";
import { OtherDataForm } from "./forms/OtherDataForm";
import { CoMakerDataForm } from "./forms/CoMakerDataForm";
import type { FormData } from "../app/page";
import { transformLoanFormData } from "../lib/loanTransform";
import { createLoanApplication, uploadDocuments } from "../lib/api";
import { toast } from 'sonner';

export function ProcessForm({
  formData,
  updateFormData,
  newApplicant,
  setLoanResult,
  token,
}: {
  formData: FormData;
  updateFormData: (section: keyof FormData, data: any) => void;
  newApplicant: () => void;
  setLoanResult: (result: any) => void;
  token?: string;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Using sonner toast directly

  const steps = [
    { number: 1, title: "Personal Data" },
    { number: 2, title: "Employee Data" },
    { number: 3, title: "Other Data" },
    { number: 4, title: "Co-Maker Data" },
  ];

  // Navigation helpers

  // File state management
  const [files, setFiles] = useState<{
    profilePhoto: File | null;
    validId: File | null;
    brgyCert: File | null;
    payslip: File | null;
    companyId: File | null;
    proofOfBilling: File | null;
    eSignaturePersonal: File | null;
    eSignatureCoMaker: File | null;
  }>({
    profilePhoto: null,
    validId: null,
    brgyCert: null,
    payslip: null,
    companyId: null,
    proofOfBilling: null,
    eSignaturePersonal: null,
    eSignatureCoMaker: null
  });

  // Handle file upload
  const handleFileUpload = (type: keyof typeof files, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  // Submit handler
  interface ApplicationResponse {
    application_id: string;
    [key: string]: any;
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Create FormData with both application data and files
      const formDataToSend = new FormData();

      // Add the request data
      const payload = transformLoanFormData(formData);
      formDataToSend.append('request_data', JSON.stringify(payload));

      // Add all files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, file as File);
        } else {
          // If file is missing, add an empty blob to satisfy the required field
          formDataToSend.append(key, new Blob([''], { type: 'application/octet-stream' }));
        }
      });

      // Send everything in one request
      const result = (await createLoanApplication(formDataToSend, token)) as ApplicationResponse;

  setLoanResult(result);
  toast.success('Loan application created successfully');
    } catch (err: any) {
      console.error('Create application failed:', err);
  const message = err?.message || (typeof err === 'string' ? err : 'Failed to create loan application');
  toast.error('Error', { description: message });
      setLoanResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

  // Handle new applicant - reset step and clear data
  const handleNewApplicant = () => {
    setCurrentStep(1); // Reset to step 1
    newApplicant(); // Clear form data
  };

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // → ArrowRight = Next
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentStep < 4) {
          nextStep();
        } else {
          handleNewApplicant();
        }
      }

      // ← ArrowLeft = Back
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentStep > 1) {
          prevStep();
        }
      }

      // Number keys (1–4) = jump to step (REMOVED)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  const renderStepForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDataForm
            data={formData.personal}
            updateData={(data) => updateFormData("personal", data)}
            onFileUpload={handleFileUpload}
          />
        );
      case 2:
        return (
          <EmployeeDataForm
            data={formData.employee}
            updateData={(data) => updateFormData("employee", data)}
            onFileUpload={handleFileUpload}
          />
        );
      case 3:
        return (
          <OtherDataForm
            data={formData.other}
            updateData={(data) => updateFormData("other", data)}
            onFileUpload={handleFileUpload}
          />
        );
      case 4:
        return (
          <CoMakerDataForm
            data={formData.coMaker}
            updateData={(data) => updateFormData("coMaker", data)}
            onFileUpload={handleFileUpload}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center mb-6">
          Loan Application Process
        </CardTitle>
        <StepProgress
          currentStep={currentStep}
          totalSteps={4}
          steps={steps}
          onStepClick={goToStep}
        />
      </CardHeader>

      <CardContent>
        <div className="mb-8">{renderStepForm()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            Back
          </Button>

          {/* <Button onClick={handleSubmit} className="ml-auto">Submit Application</Button> */}

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}