import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { OtherData } from '../../app/page';
import { Upload, Check, X } from 'lucide-react';
import { COMMUNITY_ROLE, PALUWAGAN_PARTICIPATION, OTHER_INCOME_SOURCE, DISASTER_PREPAREDNESS } from '../../lib/constants';

type FileType = 'profilePhoto' | 'validId' | 'brgyCert' | 'payslip' | 'companyId' | 'proofOfBilling' | 'eSignaturePersonal' | 'eSignatureCoMaker';

interface OtherDataFormProps {
  data: OtherData;
  updateData: (data: Partial<OtherData>) => void;
  onFileUpload: (type: FileType, file: File | null) => void;
}

interface FileUpload {
  name: string;
  size: string;
  type: string;
  file: File;
}

export function OtherDataForm({ data, updateData, onFileUpload }: OtherDataFormProps) {
  const [uploads, setUploads] = useState<{
    proofOfBilling: FileUpload | null;
  }>({
    proofOfBilling: null,
  });

  const handleInputChange = (field: keyof OtherData, value: string) => {
    updateData({ [field]: value });
  };

  const handleFileUpload = (
    type: 'proofOfBilling',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploads((prev) => ({
        ...prev,
        [type]: {
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
          type: file.type,
          file: file,
        },
      }));
      onFileUpload(type, file);
    }
  };

  const removeFile = (type: 'proofOfBilling') => {
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
    type: 'proofOfBilling';
    accept: string;
  }) => (
    <div className="flex flex-col gap-2 w-[790px]">
      <label className="relative">
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFileUpload(type, e)}
          className="hidden"
        />
        <div className="h-8 w-full text-xs bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer flex items-center justify-center gap-2 transition-colors">
          <Upload size={14} />
          {label}
        </div>
      </label>

      {uploads[type] && (
        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-md p-2 w-full">
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
          <Select onValueChange={(value) => handleInputChange('communityPosition', value)}>
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
          <Select onValueChange={(value) => handleInputChange('paluwagaParticipation', value)}>
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
        <Select onValueChange={(value) => handleInputChange('otherIncomeSources', value)}>
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
        <Select onValueChange={(value) => handleInputChange('disasterPreparednessStrategy', value)}>
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