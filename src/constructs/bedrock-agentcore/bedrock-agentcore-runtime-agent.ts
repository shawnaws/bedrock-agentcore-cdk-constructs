import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cr from 'aws-cdk-lib/custom-resources';
import {
    Role,
    PolicyStatement,
    ServicePrincipal,
    Effect
} from 'aws-cdk-lib/aws-iam';
import { DockerImageAsset, Platform, TarballImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BedrockKnowledgeBase } from '../bedrock/bedrock-knowledge-base';
import { VectorCollection } from '@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/opensearchserverless';
import {
    BaseConstructProps,
    ValidationResult
} from '../../common/interfaces';
import { BaseValidator, ValidationUtils } from '../../common/validation';
import { ConfigDefaults, BEDROCK_AGENT_CORE_DEFAULTS } from '../../common/defaults';

/**
 * Validator for Bedrock Agent Core Runtime Agent properties
 * 
 * Validates all required and optional properties to ensure they meet
 * AWS service requirements and best practices.
 */
class BedrockAgentCoreRuntimeAgentPropsValidator extends BaseValidator<BedrockAgentCoreRuntimeAgentProps> {
    /**
     * Validate the properties for BedrockAgentCoreRuntimeAgent
     * 
     * @param props - The properties to validate
     * @returns ValidationResult with errors, warnings, and suggestions
     */
    validate(props: BedrockAgentCoreRuntimeAgentProps): ValidationResult {
        this.reset();

        // Validate required fields
        this.validateRequired(props.agentName, 'agentName');
        this.validateRequired(props.instruction, 'instruction');
        this.validateRequired(props.projectRoot, 'projectRoot');
        this.validateRequired(props.s3Bucket, 's3Bucket');
        this.validateRequired(props.s3Prefix, 's3Prefix');
        this.validateRequired(props.knowledgeBases, 'knowledgeBases');

        // Validate agent name format
        if (props.agentName) {
            const nameValidation = ValidationUtils.validateAwsResourceName(props.agentName, 'agentName');
            if (!nameValidation.isValid) {
                this.errors.push(...nameValidation.errors);
                if (nameValidation.suggestions) {
                    this.suggestions.push(...nameValidation.suggestions);
                }
            }
        }

        // Validate instruction length and content
        if (props.instruction) {
            if (props.instruction.length < 10) {
                this.addError(
                    'Agent instruction must be at least 10 characters long',
                    'Please provide a more detailed instruction for the agent'
                );
            }
            if (props.instruction.length > 4000) {
                this.addError(
                    'Agent instruction must be 4000 characters or less',
                    'Please shorten the agent instruction to 4000 characters or less'
                );
            }
        }

        // Validate project root path
        if (props.projectRoot) {
            const pathValidation = ValidationUtils.validateDockerProjectRoot(props.projectRoot);
            if (!pathValidation.isValid) {
                this.errors.push(...pathValidation.errors);
            }
            if (pathValidation.warnings.length > 0) {
                this.warnings.push(...pathValidation.warnings);
            }
            if (pathValidation.suggestions) {
                this.suggestions.push(...pathValidation.suggestions);
            }
        }

        if (props.tarballImageFile) {
            const pathValidation = ValidationUtils.validateTarballImageFilePath(props.tarballImageFile);
            if (!pathValidation.isValid) {
                this.errors.push(...pathValidation.errors);
            }
            if (pathValidation.warnings.length > 0) {
                this.warnings.push(...pathValidation.warnings);
            }
            if (pathValidation.suggestions) {
                this.suggestions.push(...pathValidation.suggestions);
            }
        }

        // Validate S3 prefix
        if (props.s3Prefix) {
            const prefixValidation = ValidationUtils.validateS3Prefix(props.s3Prefix);
            if (!prefixValidation.isValid) {
                this.errors.push(...prefixValidation.errors);
            }
            if (prefixValidation.warnings.length > 0) {
                this.warnings.push(...prefixValidation.warnings);
            }
            if (prefixValidation.suggestions) {
                this.suggestions.push(...prefixValidation.suggestions);
            }
        }

        // Validate knowledge bases array
        if (props.knowledgeBases && !this.validateNonEmptyArray(props.knowledgeBases, 'knowledgeBases')) {
            // Error already added by validateNonEmptyArray
        }

        // Validate protocol if provided
        if (props.protocol) {
            this.validateEnum(props.protocol, ['HTTP', 'HTTPS'], 'protocol');
        }

        // Validate custom resource timeout
        if (props.customResourceTimeoutMinutes !== undefined) {
            this.validateRange(props.customResourceTimeoutMinutes, 1, 60, 'customResourceTimeoutMinutes');
        }

        // Validate network mode if provided
        if (props.networkMode) {
            this.validateEnum(props.networkMode, ['PUBLIC', 'VPC'], 'networkMode');
        }

        // Validate description length
        if (props.description && props.description.length > 500) {
            this.addError(
                'Description must be 500 characters or less',
                'Please shorten the description to 500 characters or less'
            );
        }

        // Validate environment variables
        if (props.environmentVars) {
            for (const [key, value] of Object.entries(props.environmentVars)) {
                if (!key || key.trim() === '') {
                    this.addError(
                        'Environment variable keys cannot be empty',
                        'Please provide valid environment variable keys'
                    );
                }
                if (value === undefined || value === null) {
                    this.addWarning(
                        `Environment variable '${key}' has undefined or null value`,
                        `Consider providing a default value for environment variable '${key}'`
                    );
                }
            }
        }

        return this.createResult();
    }
}

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
    projectRoot?: string;

    /**
     * Tarball image - exclusive use for instead of projectRoot. 
     */
    tarballImageFile?: string;

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
    environmentVars?: { [key: string]: string };

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
    dockerBuildArgs?: { [key: string]: string };

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
export class BedrockAgentCoreRuntimeAgent extends Construct {
    /** The agent name used for resource identification */
    public readonly agentName: string;

