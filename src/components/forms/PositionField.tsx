import React from 'react';
import { Label } from '../../components/ui/label';
import { validatePosition } from '../../lib/forms/positionValidation';

interface PositionFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function PositionField({
  value,
  onChange,
  label = 'Position'
}: PositionFieldProps) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(validatePosition(e.target.value))}
        placeholder="Enter job position"
      />
    </div>
  );
}