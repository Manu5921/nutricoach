/**
 * System and Platform Types
 * Generic types for system administration, monitoring, and platform management
 */

import { BaseEntity, TimestampedEntity } from '../common/base.js';

/**
 * Application Configuration
 */
export interface AppConfig {
  name: string;
  version: string;
  environment: Environment;
  debug: boolean;
  features: FeatureFlag[];
  database: DatabaseConfig;
  cache: CacheConfig;
  auth: AuthConfig;
  storage: StorageConfig;
  monitoring: MonitoringConfig;
  thirdParty: ThirdPartyConfig;
  customSettings?: Record<string, any>;
}

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  enabledFor?: string[]; // User IDs or groups
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface DatabaseConfig {
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'supabase';
  host?: string;
  port?: number;
  database: string;
  schema?: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
  retries?: number;
  migrations?: {
    auto: boolean;
    directory?: string;
  };
}

export interface CacheConfig {
  provider: 'redis' | 'memcached' | 'memory' | 'none';
  host?: string;
  port?: number;
  ttl: number;
  maxSize?: number;
  keyPrefix?: string;
  compression?: boolean;
}

export interface AuthConfig {
  providers: string[];
  sessionDuration: number;
  tokenSecret?: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  mfaEnabled: boolean;
  passwordPolicy: PasswordPolicy;
  rateLimiting: RateLimiting;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  bannedPasswords?: string[];
  expirationDays?: number;
}

export interface RateLimiting {
  windowMs: number;
  maxRequests: number;
  skipSuccessful?: boolean;
  skipFailed?: boolean;
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'gcs' | 'azure' | 'cloudinary';
  bucket?: string;
  region?: string;
  publicUrl?: string;
  maxFileSize: number;
  allowedTypes: string[];
  compression?: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  provider?: 'sentry' | 'datadog' | 'newrelic' | 'custom';
  apiKey?: string;
  sampleRate?: number;
  enablePerformanceMonitoring?: boolean;
  enableErrorTracking?: boolean;
  enableUserTracking?: boolean;
}

export interface ThirdPartyConfig {
  stripe?: StripeConfig;
  sendgrid?: EmailConfig;
  twilio?: SMSConfig;
  analytics?: AnalyticsConfig;
  [key: string]: any;
}

export interface StripeConfig {
  publicKey: string;
  secretKey?: string;
  webhookSecret?: string;
  currency: string;
}

