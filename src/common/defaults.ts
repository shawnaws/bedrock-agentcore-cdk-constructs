/**
 * Default configurations for CDK constructs
 */

import { RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { 
  EnvironmentDefaults, 
  SecurityConfig, 
  MonitoringConfig, 
  TaggingConfig,
  BaseConstructProps 
} from './interfaces';

/**
 * Default security configurations by environment
 */
export const DEFAULT_SECURITY_CONFIG: Record<'dev' | 'staging' | 'prod', SecurityConfig> = {
  dev: {
    encryptionAtRest: false,
    encryptionInTransit: true,
    enableAccessLogging: false,
    restrictPublicAccess: true,
    enableVpcEndpoints: false,
  },
  staging: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    enableAccessLogging: true,
    restrictPublicAccess: true,
    enableVpcEndpoints: false,
  },
  prod: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    enableAccessLogging: true,
    restrictPublicAccess: true,
    enableVpcEndpoints: true,
  },
};

/**
 * Default monitoring configurations by environment
 */
export const DEFAULT_MONITORING_CONFIG: Record<'dev' | 'staging' | 'prod', MonitoringConfig> = {
  dev: {
    enableLogging: true,
    logRetentionDays: RetentionDays.ONE_WEEK,
    enableTracing: false,
    enableMetrics: true,
    enableAlarms: false,
  },
  staging: {
    enableLogging: true,
    logRetentionDays: RetentionDays.ONE_MONTH,
    enableTracing: true,
    enableMetrics: true,
    enableAlarms: true,
  },
  prod: {
    enableLogging: true,
    logRetentionDays: RetentionDays.SIX_MONTHS,
    enableTracing: true,
    enableMetrics: true,
    enableAlarms: true,
  },
};

/**
 * Environment-specific default configurations
 */
export const ENVIRONMENT_DEFAULTS: Record<'dev' | 'staging' | 'prod', EnvironmentDefaults> = {
  dev: {
    name: 'dev',
    removalPolicy: RemovalPolicy.DESTROY,
    security: DEFAULT_SECURITY_CONFIG.dev,
    monitoring: DEFAULT_MONITORING_CONFIG.dev,
    costOptimized: true,
  },
  staging: {
    name: 'staging',
    removalPolicy: RemovalPolicy.DESTROY,
    security: DEFAULT_SECURITY_CONFIG.staging,
    monitoring: DEFAULT_MONITORING_CONFIG.staging,
    costOptimized: true,
  },
  prod: {
    name: 'prod',
    removalPolicy: RemovalPolicy.RETAIN,
    security: DEFAULT_SECURITY_CONFIG.prod,
    monitoring: DEFAULT_MONITORING_CONFIG.prod,
    costOptimized: false,
  },
};

/**
 * Default tagging configuration
 */
export const DEFAULT_TAGGING_CONFIG: TaggingConfig = {
  standardTags: {
    'ManagedBy': 'CDK',
    'Project': 'reusable-cdk-constructs',
  },
  environmentTags: {
    'Environment': '${environment}', // Will be replaced with actual environment
  },
  costAllocationTags: {
    'CostCenter': 'Engineering',
    'Team': 'Platform',
  },
};

/**
 * Bedrock Agent Core specific defaults
 */
export const BEDROCK_AGENT_CORE_DEFAULTS = {
  /**
   * Default protocol for Agent Core Runtime
   */
  protocol: 'HTTP',
  
  /**
   * Default environment variables for Agent Core Runtime
   */
  environmentVariables: {
    MCP_PORT: '8000',
    MCP_AUTH_ENABLED: 'false',
    MCP_SSE_ENABLED: 'false',
    STORAGE_TYPE: 's3',
    S3_URL_EXPIRATION: '3600',
    USE_PRESIGNED_URLS: 'true',
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
  },
  
  /**
   * Default Docker platform
   */
  dockerPlatform: 'linux/arm64',
  
  /**
   * Default timeout for custom resource operations
   */
  customResourceTimeout: 10, // minutes
  
  /**
   * Default log retention for Agent Core Runtime
   */
  logRetention: RetentionDays.ONE_WEEK,
};

