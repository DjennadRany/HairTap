import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import availabilityService, {
  type AvailabilitySlot,
  type AvailabilityState,
} from '../../services/api/availability';
import { bookingEventService, type BookingEvent } from '../../services/api/bookingEvents';
import { formatTime, isValidTimeFormat } from '../../utils/timeUtils';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price?: number;
  surge: boolean;
  booked: boolean;
  state: AvailabilityState;
  conflict?: boolean;
}

interface DayData {
  date: Date;
  slots: TimeSlot[];
  totalBookings: number;
  revenue: number;
}

interface IntelligentCalendarProps {
  coiffeurId?: string;
  isClient?: boolean;
  mode?: 'salon' | 'domicile';
  coiffeur?: {
    salonAddress?: string;
    homeServiceAddress?: string;
  };
  onSlotSelect?: (slot: TimeSlot, date: Date) => void;
  onDateSelect?: (date: Date) => void;
}

const toDateRange = (referenceDate: Date, viewMode: 'week' | 'month') => {
  const start = new Date(referenceDate);
  let end: Date;

  if (viewMode === 'week') {
    start.setDate(start.getDate() - start.getDay());
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else {
    start.setDate(1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  }

  return { start, end };
};

const groupAvailabilityByDate = (
  availability: AvailabilitySlot[],
  rangeStart: Date,
  rangeEnd: Date
): Record<string, AvailabilitySlot[]> => {
  return availability.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    // Le backend retourne date comme string "YYYY-MM-DD" ou ISO string
    let slotDate: Date;
    if (typeof slot.date === 'string') {
      // Si c'est au format "YYYY-MM-DD", créer une date locale
      if (slot.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = slot.date.split('-').map(Number);
        slotDate = new Date(year, month - 1, day);
      } else {
        // Sinon, c'est probablement une ISO string
        slotDate = new Date(slot.date);
      }
    } else {
      slotDate = new Date(slot.date);
    }
    
    // Normaliser les dates pour la comparaison (ignorer l'heure)
    const slotDateNormalized = new Date(slotDate);
    slotDateNormalized.setHours(0, 0, 0, 0);
    const rangeStartNormalized = new Date(rangeStart);
    rangeStartNormalized.setHours(0, 0, 0, 0);
    const rangeEndNormalized = new Date(rangeEnd);
    rangeEndNormalized.setHours(0, 0, 0, 0);
    
    if (slotDateNormalized < rangeStartNormalized || slotDateNormalized > rangeEndNormalized) {
      return acc;
    }

    const key = slotDateNormalized.toDateString();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(slot);
    return acc;
  }, {});
};

// ✅ CORRECTION: Utiliser formatTime() partagée depuis timeUtils

const buildCalendarDataFromAvailability = (
  availability: AvailabilitySlot[],
  referenceDate: Date,
  viewMode: 'week' | 'month'
): DayData[] => {
  if (!availability || availability.length === 0) return [];

  const { start, end } = toDateRange(referenceDate, viewMode);
  const grouped = groupAvailabilityByDate(availability, start, end);
  const data: DayData[] = [];
  const now = new Date();

  for (
    const cursor = new Date(start.getTime());
    cursor.getTime() <= end.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const slotsForDay = grouped[cursor.toDateString()] ?? [];
    
    // CORRECTION: Filtrer strictement les créneaux "00:00" et ceux sans heure valide
    const timeSlots: TimeSlot[] = slotsForDay
      .filter((slot) => {
        // Ignorer les créneaux sans startTime (null, undefined, ou string vide)
        if (slot.startTime === null || slot.startTime === undefined || slot.startTime === '') return false;
        
        // Formater l'heure
        const slotTime = formatTime(slot.startTime);
        
        // EXCLURE TOUJOURS "00:00" (c'est une valeur par défaut, pas une vraie heure)
        if (slotTime === '00:00') {
          return false;
        }
        
        // Vérifier que le format est valide
        if (!isValidTimeFormat(slotTime)) return false;
        
        // Filtrer les créneaux passés
        const [hours, minutes] = slotTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return false;
        
        const slotDateTime = new Date(cursor);
        slotDateTime.setHours(hours, minutes, 0, 0);
        return slotDateTime.getTime() > now.getTime();
      })
      .map((slot) => ({
        id: slot.id,
        time: formatTime(slot.startTime),
        available: slot.availability === 'free',
        surge: false,
        booked: slot.availability === 'occupied',
        state: slot.availability,
        conflict: slot.conflict,
      }));

    data.push({
      date: new Date(cursor),
      slots: timeSlots,
      totalBookings: 0,
      revenue: 0,
    });
  }

  return data;
};

