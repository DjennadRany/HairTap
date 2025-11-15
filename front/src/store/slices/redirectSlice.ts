import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';

interface RedirectState {
  redirectUrl: string | null;
}

const initialState: RedirectState = {
  redirectUrl: null
};

export const redirectSlice = createSlice({
  name: 'redirect',
  initialState,
  reducers: {
    setRedirectUrl: (state, action: PayloadAction<string | null>) => {
      state.redirectUrl = action.payload;
    },
    clearRedirectUrl: (state) => {
      state.redirectUrl = null;
    }
  }
});

export const { setRedirectUrl, clearRedirectUrl } = redirectSlice.actions;

export const selectRedirectUrl = (state: RootState) => state.redirect.redirectUrl;

export default redirectSlice.reducer; 