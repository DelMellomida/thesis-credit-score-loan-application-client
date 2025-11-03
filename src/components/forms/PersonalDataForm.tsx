import React, { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PersonalData } from "../../app/page";
import { Upload, Check, X } from "lucide-react";
import { HOUSING_STATUS, YES_NO } from "../../lib/constants";

type FileType = 'profilePhoto' | 'validId' | 'brgyCert' | 'payslip' | 'companyId' | 'proofOfBilling' | 'eSignaturePersonal' | 'eSignatureCoMaker';

interface PersonalDataFormProps {
  data: PersonalData;
  updateData: (data: Partial<PersonalData>) => void;
  onFileUpload: (type: FileType, file: File | null) => void;
}

interface FileUpload {
  name: string;
  size: string;
  type: string;
  file: File;
}

export function PersonalDataForm({ data, updateData, onFileUpload }: PersonalDataFormProps) {
  const [uploads, setUploads] = useState<{
    photo: FileUpload | null;
    validId: FileUpload | null;
    brgyCert: FileUpload | null;
    signature: FileUpload | null;
  }>({
    photo: null,
    validId: null,
    brgyCert: null,
    signature: null,
  });

  const handleInputChange = (field: keyof PersonalData, value: string) => {
    updateData({ [field]: value });
  };

  const handleFileUpload = (
    type: "photo" | "validId" | "brgyCert" | "signature",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploads((prev) => ({
        ...prev,
        [type]: {
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
          type: file.type,
          file: file,
        },
      }));
      
      // Map the internal type names to the API's expected file names
      const fileTypeMap: Record<"photo" | "validId" | "brgyCert" | "signature", FileType> = {
        photo: 'profilePhoto',
        validId: 'validId',
        brgyCert: 'brgyCert',
        signature: 'eSignaturePersonal'
      };
      
      onFileUpload(fileTypeMap[type], file);
    }
  };

  const removeFile = (type: "photo" | "validId" | "brgyCert" | "signature") => {
    setUploads((prev) => ({
      ...prev,
      [type]: null,
    }));
    
    // Map the internal type names to the API's expected file names
    const fileTypeMap: Record<"photo" | "validId" | "brgyCert" | "signature", FileType> = {
      photo: 'profilePhoto',
      validId: 'validId',
      brgyCert: 'brgyCert',
      signature: 'eSignaturePersonal'
    };
    
    onFileUpload(fileTypeMap[type], null);
  };

  const UploadButton = ({
    label,
    type,
    accept,
  }: {
    label: string;
    type: "photo" | "validId" | "brgyCert" | "signature";
    accept: string;
  }) => (
    <div className="flex flex-col gap-2">
      <label className="relative">
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFileUpload(type, e)}
          className="hidden"
        />
        <div className="h-8 w-[180px] text-xs bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer flex items-center justify-center gap-2 transition-colors">
          <Upload size={14} />
          {label}
        </div>
      </label>

      {uploads[type] && (
        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-md p-2 w-[180px]">
          <Check size={14} className="text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="truncate text-green-800 font-medium">
              {uploads[type]!.name}
            </div>
            <div className="text-green-600">{uploads[type]!.size}</div>
          </div>
          <button
            onClick={() => removeFile(type)}
            className="flex-shrink-0 text-red-500 hover:text-red-700"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <UploadButton label="UPLOAD PHOTO" type="photo" accept="image/*" />
        <UploadButton
          label="UPLOAD VALID ID"
          type="validId"
          accept="image/*,.pdf"
        />
        <UploadButton
          label="UPLOAD BRGY CERTIFICATE"
          type="brgyCert"
          accept="image/*,.pdf"
        />
        <UploadButton
          label="UPLOAD E - SIGNATURE"
          type="signature"
          accept="image/*"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            placeholder="Enter full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNo">Contact No</Label>
          <Input
            id="contactNo"
            value={data.contactNo}
            onChange={(e) => handleInputChange("contactNo", e.target.value)}
            placeholder="Enter contact number"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="Enter complete address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="headOfHousehold">Head of Household</Label>
          <Select
            onValueChange={(value) =>
              handleInputChange("headOfHousehold", value)
            }
          >
            <SelectTrigger className="cursor-pointer"> 
              <SelectValue placeholder="Select head of household" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes" className="cursor-pointer">Yes (Self)</SelectItem>
              <SelectItem value="No" className="cursor-pointer">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dependents">Dependents</Label>
          <Select
            onValueChange={(value) => handleInputChange("dependents", value)}
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Number of dependents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0" className="cursor-pointer">0</SelectItem>
              <SelectItem value="1" className="cursor-pointer">1</SelectItem>
              <SelectItem value="2" className="cursor-pointer">2</SelectItem>
              <SelectItem value="3" className="cursor-pointer">3</SelectItem>
              <SelectItem value="4" className="cursor-pointer">4</SelectItem>
              <SelectItem value="5+" className="cursor-pointer">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="yearsLivingHere">Years of Living Here</Label>
          <Input
            id="yearsLivingHere"
            value={data.yearsLivingHere}
            onChange={(e) =>
              handleInputChange("yearsLivingHere", e.target.value)
            }
            placeholder="Enter number of years"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="housingStatus">Housing Status</Label>
          <Select
            onValueChange={(value) => handleInputChange("housingStatus", value)}
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Select housing status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Owned">Owned</SelectItem>
              <SelectItem value="Rented">Rented</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 