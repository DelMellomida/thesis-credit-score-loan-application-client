import React from 'react';
import { Label } from '@/components/ui/label';
import { validPositions, Position } from '@/lib/positionValidation';

interface PositionFieldProps {
  value: Position;
  onChange: (value: Position) => void;
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
      <select
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value as Position)}
      >
        {Object.values(validPositions).map((position) => (
          <option key={position} value={position}>
            {position}
          </option>
        ))}
      </select>
    </div>
  );
}