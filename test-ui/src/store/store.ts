import { configureStore } from '@reduxjs/toolkit';
import testsReducer from './testsSlice';
import websocketMiddleware from './websocketMiddleware';

export const rootReducer = {
  tests: testsReducer,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serializability checks
        ignoredPaths: ['tests.testResults', 'tests.runningTests'],
      },
    }).concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
