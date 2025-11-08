import { Position } from '../forms/positionValidation';

export interface PersonalFormData {
  fullName: string;
  contactNo: string;
  address: string;
  headOfHousehold: string;
  dependents: string;
  yearsLivingHere: string;
  housingStatus: string;
}

export interface EmployeeFormData {
  companyName: string;
  sector: string;
  position: Position;
  employmentDuration: string;
  salary: string;
  typeOfSalary: string;
}

export interface OtherFormData {
  communityPosition: string;
  paluwagaParticipation: string;
  otherIncomeSources: string;
  disasterPreparednessStrategy: string;
}

export interface CoMakerFormData {
  fullName: string;
  contactNo: string;
  address: string;
  howManyMonthsYears: string;
  salary: string;
  relationshipWithApplicant: string;
}

export interface FormData {
  personal: PersonalFormData;
  employee: EmployeeFormData;
  other: OtherFormData;
  coMaker: CoMakerFormData;
}