export interface EmailConfig {
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface SMSConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

export interface AnalyticsConfig {
  provider: 'google' | 'mixpanel' | 'amplitude' | 'custom';
  trackingId?: string;
  apiKey?: string;
  enabledEvents: string[];
}

/**
 * System Monitoring and Health
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  version: string;
  uptime: number;
  services: ServiceHealth[];
  metrics: SystemMetrics;
  checks: HealthCheck[];
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime: number;
  lastChecked: Date;
  error?: string;
  dependencies: string[];
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    evictions: number;
  };
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  duration: number;
  message?: string;
  timestamp: Date;
  critical: boolean;
}

/**
 * Logging and Audit
 */
export interface LogEntry extends BaseEntity {
  level: LogLevel;
  message: string;
  timestamp: Date;
  source: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  context?: Record<string, any>;
  error?: ErrorDetails;
  performance?: PerformanceData;
  tags?: string[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
}

export interface PerformanceData {
  duration: number;
  memoryUsage: number;
  dbQueries: number;
  dbTime: number;
  cacheHits: number;
  cacheMisses: number;
  httpCalls: number;
  httpTime: number;
}

export interface AuditEvent extends BaseEntity, TimestampedEntity {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: ChangeLog[];
  ip?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ChangeLog {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'create' | 'update' | 'delete';
}

/**
 * Job Queue and Background Tasks
 */
export interface Job extends BaseEntity {
  name: string;
  type: string;
  queue: string;
  priority: JobPriority;
  status: JobStatus;
  payload: Record<string, any>;
  options: JobOptions;
  attempts: number;
  maxAttempts: number;
  progress: number;
  result?: any;
  error?: string;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  processingTime?: number;
  tags?: string[];
}

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export type JobStatus = 
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused'
  | 'stuck';

export interface JobOptions {
  delay?: number;
  timeout?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  attempts?: number;
  backoff?: BackoffStrategy;
  repeat?: RepeatOptions;
}

export interface BackoffStrategy {
  type: 'fixed' | 'exponential' | 'linear';
  delay: number;
}

export interface RepeatOptions {
  pattern?: string; // Cron pattern
  every?: number; // Interval in milliseconds
  limit?: number; // Maximum number of repeats
  endDate?: Date;
}

export interface JobQueue {
  name: string;
  concurrency: number;
  paused: boolean;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  stalled: number;
}

/**
 * API Management
 */
export interface APIEndpoint {
  path: string;
  method: HTTPMethod;
  version: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  authentication: AuthenticationType[];
  rateLimit?: APIRateLimit;
  deprecated: boolean;
  public: boolean;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  type: string;
  description: string;
  example?: any;
  enum?: any[];
}

export interface APIRequestBody {
  required: boolean;
  contentType: string;
  schema: Record<string, any>;
  examples?: Record<string, any>;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  contentType?: string;
  schema?: Record<string, any>;
  examples?: Record<string, any>;
}

export type AuthenticationType = 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2';

export interface APIRateLimit {
  requests: number;
  window: number; // in seconds
  burst?: number;
}

export interface APIUsage extends BaseEntity {
  endpointId: string;
  userId?: string;
  apiKey?: string;
  ip: string;
  userAgent?: string;
  method: HTTPMethod;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  timestamp: Date;
  errors?: string[];
}

/**
 * Deployment and Release Management
 */
export interface Deployment extends BaseEntity, TimestampedEntity {
  version: string;
  environment: Environment;
  status: DeploymentStatus;
  deployedBy: string;
  commitHash?: string;
  branch?: string;
  releaseNotes?: string;
  rollbackVersion?: string;
  healthChecks: HealthCheck[];
  metrics: DeploymentMetrics;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  tags?: string[];
}

export type DeploymentStatus = 
  | 'pending'
  | 'in_progress'
  | 'successful'
  | 'failed'
  | 'rolled_back'
  | 'cancelled';

export interface DeploymentMetrics {
  successRate: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  userSatisfaction?: number;
}

export interface Release extends BaseEntity {
  version: string;
  name: string;
  description: string;
  changelog: ChangelogEntry[];
  features: string[];
  bugFixes: string[];
  breakingChanges: string[];
  dependencies: DependencyUpdate[];
  deployments: Deployment[];
  scheduled: boolean;
  scheduledFor?: Date;
  published: boolean;
  publishedAt?: Date;
  prerelease: boolean;
  draft: boolean;
}

export interface ChangelogEntry {
  type: 'feature' | 'bugfix' | 'improvement' | 'security' | 'breaking';
  description: string;
  pr?: string;
  author?: string;
  impact: 'major' | 'minor' | 'patch';
}

export interface DependencyUpdate {
  name: string;
  from: string;
  to: string;
  type: 'major' | 'minor' | 'patch';
  security?: boolean;
}

/**
 * Data Management
 */
export interface DataExport extends BaseEntity {
  userId: string;
  format: ExportFormat;
  type: ExportType;
  status: ExportStatus;
  filters?: Record<string, any>;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fileSize?: number;
  recordCount?: number;
  downloadUrl?: string;
  expiresAt?: Date;
  requestedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf' | 'xml';

export type ExportType = 
  | 'full_data'
  | 'personal_data'
  | 'analytics_data'
  | 'financial_data'
  | 'nutrition_data'
  | 'custom';

export type ExportStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface DataBackup extends BaseEntity {
  type: BackupType;
  status: BackupStatus;
  size: number;
  location: string;
  retention: number; // days
  encrypted: boolean;
  automated: boolean;
  tables?: string[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  errorMessage?: string;
}

export type BackupType = 'full' | 'incremental' | 'differential';

export type BackupStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'expired';

/**
 * Security and Compliance
 */
export interface SecurityEvent extends BaseEntity {
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  location?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  actions: SecurityAction[];
  metadata?: Record<string, any>;
}

export type SecurityEventType = 
  | 'failed_login'
  | 'account_lockout'
  | 'password_breach'
  | 'suspicious_activity'
  | 'data_access'
  | 'privilege_escalation'
  | 'malware_detected'
  | 'ddos_attack'
  | 'unauthorized_api_access';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAction {
  type: 'block_ip' | 'lock_account' | 'require_mfa' | 'notify_admin' | 'log_only';
  parameters?: Record<string, any>;
  executedAt: Date;
  success: boolean;
}

export interface ComplianceReport extends BaseEntity {
  standard: ComplianceStandard;
  reportType: ReportType;
  period: {
    start: Date;
    end: Date;
  };
  status: ReportStatus;
  findings: ComplianceFinding[];
  summary: ComplianceSummary;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  nextReviewDate?: Date;
}

export type ComplianceStandard = 
  | 'gdpr'
  | 'ccpa'
  | 'hipaa'
  | 'sox'
  | 'pci_dss'
  | 'iso27001'
  | 'custom';

export type ReportType = 'quarterly' | 'annual' | 'incident' | 'audit';

export type ReportStatus = 'draft' | 'under_review' | 'approved' | 'published';

export interface ComplianceFinding {
  id: string;
  type: 'violation' | 'risk' | 'observation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  dueDate?: Date;
  evidence?: string[];
}

export interface ComplianceSummary {
  totalFindings: number;
  violations: number;
  risks: number;
  observations: number;
  complianceScore: number; // 0-100
  previousScore?: number;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * System Maintenance
 */
export interface MaintenanceWindow extends BaseEntity {
  title: string;
  description: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  affectedServices: string[];
  impact: MaintenanceImpact;
  notifications: MaintenanceNotification[];
  tasks: MaintenanceTask[];
  approvedBy: string;
  emergency: boolean;
}

export type MaintenanceType = 
  | 'scheduled'
  | 'emergency'
  | 'security_update'
  | 'infrastructure'
  | 'database'
  | 'application_update';

export type MaintenanceStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'extended';

export type MaintenanceImpact = 
  | 'no_impact'
  | 'performance_degradation'
  | 'partial_outage'
  | 'full_outage';

export interface MaintenanceNotification {
  type: 'email' | 'sms' | 'in_app' | 'status_page';
  recipients: string[];
  sentAt: Date;
  template?: string;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  dependencies?: string[];
  rollbackPlan?: string;
  verification?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Search and filtering for system data
 */
export interface SystemSearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  logLevel?: LogLevel[];
  environment?: Environment[];
  userId?: string;
  status?: string[];
  tags?: string[];
}

/**
 * Constants for system management
 */
export const DEFAULT_TIMEOUTS = {
  database: 30000,
  cache: 5000,
  http: 10000,
  file: 60000,
} as const;

export const LOG_RETENTION_DAYS = {
  debug: 7,
  info: 30,
  warn: 90,
  error: 365,
  fatal: 365,
} as const;

export const HEALTH_CHECK_INTERVALS = {
  critical: 30000,    // 30 seconds
  important: 60000,   // 1 minute
  normal: 300000,     // 5 minutes
  optional: 900000,   // 15 minutes
} as const;