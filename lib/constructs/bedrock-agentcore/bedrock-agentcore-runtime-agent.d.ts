import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BedrockKnowledgeBase } from '../bedrock/bedrock-knowledge-base';
import { BaseConstructProps } from '../../common/interfaces';
/**
 * Properties for the Bedrock Agent Core Runtime Agent construct
 */
export interface BedrockAgentCoreRuntimeAgentProps extends BaseConstructProps {
    /**
     * Unique identifier for the agent
     * Must be alphanumeric with hyphens and underscores only
     */
    agentName: string;
    /**
     * Agent instructions/prompt that defines the agent's behavior
     * Should be clear and specific to guide the agent's responses
     */
    instruction: string;
    /**
     * Path to Docker build context containing Dockerfile.agent-core
     * Must be a valid directory path relative to the CDK app
     */
    projectRoot: string;
    /**
     * S3 bucket for data storage
     * The agent will have read/write access to this bucket
     */
    s3Bucket: Bucket;
    /**
     * S3 prefix for agent data within the bucket
     * Should end with '/' for proper organization
     */
    s3Prefix: string;
    /**
     * Associated knowledge bases for the agent
     * The agent will have retrieval permissions for these knowledge bases
     */
    knowledgeBases: BedrockKnowledgeBase[];
    /**
     * Communication protocol for the agent runtime
     * @default 'HTTP'
     */
    protocol?: 'HTTP' | 'HTTPS';
    /**
     * Additional environment variables for the agent runtime
     * These will be merged with default environment variables
     */
    environmentVars?: {
        [key: string]: string;
    };
    /**
     * Docker platform for the container image
     * @default Platform.LINUX_ARM64
     */
    dockerPlatform?: Platform;
    /**
     * Custom resource timeout in minutes
     * @default 10
     */
    customResourceTimeoutMinutes?: number;
    /**
     * Additional IAM policy statements to attach to the agent role
     * Use this to grant additional permissions beyond the default set
     */
    additionalPolicyStatements?: PolicyStatement[];
    /**
     * CloudWatch log retention period for the agent runtime
     * @default Based on environment (dev: 1 week, staging: 1 month, prod: 6 months)
     */
    logRetentionDays?: cdk.aws_logs.RetentionDays;
    /**
     * Enable X-Ray tracing for the agent runtime
     * @default Based on environment (dev: false, staging/prod: true)
     */
    enableTracing?: boolean;
    /**
     * Custom description for the agent runtime
     * @default "Bedrock Agent Core Runtime for {agentName}"
     */
    description?: string;
    /**
     * Network mode for the agent runtime
     * @default 'PUBLIC'
     */
    networkMode?: 'PUBLIC' | 'VPC';
    /**
     * Docker build arguments to pass to the image build
     */
    dockerBuildArgs?: {
        [key: string]: string;
    };
    /**
     * Files and directories to exclude from the Docker build context
     * @default Standard exclusions (node_modules, .git, test files, etc.)
     */
    dockerExcludes?: string[];
}
/**
 * Bedrock Agent Core Runtime Agent construct
 *
 * This L3 construct creates a production-ready Bedrock Agent Core Runtime with:
 * - Docker container deployment with configurable platform support
 * - Comprehensive IAM role with least-privilege permissions
 * - S3 integration for persistent data storage
 * - Knowledge base connectivity for RAG capabilities
 * - Custom resource lifecycle management with rollback protection
 * - Environment-specific configuration defaults
 * - Comprehensive input validation and error handling
 *
 * @example
 * ```typescript
 * const agent = new BedrockAgentCoreRuntimeAgent(this, 'MyAgent', {
 *   agentName: 'my-helpful-agent',
 *   instruction: 'You are a helpful assistant that can answer questions using the provided knowledge base.',
 *   projectRoot: './agent-code',
 *   s3Bucket: myDataBucket,
 *   s3Prefix: 'agent-data/',
 *   knowledgeBases: [myKnowledgeBase],
 *   environment: 'prod',
 *   protocol: 'HTTPS'
 * });
 * ```
 */
export declare class BedrockAgentCoreRuntimeAgent extends Construct {
    /** The agent name used for resource identification */
    readonly agentName: string;
    /** IAM role used by the agent runtime */
    private readonly agentRole;
    /** ARN of the created agent runtime */
    readonly agentRuntimeArn: string;
    /** AWS account ID */
    private readonly account;
    /** AWS region */
    private readonly region;
    /** AWS partition */
    private readonly partition;
    /** Communication protocol */
    private readonly protocol;
    /** Applied configuration with defaults */
    private readonly config;
    /**
     * Create a new Bedrock Agent Core Runtime Agent
     *
     * @param scope - The scope in which to define this construct
     * @param id - The scoped construct ID. Must be unique amongst siblings in the same scope
     * @param props - Configuration properties for the agent
     *
     * @throws {ConstructError} When validation fails or required resources cannot be created
     */
    constructor(scope: Construct, id: string, props: BedrockAgentCoreRuntimeAgentProps);
    /**
     * Apply default values to the configuration
     *
     * Merges user-provided properties with environment-specific defaults
     * and construct-specific defaults to create a complete configuration.
     *
     * @param props - User-provided properties
     * @returns Complete configuration with all defaults applied
     */
    private applyDefaults;
    /**
     * Build Docker image asset with configurable platform
     *
     * Creates a Docker image asset from the specified project root directory.
     * The image is built and pushed to ECR automatically by CDK.
     *
     * @param config - Complete configuration with defaults applied
     * @returns DockerImageAsset that can be referenced in the agent runtime
     *
     * @throws {Error} If the project root doesn't exist or Dockerfile.agent-core is missing
     */
    private buildImageAsset;
    /**
     * Create the Agent Core Runtime using AWS Custom Resource
     *
     * Creates a Bedrock Agent Core Runtime with comprehensive configuration including:
     * - Container configuration with ECR image URI
     * - Network configuration for public access
     * - Protocol configuration (HTTP/HTTPS)
     * - Environment variables for MCP and S3 integration
     * - Rollback protection for failed deployments
     *
     * @param config - Complete configuration with defaults applied
     * @param imageAsset - Docker image asset for the agent container
     * @param agentCorePolicy - IAM policy for the custom resource Lambda
     * @returns AwsCustomResource for managing the agent runtime lifecycle
     *
     * @throws {Error} If the agent runtime cannot be created or configured
     */
    private createAgentCoreRuntime;
    /**
     * Get IAM policy for the custom resource Lambda function
     *
     * Creates an IAM policy that grants the custom resource Lambda function
     * the necessary permissions to manage Bedrock Agent Core Runtime resources,
     * including creation, updates, deletion, and workload identity management.
     *
     * @returns AwsCustomResourcePolicy with all required permissions
     */
    private getCustomResourcePolicy;
    /**
     * Create IAM role for the Agent Core Runtime with least-privilege permissions
     *
     * Creates an IAM role that the Agent Core Runtime assumes to access AWS services.
     * The role includes permissions for:
     * - Bedrock model invocation
     * - ECR image access for container deployment
     * - CloudWatch logging and X-Ray tracing
     * - S3 access for data storage (scoped to specific bucket/prefix)
     * - Knowledge base retrieval permissions
     * - OpenSearch Serverless access for vector operations
     * - Workload identity token management
     *
     * @param config - Complete configuration with defaults applied
     * @returns IAM Role that the agent runtime will assume
     */
    private createAgentIamRole;
}
//# sourceMappingURL=bedrock-agentcore-runtime-agent.d.ts.map