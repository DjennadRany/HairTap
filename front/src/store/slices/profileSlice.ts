import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface Profile {
  id: string;
  userId: string;
  role: 'client' | 'coiffeur';
  preferences?: {
    favoriteCoiffeurs: string[];
    preferredServices: string[];
  };
  professionalInfo?: {
    services: string[];
    pricing: { [key: string]: number };
    availability: string[];
    location: string;
  };
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

function saveProfileToLocalStorage(profile: Profile | null) {
  if (profile) {
    localStorage.setItem('client_profile', JSON.stringify(profile));
  }
}

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
      state.loading = false;
      state.error = null;
      saveProfileToLocalStorage(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    updatePreferences: (
      state,
      action: PayloadAction<Profile['preferences']>
    ) => {
      if (state.profile) {
        state.profile.preferences = action.payload;
        saveProfileToLocalStorage(state.profile);
      }
    },
  },
});

export const { setProfile, setLoading, setError, updatePreferences } =
  profileSlice.actions;

export const selectProfile = (state: RootState) => state.profile.profile;
export const selectProfileLoading = (state: RootState) => state.profile.loading;
export const selectProfileError = (state: RootState) => state.profile.error;

export const loadProfileFromLocalStorage = (): Profile | null => {
  const data = localStorage.getItem('client_profile');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
};

export default profileSlice.reducer; 