// Utility to transform frontend FormData to backend FullLoanApplicationRequest
import { FormData } from '../../app/page';
import {
  EMPLOYMENT_SECTOR,
  SALARY_FREQUENCY,
  HOUSING_STATUS,
  YES_NO,
  COMAKER_RELATIONSHIP,
  COMMUNITY_ROLE,
  PALUWAGAN_PARTICIPATION,
  OTHER_INCOME_SOURCE,
  DISASTER_PREPAREDNESS
} from './constants';

export function transformLoanFormData(formData: FormData) {
  // Helper to parse years/months into months
  function parseYearsToMonths(duration: string): number {
    const yearsMatch = duration.match(/(\d+)\s*years?/i);
    const monthsMatch = duration.match(/(\d+)\s*months?/i);
    
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 0;
    
    return (years * 12) + months;
  }

  // Helper to parse currency to number
  function parseCurrency(amount: string): number {
    return parseFloat(amount.replace(/[₱,]/g, '')) || 0;
  }

  // Helper to parse string to number with fallback
  function parseStringToInt(value: string, fallback: number = 0): number {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  // Normalize head of household to Yes/No
  function normalizeHeadOfHousehold(value: string): typeof YES_NO[keyof typeof YES_NO] {
    return value.toLowerCase() === 'self' ? YES_NO.YES : YES_NO.NO;
  }

  // Map housing status to enum
  function mapHousingStatus(status: string): typeof HOUSING_STATUS[keyof typeof HOUSING_STATUS] {
    return status.toLowerCase() === 'owned' ? HOUSING_STATUS.OWNED : HOUSING_STATUS.RENTED;
  }

  // Transform
  return {
    applicant_info: {
      full_name: formData.personal.fullName,
      contact_number: formData.personal.contactNo,
      address: formData.personal.address,
      salary: formData.employee.salary,
      job: formData.employee.position,
      company_name: formData.employee.companyName
    },
    comaker_info: {
      full_name: formData.coMaker.fullName,
      contact_number: formData.coMaker.contactNo,
      address: formData.coMaker.address
    },
    model_input_data: {
      Employment_Sector: formData.employee.sector === 'public' ? EMPLOYMENT_SECTOR.PUBLIC : EMPLOYMENT_SECTOR.PRIVATE,
      Employment_Tenure_Months: parseYearsToMonths(formData.employee.employmentDuration),
      Net_Salary_Per_Cutoff: parseCurrency(formData.employee.salary),
      Salary_Frequency: formData.employee.typeOfSalary as typeof SALARY_FREQUENCY[keyof typeof SALARY_FREQUENCY],
      Housing_Status: mapHousingStatus(formData.personal.housingStatus),
      Years_at_Current_Address: parseStringToInt(formData.personal.yearsLivingHere.split(' ')[0]),
      Household_Head: normalizeHeadOfHousehold(formData.personal.headOfHousehold),
      Number_of_Dependents: parseStringToInt(formData.personal.dependents),
      Comaker_Relationship: formData.coMaker.relationshipWithApplicant as typeof COMAKER_RELATIONSHIP[keyof typeof COMAKER_RELATIONSHIP],
      Comaker_Employment_Tenure_Months: parseYearsToMonths(formData.coMaker.howManyMonthsYears),
      Comaker_Net_Salary_Per_Cutoff: parseCurrency(formData.coMaker.salary),
      Has_Community_Role: formData.other.communityPosition as typeof COMMUNITY_ROLE[keyof typeof COMMUNITY_ROLE],
      Paluwagan_Participation: formData.other.paluwagaParticipation as typeof PALUWAGAN_PARTICIPATION[keyof typeof PALUWAGAN_PARTICIPATION],
      Other_Income_Source: formData.other.otherIncomeSources as typeof OTHER_INCOME_SOURCE[keyof typeof OTHER_INCOME_SOURCE],
      Disaster_Preparedness: formData.other.disasterPreparednessStrategy as typeof DISASTER_PREPAREDNESS[keyof typeof DISASTER_PREPAREDNESS],
      Is_Renewing_Client: 0, // Set as needed
      Grace_Period_Usage_Rate: 0.0, // Set as needed
      Late_Payment_Count: 0, // Set as needed
      Had_Special_Consideration: 0, // Set as needed
    },
  };
}