    /** IAM role used by the agent runtime */
    private readonly agentRole: Role;

    /** ARN of the created agent runtime */
    public readonly agentRuntimeArn: string;

    /** AWS account ID */
    private readonly account = cdk.Stack.of(this).account;

    /** AWS region */
    private readonly region = cdk.Stack.of(this).region;

    /** AWS partition */
    private readonly partition = cdk.Stack.of(this).partition;

    /** Communication protocol */
    private readonly protocol: string;

    /** Applied configuration with defaults */
    private readonly config: Required<BedrockAgentCoreRuntimeAgentProps>;

    /**
     * Create a new Bedrock Agent Core Runtime Agent
     * 
     * @param scope - The scope in which to define this construct
     * @param id - The scoped construct ID. Must be unique amongst siblings in the same scope
     * @param props - Configuration properties for the agent
     * 
     * @throws {ConstructError} When validation fails or required resources cannot be created
     */
    constructor(scope: Construct, id: string, props: BedrockAgentCoreRuntimeAgentProps) {
        super(scope, id);

        try {
            // Validate input properties
            const validator = new BedrockAgentCoreRuntimeAgentPropsValidator();
            const validationResult = validator.validate(props);

            if (!validationResult.isValid) {
                ValidationUtils.throwIfInvalid(validationResult, 'BedrockAgentCoreRuntimeAgent');
            }

            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                console.warn(`[BedrockAgentCoreRuntimeAgent] Validation warnings for agent '${props.agentName}':`, validationResult.warnings);
                if (validationResult.suggestions) {
                    console.warn(`[BedrockAgentCoreRuntimeAgent] Suggestions:`, validationResult.suggestions);
                }
            }
        } catch (error) {
            throw new Error(`Failed to validate BedrockAgentCoreRuntimeAgent properties: ${error instanceof Error ? error.message : String(error)}`);
        }

