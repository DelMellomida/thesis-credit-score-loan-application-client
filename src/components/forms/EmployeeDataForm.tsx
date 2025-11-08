"use client";

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { EmployeeData } from '../../app/page';
import { Upload, Check, X } from 'lucide-react';
import { EMPLOYMENT_SECTOR, SALARY_FREQUENCY } from "../../lib/utils/constants";

type FileType = 'payslip' | 'companyId' | 'profilePhoto' | 'validId' | 'brgyCert' | 'proofOfBilling' | 'eSignaturePersonal' | 'eSignatureCoMaker';

interface EmployeeDataFormProps {
  data: EmployeeData;
  updateData: (data: Partial<EmployeeData>) => void;
  onFileUpload: (type: FileType, file: File | null) => void;
  existingFiles?: Record<string, any>;
}

interface FileUpload {
  id: string;
  name: string;
  size: string;
  type: string;
  file: File;
  preview?: string;
}

export function EmployeeDataForm({ data, updateData, onFileUpload, existingFiles }: EmployeeDataFormProps) {
  const [uploads, setUploads] = useState<{
    payslip: FileUpload | null;
    companyId: FileUpload | null;
  }>({
    payslip: null,
    companyId: null,
  });

  // Synchronize with parent file state
  React.useEffect(() => {
    const types = ['payslip', 'companyId'] as const;
    const newUploads: Record<string, FileUpload | null> = {};

    types.forEach(type => {
      const parentFile = existingFiles?.[type];
      if (parentFile?.file) {
        const f = parentFile.file;
        newUploads[type] = {
          id: crypto.randomUUID(),
          name: f.name,
          size: (f.size / 1024).toFixed(2) + ' KB',
          type: f.type,
          file: f,
          preview: parentFile.preview
        };
      } else {
        newUploads[type] = null;
      }
    });

    setUploads(prev => {
      let hasChanges = false;
      for (const type of types) {
        // Check if the file has changed
        if (prev[type]?.file !== newUploads[type]?.file) {
          hasChanges = true;
          break;
        }
      }
      return hasChanges ? { ...prev, ...newUploads } : prev;
    });
  }, [existingFiles]);

  const handleInputChange = (field: keyof EmployeeData, value: string) => {
    updateData({ [field]: value });
  };

  const handleFileUpload = async (
    type: 'payslip' | 'companyId',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.target;
    const file = input.files?.[0];
    
    if (file) {
      // Generate preview
      let preview: string | undefined;
      try {
        preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (e) {
        console.error('Failed to generate preview:', e);
      }

      const fileUpload: FileUpload = {
        id: crypto.randomUUID(),
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
        type: file.type,
        file: file,
        preview
      };

      setUploads(prev => ({
        ...prev,
        [type]: fileUpload
      }));
      
      onFileUpload(type, file);
      
      // Debug log
      console.log(`[EmployeeDataForm] Uploaded file for ${type}:`, file.name);
    }
    
    // Reset input to allow uploading the same file again
    input.value = '';
  };

  const removeFile = (type: 'payslip' | 'companyId') => {
    setUploads((prev) => ({
      ...prev,
      [type]: null,
    }));
    onFileUpload(type, null);
  };

  const UploadButton = ({
    label,
    type,
    accept,
  }: {
    label: string;
    type: 'payslip' | 'companyId';
    accept: string;
  }) => (
    <div className="flex flex-col gap-2">
      <label className="relative">
        <input
          type="file"
          accept={accept}
          data-type={type}
          onChange={(e) => handleFileUpload(type, e)}
          className="hidden"
        />
        <div className="h-8 w-[180px] text-xs bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer flex items-center justify-center gap-2 transition-colors">
          <Upload size={14} />
          {label}
        </div>
      </label>

      {uploads[type] && (
        <div 
          key={uploads[type].id}
          className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-md p-2 w-[180px] mt-2"
        >
          <Check size={14} className="text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="truncate text-green-800 font-medium">
              {uploads[type].name}
            </div>
            <div className="text-green-600">{uploads[type].size}</div>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <UploadButton 
          label="UPLOAD PAYSLIP" 
          type="payslip" 
          accept="image/*,.pdf" 
        />
        <UploadButton 
          label="UPLOAD COMPANY ID" 
          type="companyId" 
          accept="image/*,.pdf" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            placeholder="Enter company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Select value={data.sector} onValueChange={(value) => handleInputChange('sector', value)}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPLOYMENT_SECTOR.PUBLIC}>{EMPLOYMENT_SECTOR.PUBLIC}</SelectItem>
              <SelectItem value={EMPLOYMENT_SECTOR.PRIVATE}>{EMPLOYMENT_SECTOR.PRIVATE}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={data.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            placeholder="Enter job position"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employmentDuration">Employment Duration</Label>
          <Select value={data.employmentDuration} onValueChange={(value) => handleInputChange('employmentDuration', value)}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6 months">6 months</SelectItem>
              <SelectItem value="1 year" className="cursor-pointer">1 year</SelectItem>
              <SelectItem value="2 years" className="cursor-pointer">2 years</SelectItem>
              <SelectItem value="3 years" className="cursor-pointer">3 years</SelectItem>
              <SelectItem value="5 years" className="cursor-pointer">5 years</SelectItem>
              <SelectItem value="10 years" className="cursor-pointer">10 years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input
            id="salary"
            value={data.salary}
            onChange={(e) => handleInputChange('salary', e.target.value)}
            placeholder="Enter monthly salary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="typeOfSalary">Type of Salary</Label>
          <Select value={data.typeOfSalary} onValueChange={(value) => handleInputChange('typeOfSalary', value)}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Select salary type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SALARY_FREQUENCY.MONTHLY}>{SALARY_FREQUENCY.MONTHLY}</SelectItem>
              <SelectItem value={SALARY_FREQUENCY.BIMONTHLY}>{SALARY_FREQUENCY.BIMONTHLY}</SelectItem>
              <SelectItem value={SALARY_FREQUENCY.BIWEEKLY}>{SALARY_FREQUENCY.BIWEEKLY}</SelectItem>
              <SelectItem value={SALARY_FREQUENCY.WEEKLY}>{SALARY_FREQUENCY.WEEKLY}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}