import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import redirectReducer from './slices/redirectSlice';
import bookingReducer from './slices/bookingSlice';
import profileReducer from './slices/profileSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user']
};

const redirectPersistConfig = {
  key: 'redirect',
  storage,
  whitelist: ['redirectUrl']
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedRedirectReducer = persistReducer(redirectPersistConfig, redirectReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    redirect: persistedRedirectReducer,
    booking: bookingReducer,
    profile: profileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 