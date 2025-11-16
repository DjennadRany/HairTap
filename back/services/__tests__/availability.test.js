import { mergeAvailability } from '../slotService.js';

describe('mergeAvailability', () => {
  const baseOccurrence = {
    id: 'slot-1',
    slotId: 'slot-1',
    date: '2024-01-02',
    startTime: '09:00',
    endTime: '10:00',
    maxCapacity: 1,
    remainingCapacity: 1,
    status: 'available',
  };

  it('marks a slot as occupied when a booking overlaps', () => {
    const bookings = [
      {
        _id: 'booking-1',
        date: new Date('2024-01-02T09:00:00Z').toISOString(),
        duration: 60,
        status: 'pending',
      },
    ];

    const [result] = mergeAvailability([baseOccurrence], bookings);
    expect(result.availability).toBe('occupied');
    expect(result.remainingCapacity).toBe(0);
    expect(result.overlappingBookings).toHaveLength(1);
    expect(result.conflict).toBe(false);
  });

  it('ignores cancelled bookings when computing availability', () => {
    const bookings = [
      {
        _id: 'booking-2',
        date: new Date('2024-01-02T09:00:00Z').toISOString(),
        duration: 60,
        status: 'cancelled',
      },
    ];

    const [result] = mergeAvailability([baseOccurrence], bookings);
    expect(result.availability).toBe('free');
    expect(result.remainingCapacity).toBe(1);
    expect(result.overlappingBookings).toHaveLength(0);
  });

  it('detects conflicts when multiple bookings overlap the same slot', () => {
    const bookings = [
      {
        _id: 'booking-3',
        date: new Date('2024-01-02T09:00:00Z').toISOString(),
        duration: 60,
        status: 'pending',
      },
      {
        _id: 'booking-4',
        date: new Date('2024-01-02T09:15:00Z').toISOString(),
        duration: 30,
        status: 'confirmed',
      },
    ];

    const [result] = mergeAvailability([baseOccurrence], bookings);
    expect(result.availability).toBe('occupied');
    expect(result.remainingCapacity).toBe(0);
    expect(result.overlappingBookings).toHaveLength(2);
    expect(result.conflict).toBe(true);
  });

  it('keeps a slot free when bookings end before the slot starts', () => {
    const bookings = [
      {
        _id: 'booking-5',
        date: new Date('2024-01-02T07:30:00Z').toISOString(),
        duration: 30,
        status: 'pending',
      },
    ];

    const [result] = mergeAvailability([baseOccurrence], bookings);
    expect(result.availability).toBe('free');
    expect(result.remainingCapacity).toBe(1);
    expect(result.overlappingBookings).toHaveLength(0);
    expect(result.conflict).toBe(false);
  });
});
