/**
 * Session Management Module
 * Exports all session-related services and types
 */

export * from './session-service.js';

// Re-export common types for convenience
export type {
  SessionConfig,
  UserSession,
  AuthProvider,
  LoginCredentials,
  DeviceInfo,
  LoginResult,
  UserPermissions,
  SessionStorage,
} from './session-service.js';

// Re-export factory functions
export {
  createSessionService,
  createNutritionSessionService,
} from './session-service.js';