        try {
            // Apply defaults to configuration
            this.config = this.applyDefaults(props);

            const stackName = cdk.Stack.of(this).stackName;
            this.agentName = this.config.agentName;
            this.protocol = this.config.protocol || BEDROCK_AGENT_CORE_DEFAULTS.protocol;

            // Create resources with error handling
            this.agentRole = this.createAgentIamRole(this.config);
            let asset;
            if ( this.config.projectRoot !== "" && this.config.tarballImageFile === "") {
                asset = this.buildImageAsset(this.config);
            } else if ( this.config.tarballImageFile !== "" && this.config.projectRoot === "") {
                asset = this.buildTarballAsset(this.config);
            } else {
                throw new Error(`Failed to create BedrockAgentCoreRuntimeAgent resources: Exactly 1 of projectRoot or tarballImageFile must be set.`);
            }
            
            const crPolicy = this.getCustomResourcePolicy();
            const agentRuntime = this.createAgentCoreRuntime(this.config, asset, crPolicy);
            this.agentRuntimeArn = agentRuntime.getResponseField('agentRuntimeArn');

            // Create outputs for easy reference
            new cdk.CfnOutput(this, 'AgentRuntimeArn', {
                value: this.agentRuntimeArn,
                description: 'ARN of the created Agent Core Runtime',
                exportName: `${stackName}-AgentRuntimeArn`,
            });

            new cdk.CfnOutput(this, 'AgentRuntimeId', {
                value: agentRuntime.getResponseField('agentRuntimeId'),
                description: 'ID of the created Agent Core Runtime',
                exportName: `${stackName}-AgentRuntimeId`,
            });

            new cdk.CfnOutput(this, 'S3BucketName', {
                value: this.config.s3Bucket.bucketName,
                description: 'Name of the S3 bucket for data storage',
                exportName: `${stackName}-S3Bucket`,
            });

            new cdk.CfnOutput(this, 'AgentCoreRoleArn', {
                value: this.agentRole.roleArn,
                description: 'ARN of the Agent Core Runtime execution role',
                exportName: `${stackName}-RoleArn`,
            });
        } catch (error) {
            throw new Error(`Failed to create BedrockAgentCoreRuntimeAgent resources: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Apply default values to the configuration
     * 
     * Merges user-provided properties with environment-specific defaults
     * and construct-specific defaults to create a complete configuration.
     * 
     * @param props - User-provided properties
     * @returns Complete configuration with all defaults applied
     */
    private applyDefaults(props: BedrockAgentCoreRuntimeAgentProps): Required<BedrockAgentCoreRuntimeAgentProps> {
        const baseDefaults = ConfigDefaults.applyBaseDefaults(props);

        const environment = baseDefaults.environment;
        const envDefaults = ConfigDefaults.getEnvironmentDefaults(environment);

        return {
            ...baseDefaults,
            agentName: props.agentName,
            instruction: props.instruction,
            projectRoot: props.projectRoot || "",
            tarballImageFile: props.tarballImageFile || "",
            s3Bucket: props.s3Bucket,
            s3Prefix: props.s3Prefix,
            knowledgeBases: props.knowledgeBases,
            protocol: (props.protocol || BEDROCK_AGENT_CORE_DEFAULTS.protocol) as 'HTTP' | 'HTTPS',
            environmentVars: props.environmentVars || {},
            dockerPlatform: props.dockerPlatform || Platform.LINUX_ARM64,
            customResourceTimeoutMinutes: props.customResourceTimeoutMinutes || BEDROCK_AGENT_CORE_DEFAULTS.customResourceTimeout,
            additionalPolicyStatements: props.additionalPolicyStatements || [],
            logRetentionDays: props.logRetentionDays || envDefaults.monitoring.logRetentionDays as cdk.aws_logs.RetentionDays,
            enableTracing: props.enableTracing !== undefined ? props.enableTracing : envDefaults.monitoring.enableTracing || false,
            description: props.description || `Bedrock Agent Core Runtime for ${props.agentName}`,
            networkMode: (props.networkMode || 'PUBLIC') as 'PUBLIC' | 'VPC',
            dockerBuildArgs: props.dockerBuildArgs || {},
            dockerExcludes: props.dockerExcludes || [
                'node_modules',
                'coverage',
                'test*',
                '*.test.ts',
                '*.spec.ts',
                '.git',
                'README.md',
                'infrastructure/',
                '!infrastructure/api-gateway-lambda/lambda/run.js',
                'temp',
                'example-client',
                'memory-bank',
            ],
        };
    }

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
    private buildImageAsset(config: Required<BedrockAgentCoreRuntimeAgentProps>) {
        // Build and push Docker image to ECR
        const dockerImageAsset = new DockerImageAsset(this, `${this.agentName}-ImageAsset`, {
            directory: config.projectRoot,
            file: 'Dockerfile.agent-core',
            platform: config.dockerPlatform,
            exclude: config.dockerExcludes,
            buildArgs: config.dockerBuildArgs,
            // Force rebuild when critical source files change
            // extraHash: finalHash,
        });
        return dockerImageAsset;
    }

    private buildTarballAsset(config: Required<BedrockAgentCoreRuntimeAgentProps>) {
        const tarballImageAsset = new TarballImageAsset(this, `${this.agentName}-TarballAsset`, {
            tarballFile: config.tarballImageFile,            
        })
        return tarballImageAsset;
    }

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
    private createAgentCoreRuntime(config: Required<BedrockAgentCoreRuntimeAgentProps>, imageAsset: DockerImageAsset | TarballImageAsset, agentCorePolicy: cr.AwsCustomResourcePolicy) {

        // Shared configuration for Agent Core Runtime parameters
        const commonDescription = config.description;

        const commonAgentRuntimeArtifact = {
            containerConfiguration: {
                containerUri: imageAsset.imageUri,
            },
        };

        const commonNetworkConfiguration = {
            networkMode: config.networkMode,
        };

        const commonProtocolConfiguration = {
            serverProtocol: this.protocol,
        };

        const commonRoleArn = this.agentRole.roleArn;

        // Get environment variables with defaults and user overrides
        const environmentVariables = ConfigDefaults.getBedrockAgentCoreEnvironmentVariables(
            config.environmentVars,
            config.s3Bucket.bucketName,
            config.s3Prefix,
            this.region
        );

        // Create Agent Core Runtime using AwsCustomResource with enhanced rollback handling
        const agentRuntime = new cr.AwsCustomResource(this, 'AgentRuntime', {
            onCreate: {
                service: 'bedrock-agentcore-control',
                action: 'createAgentRuntime',
                parameters: {
                    agentRuntimeName: config.agentName,
                    description: commonDescription,
                    agentRuntimeArtifact: commonAgentRuntimeArtifact,
                    networkConfiguration: commonNetworkConfiguration,
                    protocolConfiguration: commonProtocolConfiguration,
                    roleArn: commonRoleArn,
                    environmentVariables: environmentVariables,
                },
                physicalResourceId: cr.PhysicalResourceId.fromResponse('agentRuntimeId'),
            },
            onUpdate: {
                service: 'bedrock-agentcore-control',
                action: 'updateAgentRuntime',
                parameters: {
                    agentRuntimeId: new cr.PhysicalResourceIdReference(),
                    description: commonDescription,
                    roleArn: commonRoleArn,
                    agentRuntimeArtifact: commonAgentRuntimeArtifact,
                    networkConfiguration: commonNetworkConfiguration,
                    protocolConfiguration: commonProtocolConfiguration,
                    environmentVariables: environmentVariables,
                },
                physicalResourceId: cr.PhysicalResourceId.fromResponse('agentRuntimeId'),
            },
            onDelete: {
                service: 'bedrock-agentcore-control',
                action: 'deleteAgentRuntime',
                parameters: {
                    agentRuntimeId: new cr.PhysicalResourceIdReference(),
                },
                // Comprehensive error handling for rollback scenarios
                // This prevents rollback failures when Agent Core Runtime creation fails or when resources don't exist
                ignoreErrorCodesMatching: 'ValidationException|InvalidParameterException|ResourceNotFoundException|BadRequestException|ConflictException|InternalServerException|.*agentRuntimeId.*|.*not.*found.*|.*does.*not.*exist.*',
            },
            policy: agentCorePolicy,
            timeout: cdk.Duration.minutes(config.customResourceTimeoutMinutes),
            installLatestAwsSdk: true, // Use the latest SDK version in the Lambda runtime for support agent core operations
            logRetention: config.logRetentionDays,
            resourceType: 'Custom::AgentCoreRuntime', // Fixed typo
        });

        return agentRuntime
    }

    /**
     * Get IAM policy for the custom resource Lambda function
     * 
     * Creates an IAM policy that grants the custom resource Lambda function
     * the necessary permissions to manage Bedrock Agent Core Runtime resources,
     * including creation, updates, deletion, and workload identity management.
     * 
     * @returns AwsCustomResourcePolicy with all required permissions
     */
    private getCustomResourcePolicy() {
        // Custom resource policy for Agent Core Runtime operations
        // This Lambda needs explicit permissions to manage Agent Core Runtime
        const agentCorePolicy = cr.AwsCustomResourcePolicy.fromStatements([
            new PolicyStatement({
                sid: 'AgentCoreRuntimeManagement',
                effect: Effect.ALLOW,
                actions: [
                    'bedrock-agentcore:CreateAgentRuntime',
                    'bedrock-agentcore:CreateAgentRuntimeEndpoint',
                    'bedrock-agentcore:UpdateAgentRuntime',
                    'bedrock-agentcore:UpdateAgentRuntimeEndpoint',
                    'bedrock-agentcore:DeleteAgentRuntime',
                    'bedrock-agentcore:DeleteAgentRuntimeEndpoint',
                    'bedrock-agentcore:GetAgentRuntime',
                    'bedrock-agentcore:GetAgentRuntimeEndpoint',
                    'bedrock-agentcore:DescribeAgentRuntime',
                    'bedrock-agentcore:ListAgentRuntimes',
                    'bedrock-agentcore:ListAgentRuntimeEndpoints',
                    // Workload Identity management - Required for Agent Core Runtime creation
                    'bedrock-agentcore:CreateWorkloadIdentity',
                    'bedrock-agentcore:DeleteWorkloadIdentity',
                    'bedrock-agentcore:GetWorkloadIdentity',
                    'bedrock-agentcore:UpdateWorkloadIdentity',
                    'bedrock-agentcore:ListWorkloadIdentities',
                ],
                resources: [
                    `arn:${this.partition}:bedrock-agentcore:${this.region}:${this.account}:*`,
                    `arn:${this.partition}:bedrock-agentcore:${this.region}:${this.account}:runtime/*`,
                    `arn:${this.partition}:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/*`,
                ],
            }),
            // IAM pass role permissions for the Agent Core execution role
            new PolicyStatement({
                sid: 'AgentCorePassRole',
                effect: Effect.ALLOW,
                actions: [
                    'iam:PassRole',
                ],
                resources: [this.agentRole.roleArn],
                conditions: {
                    StringEquals: {
                        'iam:PassedToService': 'bedrock-agentcore.amazonaws.com',
                    },
                },
            }),
            // ECR permissions to validate container images
            new PolicyStatement({
                sid: 'ECRValidateImages',
                effect: Effect.ALLOW,
                actions: [
                    'ecr:DescribeImages',
                    'ecr:DescribeRepositories',
                ],
                resources: [
                    `arn:${this.partition}:ecr:${this.region}:${this.account}:repository/*`,
                ],
            }),
        ]);
        return agentCorePolicy
    }

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
    private createAgentIamRole(config: Required<BedrockAgentCoreRuntimeAgentProps>) {
        const agentRole = new Role(this, 'AgentRole', {
            assumedBy: new ServicePrincipal('bedrock-agentcore.amazonaws.com', {
                conditions: {
                    'StringEquals': {
                        'aws:SourceAccount': this.account
                    },
                    'ArnLike': {
                        'aws:SourceArn': `arn:aws:bedrock-agentcore:${this.region}:${this.account}:*`
                    }
                }
            }),
        });
        agentRole.addToPolicy(new PolicyStatement({
            sid: "BedrockPermissions",
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: [
                `*`,
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            sid: "ECRImageAccess",
            actions: [
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetAuthorizationToken",
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer",
            ],
            resources: [
                `arn:aws:ecr:${this.region}:${this.account}:repository/*`
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            actions: [
                'logs:DescribeLogStreams',
                'logs:CreateLogGroup',
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            actions: [
                'logs:DescribeLogStreams',
                'logs:CreateLogGroup',
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            actions: [
                'logs:DescribeLogGroups',
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            actions: [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*`,
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            sid: "ECRTokenAccess",
            actions: [
                "ecr:GetAuthorizationToken"
            ],
            resources: [
                `*`,
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            sid: "XRayPermissions",
            actions: [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
                "xray:GetSamplingRules",
                "xray:GetSamplingTargets"
            ],
            resources: [
                `*`,
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            actions: [
                "cloudwatch:PutMetricData",
            ],
            resources: [
                `*`,
            ],
            conditions: {
                "StringEquals": {
                    "cloudwatch:namespace": "bedrock-agentcore"
                }
            }
        }));
        agentRole.addToPolicy(new PolicyStatement({
            sid: "GetAgentAccessToken",
            actions: [
                "bedrock-agentcore:GetWorkloadAccessToken",
                "bedrock-agentcore:GetWorkloadAccessTokenForJWT",
                "bedrock-agentcore:GetWorkloadAccessTokenForUserId"
            ],
            resources: [
                `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default`,
                `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/defaultworkload-identity/${this.agentName}-*`
            ],
        }));
        agentRole.addToPolicy(new PolicyStatement({
            // S3 permissions for data storage - Application specific

            sid: 'S3DataStorage',
            effect: Effect.ALLOW,
            actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
            ],
            resources: [
                config.s3Bucket.bucketArn,
                `${config.s3Bucket.bucketArn}/${config.s3Prefix}*`,
            ],
        }));
        // Add knowledge base permissions
        for (const kb of config.knowledgeBases) {
            agentRole.addToPolicy(new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    "aoss:APIAccessAll"
                ],
                resources: [
                    `arn:${this.partition}:aoss:${this.region}:${this.account}:collection/${(kb.vectorKb.vectorStore as VectorCollection).collectionName}`
                ]
            }));
            agentRole.addToPolicy(new PolicyStatement({
                sid: `KnowledgeBaseId-${kb.vectorKb.knowledgeBaseId}`,
                effect: Effect.ALLOW,
                actions: [
                    "bedrock:Retrieve",
                    "bedrock:RetrieveAndGenerate"
                ],
                resources: [
                    `${kb.vectorKb.knowledgeBaseArn}`
                ]
            }));
        }

        // Add any additional policy statements provided by the user
        for (const statement of config.additionalPolicyStatements) {
            agentRole.addToPolicy(statement);
        }

        return agentRole;
    }
}