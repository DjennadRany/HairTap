import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { bookingService } from '../../services/api/bookings';
import { workingSlotsService } from '../../services/api/workingSlots';
import { coiffeurService, type CoiffeurSlotDTO } from '../../services/api/coiffeurs';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateTimeSlotsFromWorkingSlots, generateTimeSlotsFromOpeningHours, generateTimeSlots } from '../../utils/dateUtils';
import type { Booking } from '../../services/api/bookings';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price: number;
  surge: boolean;
  booked: boolean;
  booking?: Booking;
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
  mode?: 'salon' | 'domicile';
  coiffeur?: {
    salonAddress?: {
      openingHours?: {
        monday?: { open: string; close: string; closed?: boolean };
        tuesday?: { open: string; close: string; closed?: boolean };
        wednesday?: { open: string; close: string; closed?: boolean };
        thursday?: { open: string; close: string; closed?: boolean };
        friday?: { open: string; close: string; closed?: boolean };
        saturday?: { open: string; close: string; closed?: boolean };
        sunday?: { open: string; close: string; closed?: boolean };
      };
    };
  };
}

export const IntelligentCalendar: React.FC<IntelligentCalendarProps> = ({
  coiffeurId,
  isClient = false,
  onSlotSelect,
  onDateSelect,
  mode = 'salon',
  coiffeur
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workingSlots, setWorkingSlots] = useState<any[]>([]);
  const [coiffeurSlots, setCoiffeurSlots] = useState<CoiffeurSlotDTO[]>([]);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  // ✅ NOUVEAU: Récupérer les vraies données depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      if (!coiffeurId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ✅ CORRIGÉ: Calculer les dates selon la vue (semaine ou mois)
        let startDate: Date;
        let endDate: Date;
        
        if (viewMode === 'week') {
          startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
          endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
        } else {
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
        }
        
        // Récupérer les réservations, working slots et coiffeur slots en parallèle
        const [bookingsData, slotsData, coiffeurSlotsData] = await Promise.all([
          bookingService.getCoiffeurBookings(coiffeurId).catch(() => []),
          workingSlotsService.getCoiffeurSlots(coiffeurId, true).catch(() => []),
          coiffeurService.getCoiffeurSlots(coiffeurId, {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            mode
          }).catch(() => [])
        ]);

        setBookings(bookingsData);
        setWorkingSlots(slotsData);
        setCoiffeurSlots(coiffeurSlotsData);
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coiffeurId, currentDate, viewMode, mode]);

  // ✅ NOUVEAU: Générer les données du calendrier avec les vraies données
  useEffect(() => {
    if (loading) return;

    generateCalendarData();
  }, [bookings, workingSlots, coiffeurSlots, currentDate, viewMode, mode, coiffeur, loading]);

  const generateCalendarData = () => {
    const data: DayData[] = [];
    let days: Date[] = [];

    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lundi
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    }

    days.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();

      // ✅ NOUVEAU: Générer les créneaux selon les vraies disponibilités
      const timeSlots = generateTimeSlotsForDay(date, dateStr, dayOfWeek);

      // ✅ NOUVEAU: Marquer les créneaux réservés
      const slotsWithBookings = timeSlots.map(slot => {
        const booking = findBookingForSlot(dateStr, slot.time);
        return {
          ...slot,
          booked: !!booking,
          booking: booking || undefined
        };
      });

      // ✅ NOUVEAU: Calculer les vraies statistiques
      const dayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return isSameDay(bookingDate, date);
      });

      const totalBookings = dayBookings.length;
      const revenue = dayBookings
        .filter(b => (b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'confirmed')
        .reduce((sum, b) => {
          const coiffeurAmount = b.coiffeurAmount || (b.price * 0.90);
          return sum + coiffeurAmount;
        }, 0);

      data.push({
        date,
        slots: slotsWithBookings,
        totalBookings,
        revenue
      });
    });

    setCalendarData(data);
  };

  // ✅ NOUVEAU: Générer les créneaux selon les vraies disponibilités
  const generateTimeSlotsForDay = (date: Date, dateStr: string, dayOfWeek: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const isPastDate = isPast(date) && !isToday(date);

    // ✅ CORRIGÉ: Pour mode domicile, TOUJOURS générer tous les créneaux 00h-00h
    // Même si le serveur ne les renvoie pas, on doit afficher tous les créneaux 24h/24h
    if (mode === 'domicile') {
      // Générer tous les créneaux 00h-00h
      const allSlots24h = generateTimeSlots(0, 24, 60);
      
      // Si on a des données du serveur, on peut les utiliser pour marquer les créneaux réservés
      // mais on affiche TOUJOURS tous les créneaux 00h-00h
      if (coiffeurSlots.length > 0) {
        const daySlots = coiffeurSlots.filter(slot => slot.date === dateStr);
        if (daySlots.length > 0) {
          // Créer un Set des créneaux réservés (remainingCapacity = 0)
          const reservedSlots = new Set(
            daySlots
              .filter(slot => slot.remainingCapacity === 0)
              .map(slot => {
                const [hour, minute] = slot.startTime.split(':').map(Number);
                return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              })
          );
          
          // Générer tous les créneaux 00h-00h et marquer ceux qui sont réservés
          return allSlots24h.map(time => {
            const booking = findBookingForSlot(dateStr, time);
            const isBooked = reservedSlots.has(time) || !!booking;
            return {
              id: `${dateStr}-${time}`,
              time,
              available: !isPastDate && !isBooked,
              price: 0,
              surge: false,
              booked: isBooked
            };
          });
        }
      }
      
      // Si pas de données serveur, retourner tous les créneaux 00h-00h
      return allSlots24h.map(time => {
        const booking = findBookingForSlot(dateStr, time);
        const isBooked = !!booking;
        return {
          id: `${dateStr}-${time}`,
          time,
          available: !isPastDate && !isBooked,
          price: 0,
          surge: false,
          booked: isBooked
        };
      });
    }

    // Pour mode salon, utiliser la logique normale avec priorité
    // Priorité 1: Utiliser CoiffeurSlotDTO si disponibles (données calculées côté serveur)
    if (coiffeurSlots.length > 0) {
      const daySlots = coiffeurSlots.filter(slot => {
        // Filtrer par date
        if (slot.date !== dateStr) return false;
        // Filtrer selon le mode - le slot doit supporter le mode demandé
        if (mode && slot.supportedModes && !slot.supportedModes.includes(mode)) return false;
        return true;
      });
      
      if (daySlots.length > 0) {
        daySlots.forEach(slot => {
          const [hour, minute] = slot.startTime.split(':').map(Number);
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // ✅ CORRIGÉ: Utiliser remainingCapacity pour déterminer si réservé
          // Si remainingCapacity = 0, le créneau est complètement réservé
          const isBooked = slot.remainingCapacity === 0;
          
          // Vérifier aussi dans les bookings pour double vérification
          const booking = findBookingForSlot(dateStr, time);
          
          slots.push({
            id: `${dateStr}-${time}`,
            time,
            available: slot.remainingCapacity > 0 && !isPastDate && !isBooked,
            price: 0, // Prix sera calculé depuis le service
            surge: false,
            booked: isBooked || !!booking
          });
        });
        
        if (slots.length > 0) {
          return slots;
        }
      }
    }

    // Priorité 2: Utiliser WorkingSlots si disponibles
    if (workingSlots.length > 0) {
      const daySlots = generateTimeSlotsFromWorkingSlots(workingSlots, date, 60, mode);
      if (daySlots.length > 0) {
        daySlots.forEach(time => {
          // ✅ CORRIGÉ: Vérifier immédiatement si le créneau est réservé
          const booking = findBookingForSlot(dateStr, time);
          const isBooked = !!booking;
          
          slots.push({
            id: `${dateStr}-${time}`,
            time,
            available: !isPastDate && !isBooked,
            price: 0,
            surge: false,
            booked: isBooked
          });
        });
        
        // ✅ CORRIGÉ: Pour mode domicile, compléter avec tous les créneaux 00h-00h si manquants
        if (mode === 'domicile' && slots.length > 0) {
          const allSlots24h = generateTimeSlots(0, 24, 60);
          const existingTimes = new Set(slots.map(s => s.time));
          
          // Ajouter les créneaux manquants (00h-00h)
          allSlots24h.forEach(time => {
            if (!existingTimes.has(time)) {
              const booking = findBookingForSlot(dateStr, time);
              const isBooked = !!booking;
              slots.push({
                id: `${dateStr}-${time}`,
                time,
                available: !isPastDate && !isBooked,
                price: 0,
                surge: false,
                booked: isBooked
              });
            }
          });
          
          // Trier par heure
          slots.sort((a, b) => a.time.localeCompare(b.time));
        }
        
        if (slots.length > 0) {
          return slots;
        }
      }
    }

    // Priorité 3: Utiliser openingHours si disponibles (uniquement pour salon)
    if (mode === 'salon' && coiffeur?.salonAddress?.openingHours) {
      const daySlots = generateTimeSlotsFromOpeningHours(coiffeur.salonAddress.openingHours, date, 60);
      if (daySlots.length > 0) {
        daySlots.forEach(time => {
          // ✅ CORRIGÉ: Vérifier si le créneau est réservé
          const booking = findBookingForSlot(dateStr, time);
          const isBooked = !!booking;
          
          slots.push({
            id: `${dateStr}-${time}`,
            time,
            available: !isPastDate && !isBooked,
            price: 0,
            surge: false,
            booked: isBooked
          });
        });
        
        if (slots.length > 0) {
          return slots;
        }
      }
    }

    // Fallback: Créneaux par défaut selon le mode
    // ✅ CORRIGÉ: Pour domicile, mode 24h/24h (00h-00h) selon v0.7.17
    // Pour mode domicile, TOUJOURS générer tous les créneaux 00h-00h
    const defaultSlots = mode === 'domicile' 
      ? generateTimeSlots(0, 24, 60) // 00h-00h (24h/24h) - TOUJOURS
      : generateTimeSlots(9, 19, 60); // 9h-19h

    return defaultSlots.map(time => {
      // ✅ CORRIGÉ: Vérifier si le créneau est réservé même pour les créneaux par défaut
      const booking = findBookingForSlot(dateStr, time);
      const isBooked = !!booking;
      
      return {
        id: `${dateStr}-${time}`,
        time,
        available: !isPastDate && !isBooked,
        price: 0,
        surge: false,
        booked: isBooked
      };
    });
  };

  // ✅ CORRIGÉ: Trouver la réservation pour un créneau donné (gère les durées)
  const findBookingForSlot = (dateStr: string, time: string): Booking | null => {
    const [slotHour, slotMinute] = time.split(':').map(Number);
    const slotTime = slotHour * 60 + slotMinute; // Minutes depuis minuit
    
    return bookings.find(booking => {
      // Ignorer les réservations annulées ou terminées
      if (booking.status === 'cancelled' || booking.status === 'completed') {
        return false;
      }
      
      const bookingDate = new Date(booking.date);
      const bookingDateStr = format(bookingDate, 'yyyy-MM-dd');
      
      // Vérifier que c'est le même jour
      if (bookingDateStr !== dateStr) {
        return false;
      }
      
      const bookingHour = bookingDate.getHours();
      const bookingMinute = bookingDate.getMinutes();
      const bookingStartTime = bookingHour * 60 + bookingMinute; // Minutes depuis minuit
      const bookingEndTime = bookingStartTime + (booking.duration || 60); // Durée en minutes
      
      // Vérifier si le créneau chevauche avec la réservation
      // Le créneau est réservé s'il est dans l'intervalle [bookingStartTime, bookingEndTime)
      return slotTime >= bookingStartTime && slotTime < bookingEndTime;
    }) || null;
  };

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
        <span className="ml-3 text-gray-600">Chargement des disponibilités...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
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
                ? `Semaine du ${format(currentDate, 'd MMMM', { locale: fr })}`
                : format(currentDate, 'MMMM yyyy', { locale: fr })
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
    
    if (isSameDay(date, today)) {
      return 'Aujourd\'hui';
    } else if (isSameDay(date, tomorrow)) {
      return 'Demain';
    } else {
      return format(date, 'EEE d MMM', { locale: fr });
    }
  };

  return (
    <div className="space-y-4">
      {data.map((day) => (
        <div key={day.date.getTime()} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* En-tête du jour */}
          <div 
            className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
              selectedDate && isSameDay(selectedDate, day.date)
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
                  {format(day.date, 'd/M')}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{day.totalBookings} réservations</span>
                </div>
                {!isClient && (
                  <div className="text-green-600 font-medium">
                    {day.revenue.toFixed(2)}€
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Créneaux horaires */}
          {selectedDate && isSameDay(selectedDate, day.date) && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-3 gap-3">
                {day.slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => onSlotClick(slot, day.date)}
                    disabled={!slot.available || slot.booked}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                      slot.booked
                        ? 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed'
                        : !slot.available
                        ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                        : slot.surge
                        ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'
                        : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                    }`}
                    title={slot.booking ? `Réservé: ${slot.booking.service}` : ''}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{slot.time}</span>
                      {slot.surge && (
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                          Surge
                        </span>
                      )}
                      {slot.booked && (
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                          Réservé
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      {slot.booked 
                        ? slot.booking?.service || 'Réservé'
                        : slot.price > 0 
                        ? `${slot.price}€`
                        : 'Disponible'
                      }
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
            selectedDate && isSameDay(selectedDate, day.date)
              ? 'bg-gray-800 text-white'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-sm font-medium mb-1">
            {format(day.date, 'd')}
          </div>
          
          {day.totalBookings > 0 && (
            <div className="text-xs opacity-75">
              {day.totalBookings} réservations
            </div>
          )}
          
          {!isClient && day.revenue > 0 && (
            <div className="text-xs text-green-600 font-medium">
              {day.revenue.toFixed(2)}€
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default IntelligentCalendar;
