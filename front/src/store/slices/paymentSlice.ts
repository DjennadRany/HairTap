import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export type PaymentStatus = 'initiated' | 'pending' | 'confirmed' | 'cancelled' | 'refunded';

interface PaymentState {
  statuses: Record<string, PaymentStatus>;
  error: string | null;
}

const initialState: PaymentState = {
  statuses: {},
  error: null
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPaymentStatus: (
      state,
      action: PayloadAction<{ bookingId: string; status: PaymentStatus }>
    ) => {
      state.statuses[action.payload.bookingId] = action.payload.status;
      state.error = null;
    },
    bulkSyncStatuses: (
      state,
      action: PayloadAction<Array<{ bookingId: string; status: PaymentStatus }>>
    ) => {
      action.payload.forEach(({ bookingId, status }) => {
        state.statuses[bookingId] = status;
      });
      state.error = null;
    },
    removePaymentStatus: (state, action: PayloadAction<string>) => {
      delete state.statuses[action.payload];
    },
    setPaymentError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetPaymentState: () => initialState
  }
});

export const {
  setPaymentStatus,
  bulkSyncStatuses,
  removePaymentStatus,
  setPaymentError,
  resetPaymentState
} = paymentSlice.actions;

export const selectPaymentStatus = (bookingId: string) => (state: RootState) =>
  state.payment.statuses[bookingId];

export const selectPaymentError = (state: RootState) => state.payment.error;

export default paymentSlice.reducer;
