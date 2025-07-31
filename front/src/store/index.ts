import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import profileReducer from './slices/profileSlice';
import { loadProfileFromLocalStorage } from './slices/profileSlice';

const preloadedProfile = loadProfileFromLocalStorage();

const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    profile: profileReducer,
  },
  preloadedState: {
    profile: {
      profile: preloadedProfile,
      loading: false,
      error: null,
    },
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for Google Auth
        ignoredActions: ['auth/setUser'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { store }; 