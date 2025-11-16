import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import workingSlotsService, { type WorkingSlot } from '../../services/api/workingSlots';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price?: number;
  surge: boolean;
  booked: boolean;
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
  onSlotSelect?: (slot: TimeSlot, date: Date) => void;
  onDateSelect?: (date: Date) => void;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function buildDayData(date: Date, slots: WorkingSlot[], today: Date): DayData {
  const slotsForDay = slots.filter((slot) => slot.dayOfWeek === date.getDay());
  const daySlots: TimeSlot[] = [];
  let totalBookings = 0;

  const isPastDay = startOfDay(date) < today;

  slotsForDay.forEach((slot) => {
    const maxBookings = slot.maxBookings ?? 1;
    const currentBookings = slot.currentBookings ?? 0;
    totalBookings += currentBookings;

    const isBooked = slot.status === 'booked' || currentBookings >= maxBookings;
    const isAvailable = !isPastDay && slot.status === 'available' && !isBooked;

    for (let hour = slot.startTime; hour < slot.endTime; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      daySlots.push({
        id: `${slot._id}-${date.toISOString()}-${hour}`,
        time,
        available: isAvailable,
        surge: false,
        booked: isBooked
      });
    }
  });

  return {
    date,
    slots: daySlots,
    totalBookings,
    revenue: 0
  };
}

function buildCalendarData(
  referenceDate: Date,
  viewMode: 'week' | 'month',
  slots: WorkingSlot[]
): DayData[] {
  if (!slots || slots.length === 0) {
    return [];
  }

  const data: DayData[] = [];
  const startDate = new Date(referenceDate);
  const today = startOfDay(new Date());

  if (viewMode === 'week') {
    startDate.setDate(startDate.getDate() - startDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      data.push(buildDayData(date, slots, today));
    }
  } else {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      data.push(buildDayData(date, slots, today));
    }
  }

  return data;
}

export const IntelligentCalendar: React.FC<IntelligentCalendarProps> = ({
  coiffeurId,
  isClient = false,
  onSlotSelect,
  onDateSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [slots, setSlots] = useState<WorkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isSubscribed = true;

    const loadSlots = async () => {
      setLoading(true);
      setError(null);

      if (!coiffeurId) {
        setSlots([]);
        setLoading(false);
        return;
      }

      const response = await workingSlotsService.getCoiffeurSlots(coiffeurId);

      if (!isSubscribed) return;

      if (response.success && response.data) {
        setSlots(response.data);
      } else {
        setSlots([]);
        setError(response.message ?? 'Impossible de récupérer les créneaux');
      }

      setLoading(false);
    };

    loadSlots();

    return () => {
      isSubscribed = false;
    };
  }, [coiffeurId]);

  useEffect(() => {
    setCalendarData(buildCalendarData(currentDate, viewMode, slots));
  }, [currentDate, viewMode, slots]);

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
    if (slot.available && !slot.booked) {
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
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{day.totalBookings} réservations</span>
                </div>
                {!isClient && (
                  <div className="text-green-600 font-medium">
                    {day.revenue}€
                  </div>
                )}
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
                    disabled={!slot.available || slot.booked}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                      slot.booked
                        ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                        : slot.available
                        ? slot.surge
                          ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'
                          : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                        : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
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
                      {slot.booked ? 'Réservé' : `${slot.price}€`}
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
          
          {day.totalBookings > 0 && (
            <div className="text-xs opacity-75">
              {day.totalBookings} réservations
            </div>
          )}
          
          {!isClient && day.revenue > 0 && (
            <div className="text-xs text-green-600 font-medium">
              {day.revenue}€
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default IntelligentCalendar;