export const IntelligentCalendar: React.FC<IntelligentCalendarProps> = ({
  coiffeurId,
  isClient = false,
  mode = 'salon',
  onSlotSelect,
  onDateSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  const fetchAvailability = useCallback(async () => {
    if (!coiffeurId) {
      setAvailability([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { start, end } = toDateRange(currentDate, viewMode);

    try {
      // CORRECTION: Toujours passer le mode explicitement pour l'agenda coiffeur
      const response = await availabilityService.fetchAvailability(coiffeurId, {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        mode: mode || 'salon', // Mode explicite pour filtrer les créneaux
      });

      if (response.success && Array.isArray(response.data)) {
        setAvailability(response.data);
      } else {
        setAvailability([]);
        setError(response.message ?? 'Impossible de récupérer les disponibilités');
      }
    } catch (err: any) {
      console.error('❌ [IntelligentCalendar] Erreur fetchAvailability:', err);
      setAvailability([]);
      setError(err?.message ?? 'Erreur lors de la récupération des disponibilités');
    } finally {
      setLoading(false);
    }
  }, [coiffeurId, currentDate, viewMode, mode]);

  // ✅ CORRECTION: Utiliser SSE au lieu de polling pour synchronisation temps réel
  useEffect(() => {
    // Fetch initial
    fetchAvailability();

    // Connexion SSE pour rafraîchissement temps réel
    const token = localStorage.getItem('token');
    if (!token) {
      // Fallback vers polling si pas de token
      const interval = setInterval(fetchAvailability, 30000);
      return () => clearInterval(interval);
    }

    // Handler pour les événements de réservation
    const handleEvent = (event: BookingEvent) => {
      console.log('📨 [IntelligentCalendar] Événement reçu, rafraîchissement:', event.type);
      
      // Vérifier que l'événement concerne ce coiffeur
      if (coiffeurId && event.coiffeurId === coiffeurId) {
        // Rafraîchir les disponibilités immédiatement
        fetchAvailability();
      } else if (isClient && event.clientId) {
        // Pour les clients, rafraîchir si c'est leur réservation
        fetchAvailability();
      }
    };

    // Se connecter au service SSE
    bookingEventService.connect(token, handleEvent);

    // Cleanup: retirer le handler et garder un polling de backup (toutes les 5 minutes)
    const backupInterval = setInterval(fetchAvailability, 300000); // 5 minutes en backup

    return () => {
      bookingEventService.removeHandler(handleEvent);
      clearInterval(backupInterval);
    };
  }, [fetchAvailability, coiffeurId, isClient]);

  useEffect(() => {
    const calendarData = buildCalendarDataFromAvailability(availability, currentDate, viewMode);
    setCalendarData(calendarData);
  }, [availability, currentDate, viewMode]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleSlotClick = (slot: TimeSlot, date: Date) => {
    if (slot.state === 'free') {
      onSlotSelect?.(slot, date);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!loading && calendarData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
        {error ?? 'Aucune disponibilité trouvée pour ce coiffeur.'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" ref={calendarRef}>
      {/* Header du calendrier */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-600 hover:text-black transition-colors duration-200"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === 'week' 
                ? `Semaine du ${currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                : currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
              }
            </h2>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-600 hover:text-black transition-colors duration-200"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                viewMode === 'week' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                viewMode === 'month' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Mois
            </button>
          </div>
        </div>
      </div>

      {/* Corps du calendrier */}
      <div className="p-4">
        {viewMode === 'week' ? (
          <WeekView 
            data={calendarData}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            onSlotClick={handleSlotClick}
            isClient={isClient}
          />
        ) : (
          <MonthView 
            data={calendarData}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            isClient={isClient}
          />
        )}
      </div>
    </div>
  );
};

// Composant Vue Semaine
const WeekView: React.FC<{
  data: DayData[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  onSlotClick: (slot: TimeSlot, date: Date) => void;
  isClient: boolean;
}> = ({ data, selectedDate, onDateClick, onSlotClick, isClient }) => {
  
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

  // ✅ NOUVEAU: Fonction pour obtenir la couleur selon le statut de réservation
  // Exportée pour utilisation future dans l'affichage des bookings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'late':
        return 'bg-orange-500 text-white';
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'expired':
        return 'bg-gray-400 text-white';
      case 'rescheduled':
        return 'bg-yellow-500 text-white';
      case 'pending':
        return 'bg-yellow-400 text-white';
      case 'confirmed':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getSlotClasses = (slot: TimeSlot) => {
    if (slot.state === 'unavailable') {
      return 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed';
    }

    if (slot.state === 'occupied') {
      return 'bg-red-50 border-red-300 text-red-800 cursor-not-allowed';
    }

    return slot.surge
      ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'
      : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100';
  };

  const getSlotLabel = (slot: TimeSlot) => {
    if (slot.state === 'occupied') return 'Occupé';
    if (slot.state === 'unavailable') return 'Indisponible';
    return slot.price !== undefined && slot.price !== null ? `${slot.price}€` : 'Libre';
  };

  return (
    <div className="space-y-4">
      {data.map((day) => (
        <div key={day.date.getTime()} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* En-tête du jour */}
          <div 
            className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
              selectedDate?.toDateString() === day.date.toDateString()
                ? 'bg-gray-800 text-white'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => onDateClick(day.date)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">{formatDate(day.date)}</span>
                <span className="text-sm opacity-75">
                  {day.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })}
                </span>
              </div>
              
            </div>
          </div>

          {/* Créneaux horaires */}
          {selectedDate?.toDateString() === day.date.toDateString() && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-3 gap-3">
                {day.slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => onSlotClick(slot, day.date)}
                    disabled={slot.state !== 'free'}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left ${getSlotClasses(slot)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{slot.time}</span>
                      {slot.surge && (
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                          Surge
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      {getSlotLabel(slot)}
                      {slot.conflict && (
                        <span className="ml-2 text-xs text-red-700 font-semibold">Conflit</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Composant Vue Mois
const MonthView: React.FC<{
  data: DayData[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  isClient: boolean;
}> = ({ data, selectedDate, onDateClick, isClient }) => {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* En-têtes des jours */}
      {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
        <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50">
          {day}
        </div>
      ))}
      
      {/* Jours du mois */}
      {data.map((day) => (
        <div
          key={day.date.getTime()}
          onClick={() => onDateClick(day.date)}
          className={`p-2 border border-gray-200 cursor-pointer transition-colors duration-200 min-h-[80px] ${
            selectedDate?.toDateString() === day.date.toDateString()
              ? 'bg-gray-800 text-white'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-sm font-medium mb-1">
            {day.date.getDate()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default IntelligentCalendar;
