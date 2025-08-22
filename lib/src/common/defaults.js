"use strict";
/**
 * Default configurations for CDK constructs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigDefaults = exports.BEDROCK_KNOWLEDGE_BASE_DEFAULTS = exports.BEDROCK_AGENT_CORE_DEFAULTS = exports.DEFAULT_TAGGING_CONFIG = exports.ENVIRONMENT_DEFAULTS = exports.DEFAULT_MONITORING_CONFIG = exports.DEFAULT_SECURITY_CONFIG = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_logs_1 = require("aws-cdk-lib/aws-logs");
/**
 * Default security configurations by environment
 */
exports.DEFAULT_SECURITY_CONFIG = {
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
exports.DEFAULT_MONITORING_CONFIG = {
    dev: {
        enableLogging: true,
        logRetentionDays: aws_logs_1.RetentionDays.ONE_WEEK,
        enableTracing: false,
        enableMetrics: true,
        enableAlarms: false,
    },
    staging: {
        enableLogging: true,
        logRetentionDays: aws_logs_1.RetentionDays.ONE_MONTH,
        enableTracing: true,
        enableMetrics: true,
        enableAlarms: true,
    },
    prod: {
        enableLogging: true,
        logRetentionDays: aws_logs_1.RetentionDays.SIX_MONTHS,
        enableTracing: true,
        enableMetrics: true,
        enableAlarms: true,
    },
};
/**
 * Environment-specific default configurations
 */
exports.ENVIRONMENT_DEFAULTS = {
    dev: {
        name: 'dev',
        removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        security: exports.DEFAULT_SECURITY_CONFIG.dev,
        monitoring: exports.DEFAULT_MONITORING_CONFIG.dev,
        costOptimized: true,
    },
    staging: {
        name: 'staging',
        removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        security: exports.DEFAULT_SECURITY_CONFIG.staging,
        monitoring: exports.DEFAULT_MONITORING_CONFIG.staging,
        costOptimized: true,
    },
    prod: {
        name: 'prod',
        removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
        security: exports.DEFAULT_SECURITY_CONFIG.prod,
        monitoring: exports.DEFAULT_MONITORING_CONFIG.prod,
        costOptimized: false,
    },
};
/**
 * Default tagging configuration
 */
exports.DEFAULT_TAGGING_CONFIG = {
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
exports.BEDROCK_AGENT_CORE_DEFAULTS = {
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
    logRetention: aws_logs_1.RetentionDays.ONE_WEEK,
};
/**
 * Bedrock Knowledge Base specific defaults
 */
exports.BEDROCK_KNOWLEDGE_BASE_DEFAULTS = {
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
class ConfigDefaults {
    /**
     * Get environment-specific defaults
     */
    static getEnvironmentDefaults(environment) {
        return { ...exports.ENVIRONMENT_DEFAULTS[environment] };
    }
    /**
     * Apply default values to base construct properties
     */
    static applyBaseDefaults(props) {
        const environment = props.environment || 'dev';
        const envDefaults = this.getEnvironmentDefaults(environment);
        return {
            environment,
            naming: props.naming || {},
            tags: {
                ...exports.DEFAULT_TAGGING_CONFIG.standardTags,
                ...exports.DEFAULT_TAGGING_CONFIG.environmentTags,
                Environment: environment,
                ...props.tags,
            },
            removalPolicy: props.removalPolicy || envDefaults.removalPolicy,
        };
    }
    /**
     * Get security configuration with environment defaults
     */
    static getSecurityConfig(environment, overrides) {
        return {
            ...exports.DEFAULT_SECURITY_CONFIG[environment],
            ...overrides,
        };
    }
    /**
     * Get monitoring configuration with environment defaults
     */
    static getMonitoringConfig(environment, overrides) {
        return {
            ...exports.DEFAULT_MONITORING_CONFIG[environment],
            ...overrides,
        };
    }
    /**
     * Generate resource name with prefix/suffix
     */
    static generateResourceName(baseName, naming) {
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
    static getBedrockAgentCoreEnvironmentVariables(customVars, s3Bucket, s3Prefix, region) {
        const defaultVars = { ...exports.BEDROCK_AGENT_CORE_DEFAULTS.environmentVariables };
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
    static getLogRetention(environment, override) {
        if (override !== undefined) {
            return override;
        }
        return exports.DEFAULT_MONITORING_CONFIG[environment].logRetentionDays;
    }
    /**
     * Get removal policy based on environment and override
     */
    static getRemovalPolicy(environment, override) {
        if (override !== undefined) {
            return override;
        }
        return exports.ENVIRONMENT_DEFAULTS[environment].removalPolicy;
    }
}
exports.ConfigDefaults = ConfigDefaults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2RlZmF1bHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsNkNBQTRDO0FBQzVDLG1EQUFxRDtBQVNyRDs7R0FFRztBQUNVLFFBQUEsdUJBQXVCLEdBQXVEO0lBQ3pGLEdBQUcsRUFBRTtRQUNILGdCQUFnQixFQUFFLEtBQUs7UUFDdkIsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixtQkFBbUIsRUFBRSxLQUFLO1FBQzFCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsa0JBQWtCLEVBQUUsS0FBSztLQUMxQjtJQUNELE9BQU8sRUFBRTtRQUNQLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixtQkFBbUIsRUFBRSxJQUFJO1FBQ3pCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsa0JBQWtCLEVBQUUsS0FBSztLQUMxQjtJQUNELElBQUksRUFBRTtRQUNKLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixtQkFBbUIsRUFBRSxJQUFJO1FBQ3pCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsa0JBQWtCLEVBQUUsSUFBSTtLQUN6QjtDQUNGLENBQUM7QUFFRjs7R0FFRztBQUNVLFFBQUEseUJBQXlCLEdBQXlEO0lBQzdGLEdBQUcsRUFBRTtRQUNILGFBQWEsRUFBRSxJQUFJO1FBQ25CLGdCQUFnQixFQUFFLHdCQUFhLENBQUMsUUFBUTtRQUN4QyxhQUFhLEVBQUUsS0FBSztRQUNwQixhQUFhLEVBQUUsSUFBSTtRQUNuQixZQUFZLEVBQUUsS0FBSztLQUNwQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSxJQUFJO1FBQ25CLGdCQUFnQixFQUFFLHdCQUFhLENBQUMsU0FBUztRQUN6QyxhQUFhLEVBQUUsSUFBSTtRQUNuQixhQUFhLEVBQUUsSUFBSTtRQUNuQixZQUFZLEVBQUUsSUFBSTtLQUNuQjtJQUNELElBQUksRUFBRTtRQUNKLGFBQWEsRUFBRSxJQUFJO1FBQ25CLGdCQUFnQixFQUFFLHdCQUFhLENBQUMsVUFBVTtRQUMxQyxhQUFhLEVBQUUsSUFBSTtRQUNuQixhQUFhLEVBQUUsSUFBSTtRQUNuQixZQUFZLEVBQUUsSUFBSTtLQUNuQjtDQUNGLENBQUM7QUFFRjs7R0FFRztBQUNVLFFBQUEsb0JBQW9CLEdBQTREO0lBQzNGLEdBQUcsRUFBRTtRQUNILElBQUksRUFBRSxLQUFLO1FBQ1gsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztRQUNwQyxRQUFRLEVBQUUsK0JBQXVCLENBQUMsR0FBRztRQUNyQyxVQUFVLEVBQUUsaUNBQXlCLENBQUMsR0FBRztRQUN6QyxhQUFhLEVBQUUsSUFBSTtLQUNwQjtJQUNELE9BQU8sRUFBRTtRQUNQLElBQUksRUFBRSxTQUFTO1FBQ2YsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztRQUNwQyxRQUFRLEVBQUUsK0JBQXVCLENBQUMsT0FBTztRQUN6QyxVQUFVLEVBQUUsaUNBQXlCLENBQUMsT0FBTztRQUM3QyxhQUFhLEVBQUUsSUFBSTtLQUNwQjtJQUNELElBQUksRUFBRTtRQUNKLElBQUksRUFBRSxNQUFNO1FBQ1osYUFBYSxFQUFFLDJCQUFhLENBQUMsTUFBTTtRQUNuQyxRQUFRLEVBQUUsK0JBQXVCLENBQUMsSUFBSTtRQUN0QyxVQUFVLEVBQUUsaUNBQXlCLENBQUMsSUFBSTtRQUMxQyxhQUFhLEVBQUUsS0FBSztLQUNyQjtDQUNGLENBQUM7QUFFRjs7R0FFRztBQUNVLFFBQUEsc0JBQXNCLEdBQWtCO0lBQ25ELFlBQVksRUFBRTtRQUNaLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLFNBQVMsRUFBRSx5QkFBeUI7S0FDckM7SUFDRCxlQUFlLEVBQUU7UUFDZixhQUFhLEVBQUUsZ0JBQWdCLEVBQUUsMkNBQTJDO0tBQzdFO0lBQ0Qsa0JBQWtCLEVBQUU7UUFDbEIsWUFBWSxFQUFFLGFBQWE7UUFDM0IsTUFBTSxFQUFFLFVBQVU7S0FDbkI7Q0FDRixDQUFDO0FBRUY7O0dBRUc7QUFDVSxRQUFBLDJCQUEyQixHQUFHO0lBQ3pDOztPQUVHO0lBQ0gsUUFBUSxFQUFFLE1BQU07SUFFaEI7O09BRUc7SUFDSCxvQkFBb0IsRUFBRTtRQUNwQixRQUFRLEVBQUUsTUFBTTtRQUNoQixnQkFBZ0IsRUFBRSxPQUFPO1FBQ3pCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFlBQVksRUFBRSxJQUFJO1FBQ2xCLGlCQUFpQixFQUFFLE1BQU07UUFDekIsa0JBQWtCLEVBQUUsTUFBTTtRQUMxQixRQUFRLEVBQUUsWUFBWTtRQUN0QixTQUFTLEVBQUUsTUFBTTtLQUNsQjtJQUVEOztPQUVHO0lBQ0gsY0FBYyxFQUFFLGFBQWE7SUFFN0I7O09BRUc7SUFDSCxxQkFBcUIsRUFBRSxFQUFFLEVBQUUsVUFBVTtJQUVyQzs7T0FFRztJQUNILFlBQVksRUFBRSx3QkFBYSxDQUFDLFFBQVE7Q0FDckMsQ0FBQztBQUVGOztHQUVHO0FBQ1UsUUFBQSwrQkFBK0IsR0FBRztJQUM3Qzs7T0FFRztJQUNILHFCQUFxQixFQUFFLEVBQUU7SUFFekI7O09BRUc7SUFDSCxnQkFBZ0IsRUFBRTtRQUNoQixTQUFTLEVBQUUsR0FBRztRQUNkLGlCQUFpQixFQUFFLEVBQUU7S0FDdEI7SUFFRDs7T0FFRztJQUNILGNBQWMsRUFBRSw4QkFBOEI7Q0FDL0MsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBYSxjQUFjO0lBQ3pCOztPQUVHO0lBQ0gsTUFBTSxDQUFDLHNCQUFzQixDQUFDLFdBQXVDO1FBQ25FLE9BQU8sRUFBRSxHQUFHLDRCQUFvQixDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7SUFDbEQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEtBQXlCO1FBQ2hELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDO1FBQy9DLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUU3RCxPQUFPO1lBQ0wsV0FBVztZQUNYLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUU7WUFDMUIsSUFBSSxFQUFFO2dCQUNKLEdBQUcsOEJBQXNCLENBQUMsWUFBWTtnQkFDdEMsR0FBRyw4QkFBc0IsQ0FBQyxlQUFlO2dCQUN6QyxXQUFXLEVBQUUsV0FBVztnQkFDeEIsR0FBRyxLQUFLLENBQUMsSUFBSTthQUNkO1lBQ0QsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhLElBQUksV0FBVyxDQUFDLGFBQWE7U0FDaEUsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxXQUF1QyxFQUFFLFNBQW1DO1FBQ25HLE9BQU87WUFDTCxHQUFHLCtCQUF1QixDQUFDLFdBQVcsQ0FBQztZQUN2QyxHQUFHLFNBQVM7U0FDYixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFdBQXVDLEVBQUUsU0FBcUM7UUFDdkcsT0FBTztZQUNMLEdBQUcsaUNBQXlCLENBQUMsV0FBVyxDQUFDO1lBQ3pDLEdBQUcsU0FBUztTQUNiLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsb0JBQW9CLENBQUMsUUFBZ0IsRUFBRSxNQUE2QztRQUN6RixJQUFJLElBQUksR0FBRyxRQUFRLENBQUM7UUFFcEIsSUFBSSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDbkIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDbkIsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsdUNBQXVDLENBQzVDLFVBQXNDLEVBQ3RDLFFBQWlCLEVBQ2pCLFFBQWlCLEVBQ2pCLE1BQWU7UUFFZixNQUFNLFdBQVcsR0FBOEIsRUFBRSxHQUFHLG1DQUEyQixDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFdkcsbUNBQW1DO1FBQ25DLElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixXQUFXLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNiLFdBQVcsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ25DLENBQUM7UUFDRCxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1gsV0FBVyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDL0IsV0FBVyxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7UUFDbEMsQ0FBQztRQUVELE9BQU87WUFDTCxHQUFHLFdBQVc7WUFDZCxHQUFHLFVBQVU7U0FDZCxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUF1QyxFQUFFLFFBQXdCO1FBQ3RGLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7UUFDRCxPQUFPLGlDQUF5QixDQUFDLFdBQVcsQ0FBQyxDQUFDLGdCQUFpQyxDQUFDO0lBQ2xGLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUF1QyxFQUFFLFFBQXdCO1FBQ3ZGLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7UUFDRCxPQUFPLDRCQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDLGFBQWEsQ0FBQztJQUN6RCxDQUFDO0NBQ0Y7QUFqSEQsd0NBaUhDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBEZWZhdWx0IGNvbmZpZ3VyYXRpb25zIGZvciBDREsgY29uc3RydWN0c1xuICovXG5cbmltcG9ydCB7IFJlbW92YWxQb2xpY3kgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBSZXRlbnRpb25EYXlzIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0IHsgXG4gIEVudmlyb25tZW50RGVmYXVsdHMsIFxuICBTZWN1cml0eUNvbmZpZywgXG4gIE1vbml0b3JpbmdDb25maWcsIFxuICBUYWdnaW5nQ29uZmlnLFxuICBCYXNlQ29uc3RydWN0UHJvcHMgXG59IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5cbi8qKlxuICogRGVmYXVsdCBzZWN1cml0eSBjb25maWd1cmF0aW9ucyBieSBlbnZpcm9ubWVudFxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRUNVUklUWV9DT05GSUc6IFJlY29yZDwnZGV2JyB8ICdzdGFnaW5nJyB8ICdwcm9kJywgU2VjdXJpdHlDb25maWc+ID0ge1xuICBkZXY6IHtcbiAgICBlbmNyeXB0aW9uQXRSZXN0OiBmYWxzZSxcbiAgICBlbmNyeXB0aW9uSW5UcmFuc2l0OiB0cnVlLFxuICAgIGVuYWJsZUFjY2Vzc0xvZ2dpbmc6IGZhbHNlLFxuICAgIHJlc3RyaWN0UHVibGljQWNjZXNzOiB0cnVlLFxuICAgIGVuYWJsZVZwY0VuZHBvaW50czogZmFsc2UsXG4gIH0sXG4gIHN0YWdpbmc6IHtcbiAgICBlbmNyeXB0aW9uQXRSZXN0OiB0cnVlLFxuICAgIGVuY3J5cHRpb25JblRyYW5zaXQ6IHRydWUsXG4gICAgZW5hYmxlQWNjZXNzTG9nZ2luZzogdHJ1ZSxcbiAgICByZXN0cmljdFB1YmxpY0FjY2VzczogdHJ1ZSxcbiAgICBlbmFibGVWcGNFbmRwb2ludHM6IGZhbHNlLFxuICB9LFxuICBwcm9kOiB7XG4gICAgZW5jcnlwdGlvbkF0UmVzdDogdHJ1ZSxcbiAgICBlbmNyeXB0aW9uSW5UcmFuc2l0OiB0cnVlLFxuICAgIGVuYWJsZUFjY2Vzc0xvZ2dpbmc6IHRydWUsXG4gICAgcmVzdHJpY3RQdWJsaWNBY2Nlc3M6IHRydWUsXG4gICAgZW5hYmxlVnBjRW5kcG9pbnRzOiB0cnVlLFxuICB9LFxufTtcblxuLyoqXG4gKiBEZWZhdWx0IG1vbml0b3JpbmcgY29uZmlndXJhdGlvbnMgYnkgZW52aXJvbm1lbnRcbiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfTU9OSVRPUklOR19DT05GSUc6IFJlY29yZDwnZGV2JyB8ICdzdGFnaW5nJyB8ICdwcm9kJywgTW9uaXRvcmluZ0NvbmZpZz4gPSB7XG4gIGRldjoge1xuICAgIGVuYWJsZUxvZ2dpbmc6IHRydWUsXG4gICAgbG9nUmV0ZW50aW9uRGF5czogUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICBlbmFibGVUcmFjaW5nOiBmYWxzZSxcbiAgICBlbmFibGVNZXRyaWNzOiB0cnVlLFxuICAgIGVuYWJsZUFsYXJtczogZmFsc2UsXG4gIH0sXG4gIHN0YWdpbmc6IHtcbiAgICBlbmFibGVMb2dnaW5nOiB0cnVlLFxuICAgIGxvZ1JldGVudGlvbkRheXM6IFJldGVudGlvbkRheXMuT05FX01PTlRILFxuICAgIGVuYWJsZVRyYWNpbmc6IHRydWUsXG4gICAgZW5hYmxlTWV0cmljczogdHJ1ZSxcbiAgICBlbmFibGVBbGFybXM6IHRydWUsXG4gIH0sXG4gIHByb2Q6IHtcbiAgICBlbmFibGVMb2dnaW5nOiB0cnVlLFxuICAgIGxvZ1JldGVudGlvbkRheXM6IFJldGVudGlvbkRheXMuU0lYX01PTlRIUyxcbiAgICBlbmFibGVUcmFjaW5nOiB0cnVlLFxuICAgIGVuYWJsZU1ldHJpY3M6IHRydWUsXG4gICAgZW5hYmxlQWxhcm1zOiB0cnVlLFxuICB9LFxufTtcblxuLyoqXG4gKiBFbnZpcm9ubWVudC1zcGVjaWZpYyBkZWZhdWx0IGNvbmZpZ3VyYXRpb25zXG4gKi9cbmV4cG9ydCBjb25zdCBFTlZJUk9OTUVOVF9ERUZBVUxUUzogUmVjb3JkPCdkZXYnIHwgJ3N0YWdpbmcnIHwgJ3Byb2QnLCBFbnZpcm9ubWVudERlZmF1bHRzPiA9IHtcbiAgZGV2OiB7XG4gICAgbmFtZTogJ2RldicsXG4gICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIHNlY3VyaXR5OiBERUZBVUxUX1NFQ1VSSVRZX0NPTkZJRy5kZXYsXG4gICAgbW9uaXRvcmluZzogREVGQVVMVF9NT05JVE9SSU5HX0NPTkZJRy5kZXYsXG4gICAgY29zdE9wdGltaXplZDogdHJ1ZSxcbiAgfSxcbiAgc3RhZ2luZzoge1xuICAgIG5hbWU6ICdzdGFnaW5nJyxcbiAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgc2VjdXJpdHk6IERFRkFVTFRfU0VDVVJJVFlfQ09ORklHLnN0YWdpbmcsXG4gICAgbW9uaXRvcmluZzogREVGQVVMVF9NT05JVE9SSU5HX0NPTkZJRy5zdGFnaW5nLFxuICAgIGNvc3RPcHRpbWl6ZWQ6IHRydWUsXG4gIH0sXG4gIHByb2Q6IHtcbiAgICBuYW1lOiAncHJvZCcsXG4gICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgc2VjdXJpdHk6IERFRkFVTFRfU0VDVVJJVFlfQ09ORklHLnByb2QsXG4gICAgbW9uaXRvcmluZzogREVGQVVMVF9NT05JVE9SSU5HX0NPTkZJRy5wcm9kLFxuICAgIGNvc3RPcHRpbWl6ZWQ6IGZhbHNlLFxuICB9LFxufTtcblxuLyoqXG4gKiBEZWZhdWx0IHRhZ2dpbmcgY29uZmlndXJhdGlvblxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9UQUdHSU5HX0NPTkZJRzogVGFnZ2luZ0NvbmZpZyA9IHtcbiAgc3RhbmRhcmRUYWdzOiB7XG4gICAgJ01hbmFnZWRCeSc6ICdDREsnLFxuICAgICdQcm9qZWN0JzogJ3JldXNhYmxlLWNkay1jb25zdHJ1Y3RzJyxcbiAgfSxcbiAgZW52aXJvbm1lbnRUYWdzOiB7XG4gICAgJ0Vudmlyb25tZW50JzogJyR7ZW52aXJvbm1lbnR9JywgLy8gV2lsbCBiZSByZXBsYWNlZCB3aXRoIGFjdHVhbCBlbnZpcm9ubWVudFxuICB9LFxuICBjb3N0QWxsb2NhdGlvblRhZ3M6IHtcbiAgICAnQ29zdENlbnRlcic6ICdFbmdpbmVlcmluZycsXG4gICAgJ1RlYW0nOiAnUGxhdGZvcm0nLFxuICB9LFxufTtcblxuLyoqXG4gKiBCZWRyb2NrIEFnZW50IENvcmUgc3BlY2lmaWMgZGVmYXVsdHNcbiAqL1xuZXhwb3J0IGNvbnN0IEJFRFJPQ0tfQUdFTlRfQ09SRV9ERUZBVUxUUyA9IHtcbiAgLyoqXG4gICAqIERlZmF1bHQgcHJvdG9jb2wgZm9yIEFnZW50IENvcmUgUnVudGltZVxuICAgKi9cbiAgcHJvdG9jb2w6ICdIVFRQJyxcbiAgXG4gIC8qKlxuICAgKiBEZWZhdWx0IGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgQWdlbnQgQ29yZSBSdW50aW1lXG4gICAqL1xuICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgIE1DUF9QT1JUOiAnODAwMCcsXG4gICAgTUNQX0FVVEhfRU5BQkxFRDogJ2ZhbHNlJyxcbiAgICBNQ1BfU1NFX0VOQUJMRUQ6ICdmYWxzZScsXG4gICAgU1RPUkFHRV9UWVBFOiAnczMnLFxuICAgIFMzX1VSTF9FWFBJUkFUSU9OOiAnMzYwMCcsXG4gICAgVVNFX1BSRVNJR05FRF9VUkxTOiAndHJ1ZScsXG4gICAgTk9ERV9FTlY6ICdwcm9kdWN0aW9uJyxcbiAgICBMT0dfTEVWRUw6ICdpbmZvJyxcbiAgfSxcbiAgXG4gIC8qKlxuICAgKiBEZWZhdWx0IERvY2tlciBwbGF0Zm9ybVxuICAgKi9cbiAgZG9ja2VyUGxhdGZvcm06ICdsaW51eC9hcm02NCcsXG4gIFxuICAvKipcbiAgICogRGVmYXVsdCB0aW1lb3V0IGZvciBjdXN0b20gcmVzb3VyY2Ugb3BlcmF0aW9uc1xuICAgKi9cbiAgY3VzdG9tUmVzb3VyY2VUaW1lb3V0OiAxMCwgLy8gbWludXRlc1xuICBcbiAgLyoqXG4gICAqIERlZmF1bHQgbG9nIHJldGVudGlvbiBmb3IgQWdlbnQgQ29yZSBSdW50aW1lXG4gICAqL1xuICBsb2dSZXRlbnRpb246IFJldGVudGlvbkRheXMuT05FX1dFRUssXG59O1xuXG4vKipcbiAqIEJlZHJvY2sgS25vd2xlZGdlIEJhc2Ugc3BlY2lmaWMgZGVmYXVsdHNcbiAqL1xuZXhwb3J0IGNvbnN0IEJFRFJPQ0tfS05PV0xFREdFX0JBU0VfREVGQVVMVFMgPSB7XG4gIC8qKlxuICAgKiBEZWZhdWx0IGRhdGEgc291cmNlIHN5bmMgaW50ZXJ2YWwgaW4gbWludXRlc1xuICAgKi9cbiAgZGF0YVNvdXJjZVN5bmNNaW51dGVzOiAxMCxcbiAgXG4gIC8qKlxuICAgKiBEZWZhdWx0IGNodW5raW5nIHN0cmF0ZWd5XG4gICAqL1xuICBjaHVua2luZ1N0cmF0ZWd5OiB7XG4gICAgbWF4VG9rZW5zOiA1MDAsXG4gICAgb3ZlcmxhcFBlcmNlbnRhZ2U6IDIwLFxuICB9LFxuICBcbiAgLyoqXG4gICAqIERlZmF1bHQgZW1iZWRkaW5nIG1vZGVsXG4gICAqL1xuICBlbWJlZGRpbmdNb2RlbDogJ2FtYXpvbi50aXRhbi1lbWJlZC10ZXh0LXYyOjAnLFxufTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGRlZmF1bHRzIHV0aWxpdHkgY2xhc3NcbiAqL1xuZXhwb3J0IGNsYXNzIENvbmZpZ0RlZmF1bHRzIHtcbiAgLyoqXG4gICAqIEdldCBlbnZpcm9ubWVudC1zcGVjaWZpYyBkZWZhdWx0c1xuICAgKi9cbiAgc3RhdGljIGdldEVudmlyb25tZW50RGVmYXVsdHMoZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3N0YWdpbmcnIHwgJ3Byb2QnKTogRW52aXJvbm1lbnREZWZhdWx0cyB7XG4gICAgcmV0dXJuIHsgLi4uRU5WSVJPTk1FTlRfREVGQVVMVFNbZW52aXJvbm1lbnRdIH07XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgZGVmYXVsdCB2YWx1ZXMgdG8gYmFzZSBjb25zdHJ1Y3QgcHJvcGVydGllc1xuICAgKi9cbiAgc3RhdGljIGFwcGx5QmFzZURlZmF1bHRzKHByb3BzOiBCYXNlQ29uc3RydWN0UHJvcHMpOiBSZXF1aXJlZDxCYXNlQ29uc3RydWN0UHJvcHM+IHtcbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IHByb3BzLmVudmlyb25tZW50IHx8ICdkZXYnO1xuICAgIGNvbnN0IGVudkRlZmF1bHRzID0gdGhpcy5nZXRFbnZpcm9ubWVudERlZmF1bHRzKGVudmlyb25tZW50KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgZW52aXJvbm1lbnQsXG4gICAgICBuYW1pbmc6IHByb3BzLm5hbWluZyB8fCB7fSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgLi4uREVGQVVMVF9UQUdHSU5HX0NPTkZJRy5zdGFuZGFyZFRhZ3MsXG4gICAgICAgIC4uLkRFRkFVTFRfVEFHR0lOR19DT05GSUcuZW52aXJvbm1lbnRUYWdzLFxuICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnQsXG4gICAgICAgIC4uLnByb3BzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgcmVtb3ZhbFBvbGljeTogcHJvcHMucmVtb3ZhbFBvbGljeSB8fCBlbnZEZWZhdWx0cy5yZW1vdmFsUG9saWN5LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IHNlY3VyaXR5IGNvbmZpZ3VyYXRpb24gd2l0aCBlbnZpcm9ubWVudCBkZWZhdWx0c1xuICAgKi9cbiAgc3RhdGljIGdldFNlY3VyaXR5Q29uZmlnKGVudmlyb25tZW50OiAnZGV2JyB8ICdzdGFnaW5nJyB8ICdwcm9kJywgb3ZlcnJpZGVzPzogUGFydGlhbDxTZWN1cml0eUNvbmZpZz4pOiBTZWN1cml0eUNvbmZpZyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLkRFRkFVTFRfU0VDVVJJVFlfQ09ORklHW2Vudmlyb25tZW50XSxcbiAgICAgIC4uLm92ZXJyaWRlcyxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBtb25pdG9yaW5nIGNvbmZpZ3VyYXRpb24gd2l0aCBlbnZpcm9ubWVudCBkZWZhdWx0c1xuICAgKi9cbiAgc3RhdGljIGdldE1vbml0b3JpbmdDb25maWcoZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3N0YWdpbmcnIHwgJ3Byb2QnLCBvdmVycmlkZXM/OiBQYXJ0aWFsPE1vbml0b3JpbmdDb25maWc+KTogTW9uaXRvcmluZ0NvbmZpZyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLkRFRkFVTFRfTU9OSVRPUklOR19DT05GSUdbZW52aXJvbm1lbnRdLFxuICAgICAgLi4ub3ZlcnJpZGVzLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgcmVzb3VyY2UgbmFtZSB3aXRoIHByZWZpeC9zdWZmaXhcbiAgICovXG4gIHN0YXRpYyBnZW5lcmF0ZVJlc291cmNlTmFtZShiYXNlTmFtZTogc3RyaW5nLCBuYW1pbmc/OiB7IHByZWZpeD86IHN0cmluZzsgc3VmZml4Pzogc3RyaW5nIH0pOiBzdHJpbmcge1xuICAgIGxldCBuYW1lID0gYmFzZU5hbWU7XG4gICAgXG4gICAgaWYgKG5hbWluZz8ucHJlZml4KSB7XG4gICAgICBuYW1lID0gYCR7bmFtaW5nLnByZWZpeH0tJHtuYW1lfWA7XG4gICAgfVxuICAgIFxuICAgIGlmIChuYW1pbmc/LnN1ZmZpeCkge1xuICAgICAgbmFtZSA9IGAke25hbWV9LSR7bmFtaW5nLnN1ZmZpeH1gO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgQmVkcm9jayBBZ2VudCBDb3JlIGVudmlyb25tZW50IHZhcmlhYmxlcyB3aXRoIGRlZmF1bHRzXG4gICAqL1xuICBzdGF0aWMgZ2V0QmVkcm9ja0FnZW50Q29yZUVudmlyb25tZW50VmFyaWFibGVzKFxuICAgIGN1c3RvbVZhcnM/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9LFxuICAgIHMzQnVja2V0Pzogc3RyaW5nLFxuICAgIHMzUHJlZml4Pzogc3RyaW5nLFxuICAgIHJlZ2lvbj86IHN0cmluZ1xuICApOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9IHtcbiAgICBjb25zdCBkZWZhdWx0VmFyczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHsgLi4uQkVEUk9DS19BR0VOVF9DT1JFX0RFRkFVTFRTLmVudmlyb25tZW50VmFyaWFibGVzIH07XG4gICAgXG4gICAgLy8gQWRkIFMzIGNvbmZpZ3VyYXRpb24gaWYgcHJvdmlkZWRcbiAgICBpZiAoczNCdWNrZXQpIHtcbiAgICAgIGRlZmF1bHRWYXJzLlMzX0JVQ0tFVCA9IHMzQnVja2V0O1xuICAgIH1cbiAgICBpZiAoczNQcmVmaXgpIHtcbiAgICAgIGRlZmF1bHRWYXJzLlMzX1BSRUZJWCA9IHMzUHJlZml4O1xuICAgIH1cbiAgICBpZiAocmVnaW9uKSB7XG4gICAgICBkZWZhdWx0VmFycy5TM19SRUdJT04gPSByZWdpb247XG4gICAgICBkZWZhdWx0VmFycy5BV1NfUkVHSU9OID0gcmVnaW9uO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZGVmYXVsdFZhcnMsXG4gICAgICAuLi5jdXN0b21WYXJzLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgYW5kIGFwcGx5IGxvZyByZXRlbnRpb24gZGVmYXVsdHNcbiAgICovXG4gIHN0YXRpYyBnZXRMb2dSZXRlbnRpb24oZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3N0YWdpbmcnIHwgJ3Byb2QnLCBvdmVycmlkZT86IFJldGVudGlvbkRheXMpOiBSZXRlbnRpb25EYXlzIHtcbiAgICBpZiAob3ZlcnJpZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG92ZXJyaWRlO1xuICAgIH1cbiAgICByZXR1cm4gREVGQVVMVF9NT05JVE9SSU5HX0NPTkZJR1tlbnZpcm9ubWVudF0ubG9nUmV0ZW50aW9uRGF5cyBhcyBSZXRlbnRpb25EYXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCByZW1vdmFsIHBvbGljeSBiYXNlZCBvbiBlbnZpcm9ubWVudCBhbmQgb3ZlcnJpZGVcbiAgICovXG4gIHN0YXRpYyBnZXRSZW1vdmFsUG9saWN5KGVudmlyb25tZW50OiAnZGV2JyB8ICdzdGFnaW5nJyB8ICdwcm9kJywgb3ZlcnJpZGU/OiBSZW1vdmFsUG9saWN5KTogUmVtb3ZhbFBvbGljeSB7XG4gICAgaWYgKG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBvdmVycmlkZTtcbiAgICB9XG4gICAgcmV0dXJuIEVOVklST05NRU5UX0RFRkFVTFRTW2Vudmlyb25tZW50XS5yZW1vdmFsUG9saWN5O1xuICB9XG59Il19