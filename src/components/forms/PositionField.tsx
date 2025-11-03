import React from 'react';
import { Label } from '@/components/ui/label';
import { validPositions, Position } from '@/lib/positionValidation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a position" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(validPositions).map((position) => (
            <SelectItem key={position} value={position}>
              {position}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}