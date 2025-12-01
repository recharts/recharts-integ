import { Middleware } from '@reduxjs/toolkit';
import {
  testQueued,
  testStarted,
  testOutput,
  testError,
  testCompleted,
  queueCleared,
  moveToResults,
  setIsPacking,
  setLocalPackagePath,
  setError,
} from './testsSlice';

const WS_URL = 'ws://localhost:3001';

interface WebSocketMessage {
  type: string;
  data: any;
}

const websocketMiddleware: Middleware = (store) => {
  let ws: WebSocket | null = null;

  const connect = () => {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message, store.dispatch);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connect, 3000);
    };
  };

  const handleMessage = (message: WebSocketMessage, dispatch: any) => {
    const { type, data } = message;

    switch (type) {
      case 'test-queued':
        dispatch(testQueued({
          testName: data.testName,
          id: data.id,
          position: data.position,
        }));
        break;

      case 'test-started':
        dispatch(testStarted({
          testName: data.testName,
          id: data.id,
        }));
        break;

      case 'test-output':
        dispatch(testOutput({
          id: data.id,
          output: data.output,
          phases: data.phases,
          currentPhase: data.currentPhase,
        }));
        break;

      case 'test-error':
        dispatch(testError({
          id: data.id,
          error: data.error,
        }));
        break;

      case 'test-completed':
        dispatch(testCompleted({
          id: data.id,
          status: data.status,
          exitCode: data.exitCode,
        }));
        // Move to results after delay
        setTimeout(() => {
          const state = store.getState();
          const testName = Object.keys(state.tests.runningTests).find(
            (name: string) => state.tests.runningTests[name].id === data.id
          );
          if (testName) {
            dispatch(moveToResults(testName));
          }
        }, 1000);
        break;

      case 'queue-cleared':
        dispatch(queueCleared());
        break;

      case 'packing-started':
        dispatch(setIsPacking(true));
        break;

      case 'packing-completed':
        dispatch(setIsPacking(false));
        dispatch(setLocalPackagePath(data.packagePath));
        // Persist to localStorage
        localStorage.setItem('localPackagePath', data.packagePath);
        break;

      case 'packing-failed':
        dispatch(setIsPacking(false));
        dispatch(setError('Failed to pack directory: ' + data.error));
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
    }
  };

  // Initialize connection
  connect();

  return (next) => (action) => {
    return next(action);
  };
};

export default websocketMiddleware;
