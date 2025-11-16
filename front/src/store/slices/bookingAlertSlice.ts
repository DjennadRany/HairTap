import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { BookingAlert } from '../../services/api/bookingValidations';

export type BookingAlertWithRead = BookingAlert & { isRead?: boolean };

interface BookingAlertState {
  alerts: BookingAlertWithRead[];
  lastFetchedAt?: string;
}

const initialState: BookingAlertState = {
  alerts: [],
  lastFetchedAt: undefined,
};

const mergeAlerts = (
  incoming: BookingAlert[],
  existing: BookingAlertWithRead[]
): BookingAlertWithRead[] => {
  const readMap = new Map(existing.map(alert => [alert.id, alert.isRead ?? false]));
  const merged = incoming.map(alert => ({
    ...alert,
    isRead: readMap.get(alert.id) ?? false,
  }));

  const existingUnknown = existing.filter(oldAlert => !incoming.some(alert => alert.id === oldAlert.id));
  return [...merged, ...existingUnknown];
};

export const bookingAlertSlice = createSlice({
  name: 'bookingAlert',
  initialState,
  reducers: {
    setBookingAlerts: (state, action: PayloadAction<BookingAlert[]>) => {
      state.alerts = mergeAlerts(action.payload, state.alerts);
      state.lastFetchedAt = new Date().toISOString();
    },
    addBookingAlert: (state, action: PayloadAction<BookingAlert>) => {
      const existing = state.alerts.find(alert => alert.id === action.payload.id);
      if (!existing) {
        state.alerts.unshift({ ...action.payload, isRead: false });
      }
    },
    markBookingAlertRead: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.map(alert =>
        alert.id === action.payload ? { ...alert, isRead: true } : alert
      );
    },
    markAllBookingAlertsRead: (state) => {
      state.alerts = state.alerts.map(alert => ({ ...alert, isRead: true }));
    },
    removeBookingAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
    resetBookingAlerts: () => initialState,
  },
});

export const {
  setBookingAlerts,
  addBookingAlert,
  markBookingAlertRead,
  markAllBookingAlertsRead,
  removeBookingAlert,
  resetBookingAlerts,
} = bookingAlertSlice.actions;

export const selectBookingAlerts = (state: RootState) => state.bookingAlert.alerts;
export const selectUnreadBookingAlerts = (state: RootState) =>
  state.bookingAlert.alerts.filter(alert => !alert.isRead);
export const selectUnreadBookingAlertCount = (state: RootState) =>
  state.bookingAlert.alerts.filter(alert => !alert.isRead).length;

export default bookingAlertSlice.reducer;
