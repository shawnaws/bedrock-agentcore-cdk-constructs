/**
 * Default configurations for CDK constructs
 */
import { RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { EnvironmentDefaults, SecurityConfig, MonitoringConfig, TaggingConfig, BaseConstructProps } from './interfaces';
/**
 * Default security configurations by environment
 */
export declare const DEFAULT_SECURITY_CONFIG: Record<'dev' | 'staging' | 'prod', SecurityConfig>;
/**
 * Default monitoring configurations by environment
 */
export declare const DEFAULT_MONITORING_CONFIG: Record<'dev' | 'staging' | 'prod', MonitoringConfig>;
/**
 * Environment-specific default configurations
 */
export declare const ENVIRONMENT_DEFAULTS: Record<'dev' | 'staging' | 'prod', EnvironmentDefaults>;
/**
 * Default tagging configuration
 */
export declare const DEFAULT_TAGGING_CONFIG: TaggingConfig;
/**
 * Bedrock Agent Core specific defaults
 */
export declare const BEDROCK_AGENT_CORE_DEFAULTS: {
    /**
     * Default protocol for Agent Core Runtime
     */
    protocol: string;
    /**
     * Default environment variables for Agent Core Runtime
     */
    environmentVariables: {
        MCP_PORT: string;
        MCP_AUTH_ENABLED: string;
        MCP_SSE_ENABLED: string;
        STORAGE_TYPE: string;
        S3_URL_EXPIRATION: string;
        USE_PRESIGNED_URLS: string;
        NODE_ENV: string;
        LOG_LEVEL: string;
    };
    /**
     * Default Docker platform
     */
    dockerPlatform: string;
    /**
     * Default timeout for custom resource operations
     */
    customResourceTimeout: number;
    /**
     * Default log retention for Agent Core Runtime
     */
    logRetention: RetentionDays;
};
/**
 * Bedrock Knowledge Base specific defaults
 */
export declare const BEDROCK_KNOWLEDGE_BASE_DEFAULTS: {
    /**
     * Default data source sync interval in minutes
     */
    dataSourceSyncMinutes: number;
    /**
     * Default chunking strategy
     */
    chunkingStrategy: {
        maxTokens: number;
        overlapPercentage: number;
    };
    /**
     * Default embedding model
     */
    embeddingModel: string;
};
/**
 * Configuration defaults utility class
 */
export declare class ConfigDefaults {
    /**
     * Get environment-specific defaults
     */
    static getEnvironmentDefaults(environment: 'dev' | 'staging' | 'prod'): EnvironmentDefaults;
    /**
     * Apply default values to base construct properties
     */
    static applyBaseDefaults(props: BaseConstructProps): Required<BaseConstructProps>;
    /**
     * Get security configuration with environment defaults
     */
    static getSecurityConfig(environment: 'dev' | 'staging' | 'prod', overrides?: Partial<SecurityConfig>): SecurityConfig;
    /**
     * Get monitoring configuration with environment defaults
     */
    static getMonitoringConfig(environment: 'dev' | 'staging' | 'prod', overrides?: Partial<MonitoringConfig>): MonitoringConfig;
    /**
     * Generate resource name with prefix/suffix
     */
    static generateResourceName(baseName: string, naming?: {
        prefix?: string;
        suffix?: string;
    }): string;
    /**
     * Get Bedrock Agent Core environment variables with defaults
     */
    static getBedrockAgentCoreEnvironmentVariables(customVars?: {
        [key: string]: string;
    }, s3Bucket?: string, s3Prefix?: string, region?: string): {
        [key: string]: string;
    };
    /**
     * Validate and apply log retention defaults
     */
    static getLogRetention(environment: 'dev' | 'staging' | 'prod', override?: RetentionDays): RetentionDays;
    /**
     * Get removal policy based on environment and override
     */
    static getRemovalPolicy(environment: 'dev' | 'staging' | 'prod', override?: RemovalPolicy): RemovalPolicy;
}
//# sourceMappingURL=defaults.d.ts.map