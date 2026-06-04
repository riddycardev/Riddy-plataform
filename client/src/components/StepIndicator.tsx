/**
 * Step Indicator Component
 * Visual progress indicator for multi-step forms
 */

import { CheckCircle } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto">
        {/* Desktop view */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    currentStep > step.id
                      ? "bg-cyan-500 text-white"
                      : currentStep === step.id
                      ? "bg-cyan-500 text-white ring-4 ring-cyan-500/30"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      currentStep >= step.id ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mb-12">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > step.id
                        ? "bg-cyan-500"
                        : "bg-white/10"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile view */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  "bg-cyan-500 text-white ring-4 ring-cyan-500/30"
                }`}
              >
                {currentStep}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {steps[currentStep - 1]?.title}
                </p>
                <p className="text-xs text-gray-400">
                  Etapa {currentStep} de {steps.length}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
