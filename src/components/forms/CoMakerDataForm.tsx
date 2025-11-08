"use client";

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CoMakerData } from '../../app/page';
import { Upload, Check, X } from 'lucide-react';
import { COMAKER_RELATIONSHIP } from "../../lib/utils/constants";

type FileType = 'profilePhoto' | 'validId' | 'brgyCert' | 'payslip' | 'companyId' | 'proofOfBilling' | 'eSignaturePersonal' | 'eSignatureCoMaker';

interface CoMakerDataFormProps {
  data: CoMakerData;
  updateData: (data: Partial<CoMakerData>) => void;
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

export function CoMakerDataForm({ data, updateData, onFileUpload, existingFiles }: CoMakerDataFormProps) {
  const [uploads, setUploads] = useState<{
    signature: FileUpload | null;
  }>({
    signature: null,
  });

  // Synchronize with parent file state
  React.useEffect(() => {
    const newUploads: Record<string, FileUpload | null> = {};
    const parentFile = existingFiles?.eSignatureCoMaker;

    if (parentFile?.file) {
      const f = parentFile.file;
      newUploads.signature = {
        id: crypto.randomUUID(),
        name: f.name,
        size: (f.size / 1024).toFixed(2) + ' KB',
        type: f.type,
        file: f,
        preview: parentFile.preview
      };
    } else {
      newUploads.signature = null;
    }

    setUploads(prev => {
      // Check if the file has changed
      const hasChanged = prev.signature?.file !== newUploads.signature?.file;
      return hasChanged ? { ...prev, ...newUploads } : prev;
    });
  }, [existingFiles]);

  const handleInputChange = (field: keyof CoMakerData, value: string) => {
    updateData({ [field]: value });
  };

  const handleFileUpload = async (
    type: 'signature',
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
      
      onFileUpload('eSignatureCoMaker', file);
      
      // Debug log
      console.log(`[CoMakerDataForm] Uploaded file for signature:`, file.name);
    }
    
    // Reset input to allow uploading the same file again
    input.value = '';
  };

  const removeFile = (type: 'signature') => {
    setUploads((prev) => ({
      ...prev,
      [type]: null,
    }));
    onFileUpload('eSignatureCoMaker', null);
  };

  const UploadButton = ({
    label,
    type,
    accept,
  }: {
    label: string;
    type: 'signature';
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
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
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="Enter co-maker's full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNo">Contact No</Label>
          <Input
            id="contactNo"
            value={data.contactNo}
            onChange={(e) => handleInputChange('contactNo', e.target.value)}
            placeholder="Enter contact number"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Enter complete address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="howManyMonthsYears">How many months/years</Label>
          <Select value={data.howManyMonthsYears} onValueChange={(value) => handleInputChange('howManyMonthsYears', value)}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6 months" className="cursor-pointer">6 months</SelectItem>
              <SelectItem value="1 year" className="cursor-pointer">1 year</SelectItem>
              <SelectItem value="2 years" className="cursor-pointer">2 years</SelectItem>
              <SelectItem value="3 years" className="cursor-pointer">3 years</SelectItem>
              <SelectItem value="5 years" className="cursor-pointer">5 years</SelectItem>
              <SelectItem value="10 years" className="cursor-pointer">10 years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input
            id="salary"
            value={data.salary}
            onChange={(e) => handleInputChange('salary', e.target.value)}
            placeholder="Enter monthly salary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationshipWithApplicant">Relationship with the Applicant</Label>
  <Select value={data.relationshipWithApplicant} onValueChange={(value) => handleInputChange('relationshipWithApplicant', value)}>
          <SelectTrigger className="cursor-pointer">
            <SelectValue placeholder="Select relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={COMAKER_RELATIONSHIP.SPOUSE} className="cursor-pointer">{COMAKER_RELATIONSHIP.SPOUSE}</SelectItem>
            <SelectItem value={COMAKER_RELATIONSHIP.PARENT} className="cursor-pointer">{COMAKER_RELATIONSHIP.PARENT}</SelectItem>
            <SelectItem value={COMAKER_RELATIONSHIP.SIBLING} className="cursor-pointer">{COMAKER_RELATIONSHIP.SIBLING}</SelectItem>
            <SelectItem value={COMAKER_RELATIONSHIP.FRIEND} className="cursor-pointer">{COMAKER_RELATIONSHIP.FRIEND}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}