import React from 'react';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  canProceed?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isLoading = false,
  canProceed = true
}) => {
  return (
    <div className="flex justify-between items-center mt-12">
      {/* Bouton précédent */}
      {currentStep > 1 && (
        <button
          onClick={onPrevious}
          className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 border border-gray-600 hover:border-gray-500"
        >
          <FaArrowLeft className="mr-2" />
          Précédent
        </button>
      )}
      
      {/* Bouton suivant/soumettre */}
      {currentStep < totalSteps ? (
        <button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className="flex items-center px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-300 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
          <FaArrowRight className="ml-2" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!canProceed || isLoading}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Création en cours...
            </>
          ) : (
            <>
              Créer mon compte
              <FaCheck className="ml-2" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default StepNavigation;
