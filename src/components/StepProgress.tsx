import React from 'react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { number: number; title: string }[];
  onStepClick?: (step: number) => void;
}

export function StepProgress({ currentStep, totalSteps, steps, onStepClick }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Circle with number */}
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer ${
                step.number <= currentStep
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-400 border-gray-300'
              }`}
              onClick={() => onStepClick && onStepClick(step.number)}
              title={`Go to ${step.title}`}
            >
              <span className="font-semibold">{step.number}</span>
            </div>
            {/* Step title below the circle */}
            <span 
              className={`text-xs mt-2 text-center font-medium transition-colors duration-300 ${
                step.number <= currentStep ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              {step.title}
            </span>
          </div>
          
          {/* Connecting line */}
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-20 mx-4 transition-colors duration-300 ${
                step.number < currentStep ? 'bg-red-600' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}