import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import profileReducer, { loadProfileFromLocalStorage } from './slices/profileSlice';
import redirectReducer from './slices/redirectSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user'],
};

const redirectPersistConfig = {
  key: 'redirect',
  storage,
  whitelist: ['redirectUrl'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedRedirectReducer = persistReducer(redirectPersistConfig, redirectReducer);

const preloadedProfile = loadProfileFromLocalStorage();

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    redirect: persistedRedirectReducer,
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
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'auth/setUser'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { configureStore };