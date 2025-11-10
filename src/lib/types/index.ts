export interface ModelInputData {
  Employment_Sector: string;
  Employment_Tenure_Months: number;
  Net_Salary_Per_Cutoff: number;
  Salary_Frequency: string;
  Housing_Status: string;
  Years_at_Current_Address: number;
  Household_Head: string;
  Number_of_Dependents: number;
  Comaker_Relationship: string;
  Comaker_Employment_Tenure_Months: number;
  Comaker_Net_Salary_Per_Cutoff: number;
  Has_Community_Role: string;
  Paluwagan_Participation: string;
  Other_Income_Source: string;
  Disaster_Preparedness: string;
  Is_Renewing_Client: number;
  Grace_Period_Usage_Rate: number;
  Late_Payment_Count: number;
  Had_Special_Consideration: number;
}

export interface ApplicantInfo {
  full_name: string;
  contact_number: string;
  email: string;
  address: string;
  salary: string;
  job: string;
  company_name?: string;
}

export interface ComakerInfo {
  full_name: string;
  contact_number: string;
  address?: string;
}

export interface PredictionResult {
  final_credit_score: number;
  default: number;
  probability_of_default: number;
  status: string;
  recommendation_count: number;
  loan_recommendation?: any[];
  risk_level?: string;
  threshold_used?: number;
  cultural_component_scores?: any;
  detailed_cultural_analysis?: any;
}

interface MongoId {
  $oid: string;
}

interface BinaryId {
  $binary: {
    base64: string;
    subType: string;
  };
}

export interface ApplicationResponse {
  _id?: MongoId;
  application_id?: BinaryId | string;
  timestamp: string;
  status: string;
  loan_officer_id: string;
  applicant_info: ApplicantInfo;
  comaker_info: ComakerInfo;
  model_input_data?: ModelInputData;
  prediction_result: PredictionResult;
}