'use client';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <ul className="steps w-full">
      {steps.map((step) => (
        <li
          key={step.number}
          className={`step ${step.number <= currentStep ? 'step-primary' : ''}`}
          data-content={step.number <= currentStep ? '✓' : step.number}
        >
          <div className="text-left">
            <div className="font-semibold">{step.title}</div>
            <div className="text-xs text-base-content/60">{step.description}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
