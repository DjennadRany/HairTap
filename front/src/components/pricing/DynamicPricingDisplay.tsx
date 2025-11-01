import React, { useState, useEffect } from 'react';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ClockIcon, 
  FireIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface PriceHistory {
  date: string;
  price: number;
  demand: 'low' | 'medium' | 'high';
}

interface DynamicPricingDisplayProps {
  basePrice: number;
  currentPrice: number;
  demand: 'low' | 'medium' | 'high';
  timeSlot: string;
  date: Date;
  onPriceChange?: (newPrice: number) => void;
  showHistory?: boolean;
}

export const DynamicPricingDisplay: React.FC<DynamicPricingDisplayProps> = ({
  basePrice,
  currentPrice,
  demand,
  timeSlot,
  date,
  onPriceChange,
  showHistory = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Simuler l'historique des prix
  useEffect(() => {
    const history: PriceHistory[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const demandVariation = Math.random();
      let demandLevel: 'low' | 'medium' | 'high';
      let priceMultiplier = 1;
      
      if (demandVariation < 0.3) {
        demandLevel = 'low';
        priceMultiplier = 0.8;
      } else if (demandVariation < 0.7) {
        demandLevel = 'medium';
        priceMultiplier = 1.0;
      } else {
        demandLevel = 'high';
        priceMultiplier = 1.3;
      }
      
      history.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        price: Math.round(basePrice * priceMultiplier),
        demand: demandLevel
      });
    }
    
    setPriceHistory(history);
  }, [basePrice]);

  const getDemandColor = (demandLevel: 'low' | 'medium' | 'high') => {
    switch (demandLevel) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDemandIcon = (demandLevel: 'low' | 'medium' | 'high') => {
    switch (demandLevel) {
      case 'low':
        return <ArrowTrendingDownIcon className="h-4 w-4" />;
      case 'medium':
        return <ClockIcon className="h-4 w-4" />;
      case 'high':
        return <FireIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getDemandLabel = (demandLevel: 'low' | 'medium' | 'high') => {
    switch (demandLevel) {
      case 'low':
        return 'Faible demande';
      case 'medium':
        return 'Demande moyenne';
      case 'high':
        return 'Forte demande';
      default:
        return 'Demande normale';
    }
  };

  const priceDifference = currentPrice - basePrice;
  const pricePercentage = ((priceDifference / basePrice) * 100);
  const isSurge = priceDifference > 0;

  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)}€`;
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric',
        month: 'short'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header principal */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">{timeSlot}</span>
            <span className="text-sm text-gray-500">• {formatDate(date)}</span>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {/* Prix principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </div>
            
            {isSurge && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                <FireIcon className="h-4 w-4" />
                <span>Surge</span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">Prix de base</div>
            <div className="text-lg font-medium text-gray-700">{formatPrice(basePrice)}</div>
          </div>
        </div>

        {/* Indicateur de variation */}
        {priceDifference !== 0 && (
          <div className="mt-3 flex items-center space-x-2">
            {isSurge ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-orange-600" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-green-600" />
            )}
            <span className={`text-sm font-medium ${
              isSurge ? 'text-orange-600' : 'text-green-600'
            }`}>
              {isSurge ? '+' : ''}{formatPrice(priceDifference)} ({isSurge ? '+' : ''}{pricePercentage.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Indicateur de demande */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getDemandIcon(demand)}
            <span className="text-sm font-medium text-gray-700">
              {getDemandLabel(demand)}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(demand)}`}>
              {demand.toUpperCase()}
            </div>
            
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <InformationCircleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu expandable */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Historique des prix */}
          {showHistory && (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Évolution des prix (7 jours)</h4>
              <div className="space-y-2">
                {priceHistory.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{entry.date}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(entry.price)}
                      </span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(entry.demand)}`}>
                        {entry.demand.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facteurs de prix */}
          <div className="px-4 pb-4">
            <h4 className="font-medium text-gray-900 mb-3">Facteurs de prix</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Demande actuelle</span>
                <span className="font-medium">{getDemandLabel(demand)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Heure de pointe</span>
                <span className="font-medium">
                  {['12:00', '18:00'].includes(timeSlot) ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Saison</span>
                <span className="font-medium">
                  {new Date().getMonth() >= 5 && new Date().getMonth() <= 8 ? 'Haute' : 'Basse'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip d'information */}
      {showTooltip && (
        <div className="absolute z-10 mt-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs">
          <div className="mb-2">
            <strong>Faible demande :</strong> Prix réduit, créneaux disponibles
          </div>
          <div className="mb-2">
            <strong>Demande moyenne :</strong> Prix standard, disponibilité normale
          </div>
          <div>
            <strong>Forte demande :</strong> Prix majoré, créneaux limités
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default DynamicPricingDisplay;
