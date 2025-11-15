import React from 'react';
import { FaCheck } from 'react-icons/fa';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: {
    label: string;
    icon?: React.ReactNode;
  }[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps, 
  steps 
}) => {
  return (
    <div className="flex justify-center mb-12 px-4">
      <div className="flex items-center space-x-8">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex flex-col items-center relative">
            {/* Cercle de l'étape */}
            <div
              className={`w-16 h-16 rounded-full border-4 transition-all duration-500 flex items-center justify-center ${
                index + 1 === currentStep
                  ? 'border-gray-300 bg-gray-300 text-gray-800 scale-110'
                  : index + 1 < currentStep
                  ? 'border-gray-400 bg-gray-400 text-white'
                  : 'border-gray-600 bg-gray-800 text-gray-300'
              }`}
            >
              {index + 1 < currentStep ? (
                <FaCheck className="text-lg" />
              ) : steps[index]?.icon ? (
                <span className="text-lg">{steps[index].icon}</span>
              ) : (
                <span className="font-bold text-lg">{index + 1}</span>
              )}
            </div>
            
            {/* Label de l'étape */}
            <div className="text-center mt-3 max-w-24">
              <div className={`text-sm font-medium transition-all duration-300 ${
                index + 1 === currentStep ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {steps[index]?.label || `Étape ${index + 1}`}
              </div>
            </div>
            
            {/* Ligne de connexion vers la prochaine étape */}
            {index < totalSteps - 1 && (
              <div className="absolute top-8 left-full w-8 h-1 bg-gray-600">
                <div
                  className={`h-full transition-all duration-500 ${
                    index + 1 < currentStep ? 'bg-gray-400' : 'bg-gray-600'
                  }`}
                  style={{
                    width: index + 1 < currentStep ? '100%' : '0%'
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
