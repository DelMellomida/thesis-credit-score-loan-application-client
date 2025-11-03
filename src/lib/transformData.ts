import type { Applicant } from '@/components/ApplicantList';
import type { ApplicationResponse, ModelInputData } from './types';

export function transformToApplicant(application: ApplicationResponse & { documents?: Record<string, string | null> }): Applicant {
  // Get the MongoDB _id from the response
  const id = application._id?.$oid || '';

  // Map backend status to frontend status
  let status: 'pending' | 'approved' | 'denied';
  switch (application.status?.toLowerCase()) {
    case 'approved':
      status = 'approved';
      break;
    case 'denied':
    case 'rejected':
      status = 'denied';
      break;
    default:
      status = 'pending';
  }

  // Extract city from address if available
  // Defensive access for applicant_info and address
  const applicantInfo = application.applicant_info || { full_name: '', contact_number: '', address: '', salary: '0', job: '' };
  const addressParts = (applicantInfo.address || '').split(',');
  const brgyCity = addressParts.length > 1 ? addressParts[1].trim() : (addressParts[0] || '').trim();

  // Helper function to check if a value exists and isn't null/undefined/empty
  const hasValue = (value: any) => value !== null && value !== undefined && value !== '';

  // Helper function to format currency
  const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return undefined;
    if (typeof amount === 'string' && amount.startsWith('₱')) return amount;
    return `₱${Number(amount).toLocaleString()}`;
  };

  // Helper function to format duration in years and months
  const formatDuration = (months: number | undefined) => {
    if (!months) return undefined;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} months`;
    if (remainingMonths === 0) return `${years} years`;
    return `${years} years ${remainingMonths} months`;
  };

  // Get model input data with safe access and proper typing
  const modelData = application.model_input_data || {} as ModelInputData;

  // Transform backend data into the expected formData structure with improved value handling
  const formData = {
    personal: {
      fullName: applicantInfo.full_name,
      contactNo: applicantInfo.contact_number,
      address: applicantInfo.address,
      headOfHousehold: modelData.Household_Head || 'No',
      dependents: modelData.Number_of_Dependents?.toString() || '0',
      yearsLivingHere: modelData.Years_at_Current_Address ? `${modelData.Years_at_Current_Address} years` : 'Less than 1 year',
      housingStatus: modelData.Housing_Status || 'Renting'
    },
    employee: {
      companyName: applicantInfo?.company_name || applicantInfo.job || 'Self-employed',
      sector: modelData.Employment_Sector || 'Other',
      position: applicantInfo.job || 'Self-employed',
      employmentDuration: formatDuration(modelData.Employment_Tenure_Months) || 'Less than 1 year',
      salary: (application.applicant_info.salary || modelData.Net_Salary_Per_Cutoff?.toString() || '0').toString(),
      typeOfSalary: modelData.Salary_Frequency || 'Monthly'
    },
    other: {
      communityPosition: modelData.Has_Community_Role || 'None',
      paluwagaParticipation: modelData.Paluwagan_Participation || 'No',
      otherIncomeSources: modelData.Other_Income_Source || 'None',
      disasterPreparednessStrategy: modelData.Disaster_Preparedness || 'Basic preparations'
    },
    coMaker: {
      fullName: application.comaker_info?.full_name || '',
      contactNo: application.comaker_info?.contact_number || '',
      address: application.comaker_info?.address || 'Same as applicant',
      howManyMonthsYears: formatDuration(modelData.Comaker_Employment_Tenure_Months) || 'Less than 1 year',
      salary: formatCurrency(modelData.Comaker_Net_Salary_Per_Cutoff) || 'Information not provided',
      relationshipWithApplicant: modelData.Comaker_Relationship || 'Family member'
    }
  };

  // Format credit score with 2 decimal places and get recommendation count if exists
  const predictionResult = application.prediction_result;
  const creditScore = predictionResult?.final_credit_score 
    ? predictionResult.final_credit_score.toFixed(2)
    : 'N/A';
  const recommendationCount = predictionResult?.recommendation_count || 0;

  // Format salary with proper currency display
  const salaryDisplay = application.model_input_data?.Net_Salary_Per_Cutoff 
    ? `₱${application.model_input_data.Net_Salary_Per_Cutoff.toString()}` 
    : (applicantInfo.salary && typeof applicantInfo.salary === 'string' && applicantInfo.salary.startsWith('₱')) 
      ? applicantInfo.salary 
      : (applicantInfo.salary ? `₱${applicantInfo.salary}` : '₱0');

  return {
    id,
    name: applicantInfo.full_name,
    brgyCity: brgyCity,
    email: applicantInfo.contact_number, // Using contact number since email isn't available
    loanProduct: `Job: ${applicantInfo.job || 'N/A'}`,
    loanAmount: `${salaryDisplay} | Score: ${creditScore} (${recommendationCount} recommendations)`,
    status: status,
    formData: formData,
    timestamp: application.timestamp || new Date().toISOString() // Include the timestamp
  };
}