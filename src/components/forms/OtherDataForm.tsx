"use client";

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { OtherData } from '../../app/page';
import { Upload, Check, X } from 'lucide-react';
import { COMMUNITY_ROLE, PALUWAGAN_PARTICIPATION, OTHER_INCOME_SOURCE, DISASTER_PREPAREDNESS } from "../../lib/utils/constants";

type FileType = 'profilePhoto' | 'validId' | 'brgyCert' | 'payslip' | 'companyId' | 'proofOfBilling' | 'eSignaturePersonal' | 'eSignatureCoMaker';

interface OtherDataFormProps {
  data: OtherData;
  updateData: (data: Partial<OtherData>) => void;
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

export function OtherDataForm({ data, updateData, onFileUpload, existingFiles }: OtherDataFormProps) {
  const [uploads, setUploads] = useState<{
    proofOfBilling: FileUpload | null;
  }>({
    proofOfBilling: null,
  });

  // Synchronize with parent file state
  React.useEffect(() => {
    const types = ['proofOfBilling'] as const;
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
  }, [existingFiles]);  const handleInputChange = (field: keyof OtherData, value: string) => {
    updateData({ [field]: value });
  };

  const handleFileUpload = async (
    type: 'proofOfBilling',
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
      console.log(`[OtherDataForm] Uploaded file for ${type}:`, file.name);
    }
    
    // Reset input to allow uploading the same file again
    input.value = '';
  };

  const removeFile = (type: 'proofOfBilling') => {
    // Clear local state
    setUploads(prev => ({
      ...prev,
      [type]: null
    }));

    // Notify parent component
    onFileUpload(type, null);

    // Debug log
    console.log(`[${type}] File removed`);

    // Reset any related file input
    const input = document.querySelector(`input[data-type="${type}"]`) as HTMLInputElement;
    if (input) input.value = '';
  };

  const UploadButton = ({
    label,
    type,
    accept,
  }: {
    label: string;
    type: 'proofOfBilling';
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <UploadButton 
          label="UPLOAD PROOF OF BILLING" 
          type="proofOfBilling" 
          accept="image/*,.pdf" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="communityPosition">Community Position</Label>
          <Select value={data.communityPosition} onValueChange={(value) => handleInputChange('communityPosition', value)}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="Select community position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={COMMUNITY_ROLE.NONE}>{COMMUNITY_ROLE.NONE}</SelectItem>
              <SelectItem value={COMMUNITY_ROLE.MEMBER}>{COMMUNITY_ROLE.MEMBER}</SelectItem>
              <SelectItem value={COMMUNITY_ROLE.LEADER}>{COMMUNITY_ROLE.LEADER}</SelectItem>
              <SelectItem value={COMMUNITY_ROLE.MULTIPLE_LEADER}>{COMMUNITY_ROLE.MULTIPLE_LEADER}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paluwagaParticipation">Paluwaga Participation</Label>
          <Select value={data.paluwagaParticipation} onValueChange={(value) => handleInputChange('paluwagaParticipation', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select participation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PALUWAGAN_PARTICIPATION.NEVER}>{PALUWAGAN_PARTICIPATION.NEVER}</SelectItem>
              <SelectItem value={PALUWAGAN_PARTICIPATION.RARELY}>{PALUWAGAN_PARTICIPATION.RARELY}</SelectItem>
              <SelectItem value={PALUWAGAN_PARTICIPATION.SOMETIMES}>{PALUWAGAN_PARTICIPATION.SOMETIMES}</SelectItem>
              <SelectItem value={PALUWAGAN_PARTICIPATION.FREQUENTLY}>{PALUWAGAN_PARTICIPATION.FREQUENTLY}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otherIncomeSources">Other Income Source</Label>
  <Select value={data.otherIncomeSources} onValueChange={(value) => handleInputChange('otherIncomeSources', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select other income source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OTHER_INCOME_SOURCE.NONE}>{OTHER_INCOME_SOURCE.NONE}</SelectItem>
            <SelectItem value={OTHER_INCOME_SOURCE.OFW_REMITTANCE}>{OTHER_INCOME_SOURCE.OFW_REMITTANCE}</SelectItem>
            <SelectItem value={OTHER_INCOME_SOURCE.FREELANCE}>{OTHER_INCOME_SOURCE.FREELANCE}</SelectItem>
            <SelectItem value={OTHER_INCOME_SOURCE.BUSINESS}>{OTHER_INCOME_SOURCE.BUSINESS}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="disasterPreparednessStrategy">Disaster Preparedness</Label>
  <Select value={data.disasterPreparednessStrategy} onValueChange={(value) => handleInputChange('disasterPreparednessStrategy', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select disaster preparedness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DISASTER_PREPAREDNESS.NONE}>{DISASTER_PREPAREDNESS.NONE}</SelectItem>
            <SelectItem value={DISASTER_PREPAREDNESS.SAVINGS}>{DISASTER_PREPAREDNESS.SAVINGS}</SelectItem>
            <SelectItem value={DISASTER_PREPAREDNESS.INSURANCE}>{DISASTER_PREPAREDNESS.INSURANCE}</SelectItem>
            <SelectItem value={DISASTER_PREPAREDNESS.COMMUNITY_PLAN}>{DISASTER_PREPAREDNESS.COMMUNITY_PLAN}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}