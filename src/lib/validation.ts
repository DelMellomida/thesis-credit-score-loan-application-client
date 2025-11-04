export interface ValidationResult {
  valid: boolean;
  errors: string[];
  transformedData?: any;
  isUpdate?: boolean;
}

export const Enums = {
  JOBS: ["Teacher", "Security Guard", "Seaman", "Others"] as const,
  EMPLOYMENT_SECTORS: ["Public", "Private"] as const,
  SALARY_FREQUENCIES: ["Monthly", "Bimonthly", "Biweekly", "Weekly"] as const,
  HOUSING: ["Owned", "Rented"] as const,
  YES_NO: ["Yes", "No"] as const,
  COMAKER_RELATIONSHIPS: ["Spouse", "Sibling", "Parent", "Friend"] as const,
  COMMUNITY_ROLES: ["None", "Member", "Leader", "Multiple Leader"] as const,
  PALUWAGAN: ["Never", "Rarely", "Sometimes", "Frequently"] as const,
  OTHER_INCOME: ["None", "OFW Remittance", "Freelance", "Business"] as const,
  DISASTER: ["None", "Savings", "Insurance", "Community Plan"] as const,
  APPLICATION_STATUS: ["Pending", "Approved", "Denied", "Cancelled"] as const
} as const;

export type EnumKeys = keyof typeof Enums;

function isPositiveInteger(value: any) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: any) {
  return Number.isInteger(value) && value >= 0;
}

function isPositiveNumber(value: any) {
  return typeof value === 'number' && isFinite(value) && value > 0;
}

export function validateFullApplication(payload: any, isUpdate: boolean = false): ValidationResult {
  const errors: string[] = [];
  const transformedData = JSON.parse(JSON.stringify(payload));

  if (!payload) {
    return { valid: false, errors: ["Missing payload"], isUpdate };
  }

  const applicant = transformedData.applicant_info || {};
  if (!applicant.full_name?.trim() || applicant.full_name.trim().length < 3) {
    errors.push('Full name is required and must be at least 3 characters');
  }
  
  if (!applicant.contact_number || !/^\+?[0-9\-\s]{7,20}$/.test(applicant.contact_number)) {
    errors.push('Contact number must contain only digits, spaces, dashes, or leading + (7-20 chars)');
  }

  if (!applicant.address?.trim() || applicant.address.trim().length < 5) {
    errors.push('Address is required and must be at least 5 characters');
  }

  if (!applicant.salary?.trim()) {
    errors.push('Salary is required');
  }

  if (!applicant.job) {
    errors.push('Job is required');
  } else if (!["Teacher", "Security Guard", "Seaman"].includes(applicant.job)) {
    transformedData.applicant_info.job = "Others";
  }

  const comaker = transformedData.comaker_info || {};
  if (!comaker.full_name?.trim() || comaker.full_name.trim().length < 3) {
    errors.push('Co-maker full name is required and must be at least 3 characters');
  }

  if (!comaker.contact_number || !/^\+?[0-9\-\s]{7,20}$/.test(comaker.contact_number)) {
    errors.push('Co-maker contact number must contain only digits, spaces, dashes, or leading + (7-20 chars)');
  }

  const model = transformedData.model_input_data || {};
  const modelInputDataErrors: string[] = [];
  
  if (!model.Employment_Sector || !Enums.EMPLOYMENT_SECTORS.includes(model.Employment_Sector)) {
    modelInputDataErrors.push('Employment sector must be Public or Private');
  }

  if (!isPositiveInteger(model.Employment_Tenure_Months)) {
    modelInputDataErrors.push('Employment tenure must be a positive integer');
  }

  if (!isPositiveNumber(model.Net_Salary_Per_Cutoff)) {
    modelInputDataErrors.push('Net salary per cutoff must be greater than 0');
  }

  if (!model.Salary_Frequency || !Enums.SALARY_FREQUENCIES.includes(model.Salary_Frequency)) {
    modelInputDataErrors.push('Salary frequency must be Monthly, Bimonthly, Biweekly, or Weekly');
  }

  if (!model.Housing_Status || !Enums.HOUSING.includes(model.Housing_Status)) {
    modelInputDataErrors.push('Housing status must be Owned or Rented');
  }

  if (typeof model.Years_at_Current_Address !== 'number' || model.Years_at_Current_Address < 0) {
    modelInputDataErrors.push('Years at current address must be 0 or greater');
  }

  if (!model.Household_Head || !Enums.YES_NO.includes(model.Household_Head)) {
    modelInputDataErrors.push('Household head must be Yes or No');
  }

  if (!isNonNegativeInteger(model.Number_of_Dependents)) {
    modelInputDataErrors.push('Number of dependents must be 0 or greater');
  }

  if (!model.Comaker_Relationship || !Enums.COMAKER_RELATIONSHIPS.includes(model.Comaker_Relationship)) {
    modelInputDataErrors.push('Co-maker relationship must be Spouse, Sibling, Parent, or Friend');
  }

  if (!isPositiveInteger(model.Comaker_Employment_Tenure_Months)) {
    modelInputDataErrors.push("Co-maker's employment tenure must be greater than 0");
  }

  if (!isPositiveNumber(model.Comaker_Net_Salary_Per_Cutoff)) {
    modelInputDataErrors.push("Co-maker's net salary per cutoff must be greater than 0");
  }

  if (!model.Has_Community_Role || !Enums.COMMUNITY_ROLES.includes(model.Has_Community_Role)) {
    modelInputDataErrors.push('Community role must be None, Member, Leader, or Multiple Leader');
  }

  if (!model.Paluwagan_Participation || !Enums.PALUWAGAN.includes(model.Paluwagan_Participation)) {
    modelInputDataErrors.push('Paluwagan participation must be Never, Rarely, Sometimes, or Frequently');
  }

  if (!model.Other_Income_Source || !Enums.OTHER_INCOME.includes(model.Other_Income_Source)) {
    modelInputDataErrors.push('Other income source must be None, OFW Remittance, Freelance, or Business');
  }

  if (!model.Disaster_Preparedness || !Enums.DISASTER.includes(model.Disaster_Preparedness)) {
    modelInputDataErrors.push('Disaster preparedness must be None, Savings, Insurance, or Community Plan');
  }

  // Always sanitize these values whether they're valid or not
  transformedData.model_input_data = {
    ...transformedData.model_input_data,
    Is_Renewing_Client: Number(Boolean(model.Is_Renewing_Client)),
    Grace_Period_Usage_Rate: Math.max(0, Math.min(1, Number(model.Grace_Period_Usage_Rate) || 0)),
    Late_Payment_Count: Math.max(0, Number(model.Late_Payment_Count) || 0),
    Had_Special_Consideration: Number(Boolean(model.Had_Special_Consideration))
  };

  // For updates, we only include validation errors for fields that are present
  if (isUpdate) {
    errors.push(...modelInputDataErrors.filter((_, index) => 
      Object.keys(model).includes(Object.keys(transformedData.model_input_data)[index])
    ));
  } else {
    errors.push(...modelInputDataErrors);
  }

  // Trim all string values
  transformedData.applicant_info = Object.entries(transformedData.applicant_info).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: typeof value === 'string' ? value.trim() : value
  }), {});

  transformedData.comaker_info = Object.entries(transformedData.comaker_info).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: typeof value === 'string' ? value.trim() : value
  }), {});

  return {
    valid: errors.length === 0,
    errors,
    transformedData: errors.length === 0 ? transformedData : undefined,
    isUpdate
  };
}

export default validateFullApplication;