/**
 * Bedrock Knowledge Base specific defaults
 */
export const BEDROCK_KNOWLEDGE_BASE_DEFAULTS = {
  /**
   * Default data source sync interval in minutes
   */
  dataSourceSyncMinutes: 10,
  
  /**
   * Default chunking strategy
   */
  chunkingStrategy: {
    maxTokens: 500,
    overlapPercentage: 20,
  },
  
  /**
   * Default embedding model
   */
  embeddingModel: 'amazon.titan-embed-text-v2:0',
};

/**
 * Configuration defaults utility class
 */
export class ConfigDefaults {
  /**
   * Get environment-specific defaults
   */
  static getEnvironmentDefaults(environment: 'dev' | 'staging' | 'prod'): EnvironmentDefaults {
    return { ...ENVIRONMENT_DEFAULTS[environment] };
  }

  /**
   * Apply default values to base construct properties
   */
  static applyBaseDefaults(props: BaseConstructProps): Required<BaseConstructProps> {
    const environment = props.environment || 'dev';
    const envDefaults = this.getEnvironmentDefaults(environment);
    
    return {
      environment,
      naming: props.naming || {},
      tags: {
        ...DEFAULT_TAGGING_CONFIG.standardTags,
        ...DEFAULT_TAGGING_CONFIG.environmentTags,
        Environment: environment,
        ...props.tags,
      },
      removalPolicy: props.removalPolicy || envDefaults.removalPolicy,
    };
  }

  /**
   * Get security configuration with environment defaults
   */
  static getSecurityConfig(environment: 'dev' | 'staging' | 'prod', overrides?: Partial<SecurityConfig>): SecurityConfig {
    return {
      ...DEFAULT_SECURITY_CONFIG[environment],
      ...overrides,
    };
  }

  /**
   * Get monitoring configuration with environment defaults
   */
  static getMonitoringConfig(environment: 'dev' | 'staging' | 'prod', overrides?: Partial<MonitoringConfig>): MonitoringConfig {
    return {
      ...DEFAULT_MONITORING_CONFIG[environment],
      ...overrides,
    };
  }

  /**
   * Generate resource name with prefix/suffix
   */
  static generateResourceName(baseName: string, naming?: { prefix?: string; suffix?: string }): string {
    let name = baseName;
    
    if (naming?.prefix) {
      name = `${naming.prefix}-${name}`;
    }
    
    if (naming?.suffix) {
      name = `${name}-${naming.suffix}`;
    }
    
    return name;
  }

  /**
   * Get Bedrock Agent Core environment variables with defaults
   */
  static getBedrockAgentCoreEnvironmentVariables(
    customVars?: { [key: string]: string },
    s3Bucket?: string,
    s3Prefix?: string,
    region?: string
  ): { [key: string]: string } {
    const defaultVars: { [key: string]: string } = { ...BEDROCK_AGENT_CORE_DEFAULTS.environmentVariables };
    
    // Add S3 configuration if provided
    if (s3Bucket) {
      defaultVars.S3_BUCKET = s3Bucket;
    }
    if (s3Prefix) {
      defaultVars.S3_PREFIX = s3Prefix;
    }
    if (region) {
      defaultVars.S3_REGION = region;
      defaultVars.AWS_REGION = region;
    }
    
    return {
      ...defaultVars,
      ...customVars,
    };
  }

  /**
   * Validate and apply log retention defaults
   */
  static getLogRetention(environment: 'dev' | 'staging' | 'prod', override?: RetentionDays): RetentionDays {
    if (override !== undefined) {
      return override;
    }
    return DEFAULT_MONITORING_CONFIG[environment].logRetentionDays as RetentionDays;
  }

  /**
   * Get removal policy based on environment and override
   */
  static getRemovalPolicy(environment: 'dev' | 'staging' | 'prod', override?: RemovalPolicy): RemovalPolicy {
    if (override !== undefined) {
      return override;
    }
    return ENVIRONMENT_DEFAULTS[environment].removalPolicy;
  }
}