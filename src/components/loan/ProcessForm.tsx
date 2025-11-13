"use client";

import React, { useEffect, useState } from "react";
import { saveFiles, loadFiles, clearFiles } from "../../lib/forms/storage";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { StepProgress } from "./StepProgress";
import { PersonalDataForm } from "../forms/PersonalDataForm";
import { EmployeeDataForm } from "../forms/EmployeeDataForm";
import { OtherDataForm } from "../forms/OtherDataForm";
import { CoMakerDataForm } from "../forms/CoMakerDataForm";
import type { FormData } from "../../app/page";
import { transformLoanFormData } from "../../lib/utils/loanTransform";
import { createLoanApplication, uploadDocuments } from "../../lib/api";
import { validateFullApplication } from "../../lib/forms/validation";
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
    profilePhoto: { file: File | null; preview?: string };
    validId: { file: File | null; preview?: string };
    brgyCert: { file: File | null; preview?: string };
    payslip: { file: File | null; preview?: string };
    companyId: { file: File | null; preview?: string };
    proofOfBilling: { file: File | null; preview?: string };
    eSignaturePersonal: { file: File | null; preview?: string };
    eSignatureCoMaker: { file: File | null; preview?: string };
  }>({
    profilePhoto: { file: null },
    validId: { file: null },
    brgyCert: { file: null },
    payslip: { file: null },
    companyId: { file: null },
    proofOfBilling: { file: null },
    eSignaturePersonal: { file: null },
    eSignatureCoMaker: { file: null }
  });

  // Helpers to convert between File and dataURL
  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

  const dataUrlToFile = async (dataUrl: string, name: string, type: string) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type });
  };

  // Handle file upload
  const handleFileUpload = (type: keyof typeof files, file: File | null) => {
    (async () => {
      let preview: string | undefined;
      if (file) {
        try {
          preview = await fileToDataUrl(file);
        } catch (e) {
          console.error('Failed to generate preview for file:', e);
        }
      }
      setFiles(prev => ({
        ...prev,
        [type]: { file, preview }
      }));
    })();
  };

  // Load any saved files on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = loadFiles();
        if (!saved) return;
        const newFiles: Record<string, { file: File | null; preview?: string }> = {};
        for (const [key, meta] of Object.entries(saved)) {
          if (meta?.dataUrl) {
            try {
              const file = await dataUrlToFile(meta.dataUrl, meta.name, meta.type);
              newFiles[key] = { file, preview: meta.dataUrl };
            } catch (e) {
              newFiles[key] = { file: null };
            }
          } else {
            newFiles[key] = { file: null };
          }
        }
        setFiles(prev => ({ ...prev, ...newFiles }));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ProcessForm] Error loading saved files', err);
      }
    })();
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist files to storage whenever they change (debounced)
  useEffect(() => {
    let mounted = true;
    const save = async () => {
      try {
        const entries: Record<string, { name: string; type: string; size: number; dataUrl: string } | null> = {};
        await Promise.all(
          Object.entries(files).map(async ([key, value]) => {
            const { file, preview } = value;
            if (file && preview) {
              entries[key] = { 
                name: file.name, 
                type: file.type, 
                size: file.size, 
                dataUrl: preview 
              };
            } else {
              entries[key] = null;
            }
          })
        );
        if (mounted) saveFiles(entries);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ProcessForm] Error saving files to storage', err);
      }
    };

    // small debounce to avoid excessive writes
    const id = setTimeout(save, 250);
    return () => {
      mounted = false;
      clearTimeout(id);
    };
  }, [files]);

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
        // Debugging: log the payload being submitted so we can confirm the job/position value
        console.log('[ProcessForm] Submitting payload:', payload);
        const validation = validateFullApplication(payload);
        if (!validation.valid) {
          toast.error('Validation failed', { description: validation.errors.join('; ') });
          setIsSubmitting(false);
          return;
        }
      formDataToSend.append('request_data', JSON.stringify(payload));

      // Only add files that are present, skip empty ones
      Object.entries(files).forEach(([key, value]) => {
        if (value.file) {
          formDataToSend.append(key, value.file);
        }
        // Don't append anything for missing files
      });

      // Send everything in one request
      const result = (await createLoanApplication(formDataToSend, token)) as ApplicationResponse;

      // Set result and show success message
      setLoanResult(result);
      toast.success('Loan application created successfully');

      // Clear all form data and files
      handleNewApplicant();  // This will clear form data and navigate to step 1
    } catch (err: any) {
      console.error('Create application failed:', err);
      let errorMessage = 'Failed to create loan application';
      
      // Try to extract a meaningful error message
      if (err.message) {
        try {
          // Check if the error message is JSON
          const parsed = JSON.parse(err.message);
          errorMessage = parsed.detail || parsed.message || err.message;
        } catch {
          // If not JSON, use the error message directly
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      toast.error('Error', { 
        description: errorMessage,
        duration: 5000  // Show error for 5 seconds
      });
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
    // clear files both in state and storage
    setFiles({
      profilePhoto: { file: null },
      validId: { file: null },
      brgyCert: { file: null },
      payslip: { file: null },
      companyId: { file: null },
      proofOfBilling: { file: null },
      eSignaturePersonal: { file: null },
      eSignatureCoMaker: { file: null }
    });
    clearFiles();
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
            existingFiles={files}
          />
        );
      case 2:
        return (
          <EmployeeDataForm
            data={formData.employee}
            updateData={(data) => updateFormData("employee", data)}
            onFileUpload={handleFileUpload}
            existingFiles={files}
          />
        );
      case 3:
        return (
          <OtherDataForm
            data={formData.other}
            updateData={(data) => updateFormData("other", data)}
            onFileUpload={handleFileUpload}
            existingFiles={files}
          />
        );
      case 4:
        return (
          <CoMakerDataForm
            data={formData.coMaker}
            updateData={(data) => updateFormData("coMaker", data)}
            onFileUpload={handleFileUpload}
            existingFiles={files}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-gray-200 shadow-lg">
      <CardHeader className="pb-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
        <div className="space-y-4">
          <div>
            <CardTitle className="text-3xl text-gray-900 mb-2">
              Loan Application Form
            </CardTitle>
            <p className="text-gray-500 text-sm">Complete all sections to submit your application</p>
          </div>
          <StepProgress
            currentStep={currentStep}
            totalSteps={4}
            steps={steps}
            onStepClick={goToStep}
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto py-8 px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">{renderStepForm()}</div>
        </div>
      </CardContent>

      {/* Navigation Buttons - Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-6 shadow-lg">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-8 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </Button>

          <div className="text-center flex-1">
            <p className="text-sm text-gray-500">
              Step {currentStep} of 4
            </p>
          </div>

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                className="px-8 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all"
              >
                Next →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Submitting...
                  </>
                ) : (
                  '✓ Submit Application'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}