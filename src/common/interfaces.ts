/**
 * Common interfaces and types for reusable CDK constructs
 */

import { RemovalPolicy } from 'aws-cdk-lib';

/**
 * Base properties that all constructs in this library should support
 */
export interface BaseConstructProps {
  /**
   * Environment-specific configuration
   * Affects default settings for security, logging, and resource configuration
   */
  environment?: 'dev' | 'staging' | 'prod';
  
  /**
   * Resource naming configuration
   */
  naming?: {
    /** Prefix to add to all resource names */
    prefix?: string;
    /** Suffix to add to all resource names */
    suffix?: string;
  };
  
  /**
   * Common tags to apply to all resources created by this construct
   */
  tags?: { [key: string]: string };
  
  /**
   * Removal policy for resources created by this construct
   * @default RemovalPolicy.RETAIN for production, RemovalPolicy.DESTROY for dev/staging
   */
  removalPolicy?: RemovalPolicy;
}

/**
 * Security configuration options for constructs
 */
export interface SecurityConfig {
  /** Enable encryption at rest for supported resources */
  encryptionAtRest?: boolean;
  
  /** Enable encryption in transit for supported resources */
  encryptionInTransit?: boolean;
  
  /** Enable access logging for supported resources */
  enableAccessLogging?: boolean;
  
  /** Restrict public access where applicable */
  restrictPublicAccess?: boolean;
  
  /** Enable VPC endpoints for supported services */
  enableVpcEndpoints?: boolean;
}

/**
 * Monitoring and observability configuration
 */
export interface MonitoringConfig {
  /** Enable CloudWatch logging */
  enableLogging?: boolean;
  
  /** CloudWatch log retention period in days */
  logRetentionDays?: number;
  
  /** Enable X-Ray tracing */
  enableTracing?: boolean;
  
  /** Enable CloudWatch metrics */
  enableMetrics?: boolean;
  
  /** Enable CloudWatch alarms for critical metrics */
  enableAlarms?: boolean;
}

/**
 * Result of configuration validation
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  
  /** List of validation errors */
  errors: string[];
  
  /** List of validation warnings */
  warnings: string[];
  
  /** Suggestions for fixing validation issues */
  suggestions?: string[];
}

/**
 * Interface for configuration validators
 */
export interface ConfigValidator<T> {
  /**
   * Validate a configuration object
   * @param config The configuration to validate
   * @returns Validation result with errors and warnings
   */
  validate(config: T): ValidationResult;
}

/**
 * Custom error class for construct-specific errors
 */
export class ConstructError extends Error {
  constructor(
    /** Name of the construct that threw the error */
    public readonly constructName: string,
    /** Type of error that occurred */
    public readonly errorType: 'VALIDATION' | 'CONFIGURATION' | 'RUNTIME' | 'DEPENDENCY',
    /** Error message */
    message: string,
    /** Optional suggestions for resolving the error */
    public readonly suggestions?: string[]
  ) {
    super(`[${constructName}] ${message}`);
    this.name = 'ConstructError';
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConstructError);
    }
  }
}

/**
 * Metadata about a construct implementation
 */
export interface ConstructMetadata {
  /** Construct name */
  name: string;
  
  /** Construct version */
  version: string;
  
  /** Brief description of what the construct does */
  description: string;
  
  /** Category of the construct */
  category: 'bedrock-agentcore' | 'storage' | 'compute' | 'networking' | 'patterns';
  
  /** CDK construct level (L1, L2, or L3) */
  level: 'L1' | 'L2' | 'L3';
  
  /** List of AWS services used by this construct */
  awsServices: string[];
  
  /** Links to usage examples */
  examples?: string[];
  
  /** Known limitations or considerations */
  limitations?: string[];
}

/**
 * Environment-specific default configurations
 */
export interface EnvironmentDefaults {
  /** Environment name */
  name: 'dev' | 'staging' | 'prod';
  
  /** Default removal policy for this environment */
  removalPolicy: RemovalPolicy;
  
  /** Default security settings */
  security: SecurityConfig;
  
  /** Default monitoring settings */
  monitoring: MonitoringConfig;
  
  /** Whether to optimize for cost over performance */
  costOptimized: boolean;
}

/**
 * Configuration for AWS resource tagging
 */
export interface TaggingConfig {
  /** Standard tags to apply to all resources */
  standardTags: { [key: string]: string };
  
  /** Environment-specific tags */
  environmentTags?: { [key: string]: string };
  
  /** Cost allocation tags */
  costAllocationTags?: { [key: string]: string };
  
  /** Compliance tags */
  complianceTags?: { [key: string]: string };
}