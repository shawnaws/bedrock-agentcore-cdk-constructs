"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockAgentCoreRuntimeAgent = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const constructs_1 = require("constructs");
const cr = __importStar(require("aws-cdk-lib/custom-resources"));
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_ecr_assets_1 = require("aws-cdk-lib/aws-ecr-assets");
const validation_1 = require("../../common/validation");
const defaults_1 = require("../../common/defaults");
/**
 * Validator for Bedrock Agent Core Runtime Agent properties
 *
 * Validates all required and optional properties to ensure they meet
 * AWS service requirements and best practices.
 */
class BedrockAgentCoreRuntimeAgentPropsValidator extends validation_1.BaseValidator {
    /**
     * Validate the properties for BedrockAgentCoreRuntimeAgent
     *
     * @param props - The properties to validate
     * @returns ValidationResult with errors, warnings, and suggestions
     */
    validate(props) {
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
            const nameValidation = validation_1.ValidationUtils.validateAwsResourceName(props.agentName, 'agentName');
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
                this.addError('Agent instruction must be at least 10 characters long', 'Please provide a more detailed instruction for the agent');
            }
            if (props.instruction.length > 4000) {
                this.addError('Agent instruction must be 4000 characters or less', 'Please shorten the agent instruction to 4000 characters or less');
            }
        }
        // Validate project root path
        if (props.projectRoot) {
            const pathValidation = validation_1.ValidationUtils.validateDockerProjectRoot(props.projectRoot);
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
            const prefixValidation = validation_1.ValidationUtils.validateS3Prefix(props.s3Prefix);
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
            this.addError('Description must be 500 characters or less', 'Please shorten the description to 500 characters or less');
        }
        // Validate environment variables
        if (props.environmentVars) {
            for (const [key, value] of Object.entries(props.environmentVars)) {
                if (!key || key.trim() === '') {
                    this.addError('Environment variable keys cannot be empty', 'Please provide valid environment variable keys');
                }
                if (value === undefined || value === null) {
                    this.addWarning(`Environment variable '${key}' has undefined or null value`, `Consider providing a default value for environment variable '${key}'`);
                }
            }
        }
        return this.createResult();
    }
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
class BedrockAgentCoreRuntimeAgent extends constructs_1.Construct {
    /**
     * Create a new Bedrock Agent Core Runtime Agent
     *
     * @param scope - The scope in which to define this construct
     * @param id - The scoped construct ID. Must be unique amongst siblings in the same scope
     * @param props - Configuration properties for the agent
     *
     * @throws {ConstructError} When validation fails or required resources cannot be created
     */
    constructor(scope, id, props) {
        super(scope, id);
        /** AWS account ID */
        this.account = cdk.Stack.of(this).account;
        /** AWS region */
        this.region = cdk.Stack.of(this).region;
        /** AWS partition */
        this.partition = cdk.Stack.of(this).partition;
        try {
            // Validate input properties
            const validator = new BedrockAgentCoreRuntimeAgentPropsValidator();
            const validationResult = validator.validate(props);
            if (!validationResult.isValid) {
                validation_1.ValidationUtils.throwIfInvalid(validationResult, 'BedrockAgentCoreRuntimeAgent');
            }
            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                console.warn(`[BedrockAgentCoreRuntimeAgent] Validation warnings for agent '${props.agentName}':`, validationResult.warnings);
                if (validationResult.suggestions) {
                    console.warn(`[BedrockAgentCoreRuntimeAgent] Suggestions:`, validationResult.suggestions);
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to validate BedrockAgentCoreRuntimeAgent properties: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            // Apply defaults to configuration
            this.config = this.applyDefaults(props);
            const stackName = cdk.Stack.of(this).stackName;
            this.agentName = this.config.agentName;
            this.protocol = this.config.protocol || defaults_1.BEDROCK_AGENT_CORE_DEFAULTS.protocol;
            // Create resources with error handling
            this.agentRole = this.createAgentIamRole(this.config);
            const asset = this.buildImageAsset(this.config);
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
        }
        catch (error) {
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
    applyDefaults(props) {
        const baseDefaults = defaults_1.ConfigDefaults.applyBaseDefaults(props);
        const environment = baseDefaults.environment;
        const envDefaults = defaults_1.ConfigDefaults.getEnvironmentDefaults(environment);
        return {
            ...baseDefaults,
            agentName: props.agentName,
            instruction: props.instruction,
            projectRoot: props.projectRoot,
            s3Bucket: props.s3Bucket,
            s3Prefix: props.s3Prefix,
            knowledgeBases: props.knowledgeBases,
            protocol: (props.protocol || defaults_1.BEDROCK_AGENT_CORE_DEFAULTS.protocol),
            environmentVars: props.environmentVars || {},
            dockerPlatform: props.dockerPlatform || aws_ecr_assets_1.Platform.LINUX_ARM64,
            customResourceTimeoutMinutes: props.customResourceTimeoutMinutes || defaults_1.BEDROCK_AGENT_CORE_DEFAULTS.customResourceTimeout,
            additionalPolicyStatements: props.additionalPolicyStatements || [],
            logRetentionDays: props.logRetentionDays || envDefaults.monitoring.logRetentionDays,
            enableTracing: props.enableTracing !== undefined ? props.enableTracing : envDefaults.monitoring.enableTracing || false,
            description: props.description || `Bedrock Agent Core Runtime for ${props.agentName}`,
            networkMode: (props.networkMode || 'PUBLIC'),
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
    buildImageAsset(config) {
        // Build and push Docker image to ECR
        const dockerImageAsset = new aws_ecr_assets_1.DockerImageAsset(this, `${this.agentName}-ImageAsset`, {
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
    createAgentCoreRuntime(config, imageAsset, agentCorePolicy) {
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
        const environmentVariables = defaults_1.ConfigDefaults.getBedrockAgentCoreEnvironmentVariables(config.environmentVars, config.s3Bucket.bucketName, config.s3Prefix, this.region);
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
        return agentRuntime;
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
    getCustomResourcePolicy() {
        // Custom resource policy for Agent Core Runtime operations
        // This Lambda needs explicit permissions to manage Agent Core Runtime
        const agentCorePolicy = cr.AwsCustomResourcePolicy.fromStatements([
            new aws_iam_1.PolicyStatement({
                sid: 'AgentCoreRuntimeManagement',
                effect: aws_iam_1.Effect.ALLOW,
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
            new aws_iam_1.PolicyStatement({
                sid: 'AgentCorePassRole',
                effect: aws_iam_1.Effect.ALLOW,
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
            new aws_iam_1.PolicyStatement({
                sid: 'ECRValidateImages',
                effect: aws_iam_1.Effect.ALLOW,
                actions: [
                    'ecr:DescribeImages',
                    'ecr:DescribeRepositories',
                ],
                resources: [
                    `arn:${this.partition}:ecr:${this.region}:${this.account}:repository/*`,
                ],
            }),
        ]);
        return agentCorePolicy;
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
    createAgentIamRole(config) {
        const agentRole = new aws_iam_1.Role(this, 'AgentRole', {
            assumedBy: new aws_iam_1.ServicePrincipal('bedrock-agentcore.amazonaws.com', {
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
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
            sid: "BedrockPermissions",
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: [
                `*`,
            ],
        }));
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
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
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'logs:DescribeLogStreams',
                'logs:CreateLogGroup',
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
            ],
        }));
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'logs:DescribeLogStreams',
                'logs:CreateLogGroup',
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
            ],
        }));
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'logs:DescribeLogGroups',
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
            ],
        }));
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*`,
            ],
        }));
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
            sid: "ECRTokenAccess",
            actions: [
                "ecr:GetAuthorizationToken"
            ],
            resources: [
                `*`,
            ],
        }));
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
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
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
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
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
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
        agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
            // S3 permissions for data storage - Application specific
            sid: 'S3DataStorage',
            effect: aws_iam_1.Effect.ALLOW,
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
            agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
                effect: aws_iam_1.Effect.ALLOW,
                actions: [
                    "aoss:APIAccessAll"
                ],
                resources: [
                    `arn:${this.partition}:aoss:${this.region}:${this.account}:collection/${kb.vectorKb.vectorStore.collectionName}`
                ]
            }));
            agentRole.addToPolicy(new aws_iam_1.PolicyStatement({
                sid: `KnowledgeBaseId-${kb.vectorKb.knowledgeBaseId}`,
                effect: aws_iam_1.Effect.ALLOW,
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
exports.BedrockAgentCoreRuntimeAgent = BedrockAgentCoreRuntimeAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1hZ2VudGNvcmUtcnVudGltZS1hZ2VudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb25zdHJ1Y3RzL2JlZHJvY2stYWdlbnRjb3JlL2JlZHJvY2stYWdlbnRjb3JlLXJ1bnRpbWUtYWdlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsMkNBQXVDO0FBQ3ZDLGlFQUFtRDtBQUNuRCxpREFLNkI7QUFDN0IsK0RBQXdFO0FBUXhFLHdEQUF5RTtBQUN6RSxvREFBb0Y7QUFFcEY7Ozs7O0dBS0c7QUFDSCxNQUFNLDBDQUEyQyxTQUFRLDBCQUFnRDtJQUNyRzs7Ozs7T0FLRztJQUNILFFBQVEsQ0FBQyxLQUF3QztRQUM3QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYiwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUU5RCw2QkFBNkI7UUFDN0IsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbEIsTUFBTSxjQUFjLEdBQUcsNEJBQWUsQ0FBQyx1QkFBdUIsQ0FB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QUksTUFBTSxDQUFDLFFBQVEsR0FBRzthQUNyRDtTQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osaUNBQWlDO1FBQ2pDLEtBQUssTUFBTSxFQUFFLElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3JDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSx5QkFBZSxDQUFDO2dCQUN0QyxNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLO2dCQUNwQixPQUFPLEVBQUU7b0JBQ0wsbUJBQW1CO2lCQUN0QjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1AsT0FBTyxJQUFJLENBQUMsU0FBUyxTQUFTLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sZUFBZ0IsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFnQyxDQUFDLGNBQWMsRUFBRTtpQkFDekk7YUFDSixDQUFDLENBQUMsQ0FBQztZQUNKLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSx5QkFBZSxDQUFDO2dCQUN0QyxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFO2dCQUNyRCxNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLO2dCQUNwQixPQUFPLEVBQUU7b0JBQ0wsa0JBQWtCO29CQUNsQiw2QkFBNkI7aUJBQ2hDO2dCQUNELFNBQVMsRUFBRTtvQkFDUCxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUU7aUJBQ3BDO2FBQ0osQ0FBQyxDQUFDLENBQUM7UUFDUixDQUFDO1FBRUQsNERBQTREO1FBQzVELEtBQUssTUFBTSxTQUFTLElBQUksTUFBTSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDeEQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztDQUNKO0FBM2dCRCxvRUEyZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgY3IgZnJvbSAnYXdzLWNkay1saWIvY3VzdG9tLXJlc291cmNlcyc7XG5pbXBvcnQge1xuICAgIFJvbGUsXG4gICAgUG9saWN5U3RhdGVtZW50LFxuICAgIFNlcnZpY2VQcmluY2lwYWwsXG4gICAgRWZmZWN0XG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgRG9ja2VySW1hZ2VBc3NldCwgUGxhdGZvcm0gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyLWFzc2V0cyc7XG5pbXBvcnQgeyBCdWNrZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQmVkcm9ja0tub3dsZWRnZUJhc2UgfSBmcm9tICcuLi9iZWRyb2NrL2JlZHJvY2sta25vd2xlZGdlLWJhc2UnO1xuaW1wb3J0IHsgVmVjdG9yQ29sbGVjdGlvbiB9IGZyb20gJ0BjZGtsYWJzL2dlbmVyYXRpdmUtYWktY2RrLWNvbnN0cnVjdHMvbGliL2Nkay1saWIvb3BlbnNlYXJjaHNlcnZlcmxlc3MnO1xuaW1wb3J0IHtcbiAgICBCYXNlQ29uc3RydWN0UHJvcHMsXG4gICAgVmFsaWRhdGlvblJlc3VsdFxufSBmcm9tICcuLi8uLi9jb21tb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBCYXNlVmFsaWRhdG9yLCBWYWxpZGF0aW9uVXRpbHMgfSBmcm9tICcuLi8uLi9jb21tb24vdmFsaWRhdGlvbic7XG5pbXBvcnQgeyBDb25maWdEZWZhdWx0cywgQkVEUk9DS19BR0VOVF9DT1JFX0RFRkFVTFRTIH0gZnJvbSAnLi4vLi4vY29tbW9uL2RlZmF1bHRzJztcblxuLyoqXG4gKiBWYWxpZGF0b3IgZm9yIEJlZHJvY2sgQWdlbnQgQ29yZSBSdW50aW1lIEFnZW50IHByb3BlcnRpZXNcbiAqIFxuICogVmFsaWRhdGVzIGFsbCByZXF1aXJlZCBhbmQgb3B0aW9uYWwgcHJvcGVydGllcyB0byBlbnN1cmUgdGhleSBtZWV0XG4gKiBBV1Mgc2VydmljZSByZXF1aXJlbWVudHMgYW5kIGJlc3QgcHJhY3RpY2VzLlxuICovXG5jbGFzcyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHNWYWxpZGF0b3IgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcz4ge1xuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIHRoZSBwcm9wZXJ0aWVzIGZvciBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50XG4gICAgICogXG4gICAgICogQHBhcmFtIHByb3BzIC0gVGhlIHByb3BlcnRpZXMgdG8gdmFsaWRhdGVcbiAgICAgKiBAcmV0dXJucyBWYWxpZGF0aW9uUmVzdWx0IHdpdGggZXJyb3JzLCB3YXJuaW5ncywgYW5kIHN1Z2dlc3Rpb25zXG4gICAgICovXG4gICAgdmFsaWRhdGUocHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZmllbGRzXG4gICAgICAgIHRoaXMudmFsaWRhdGVSZXF1aXJlZChwcm9wcy5hZ2VudE5hbWUsICdhZ2VudE5hbWUnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLmluc3RydWN0aW9uLCAnaW5zdHJ1Y3Rpb24nKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLnByb2plY3RSb290LCAncHJvamVjdFJvb3QnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLnMzQnVja2V0LCAnczNCdWNrZXQnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLnMzUHJlZml4LCAnczNQcmVmaXgnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLmtub3dsZWRnZUJhc2VzLCAna25vd2xlZGdlQmFzZXMnKTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSBhZ2VudCBuYW1lIGZvcm1hdFxuICAgICAgICBpZiAocHJvcHMuYWdlbnROYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lVmFsaWRhdGlvbiA9IFZhbGlkYXRpb25VdGlscy52YWxpZGF0ZUF3c1Jlc291cmNlTmFtZShwcm9wcy5hZ2VudE5hbWUsICdhZ2VudE5hbWUnKTtcbiAgICAgICAgICAgIGlmICghbmFtZVZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goLi4ubmFtZVZhbGlkYXRpb24uZXJyb3JzKTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZVZhbGlkYXRpb24uc3VnZ2VzdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKC4uLm5hbWVWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBpbnN0cnVjdGlvbiBsZW5ndGggYW5kIGNvbnRlbnRcbiAgICAgICAgaWYgKHByb3BzLmluc3RydWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAocHJvcHMuaW5zdHJ1Y3Rpb24ubGVuZ3RoIDwgMTApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnQWdlbnQgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBhdCBsZWFzdCAxMCBjaGFyYWN0ZXJzIGxvbmcnLFxuICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIHByb3ZpZGUgYSBtb3JlIGRldGFpbGVkIGluc3RydWN0aW9uIGZvciB0aGUgYWdlbnQnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wcy5pbnN0cnVjdGlvbi5sZW5ndGggPiA0MDAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgJ0FnZW50IGluc3RydWN0aW9uIG11c3QgYmUgNDAwMCBjaGFyYWN0ZXJzIG9yIGxlc3MnLFxuICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIHNob3J0ZW4gdGhlIGFnZW50IGluc3RydWN0aW9uIHRvIDQwMDAgY2hhcmFjdGVycyBvciBsZXNzJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBwcm9qZWN0IHJvb3QgcGF0aFxuICAgICAgICBpZiAocHJvcHMucHJvamVjdFJvb3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhWYWxpZGF0aW9uID0gVmFsaWRhdGlvblV0aWxzLnZhbGlkYXRlRG9ja2VyUHJvamVjdFJvb3QocHJvcHMucHJvamVjdFJvb3QpO1xuICAgICAgICAgICAgaWYgKCFwYXRoVmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaCguLi5wYXRoVmFsaWRhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhdGhWYWxpZGF0aW9uLndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhcm5pbmdzLnB1c2goLi4ucGF0aFZhbGlkYXRpb24ud2FybmluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhdGhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKC4uLnBhdGhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIFMzIHByZWZpeFxuICAgICAgICBpZiAocHJvcHMuczNQcmVmaXgpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeFZhbGlkYXRpb24gPSBWYWxpZGF0aW9uVXRpbHMudmFsaWRhdGVTM1ByZWZpeChwcm9wcy5zM1ByZWZpeCk7XG4gICAgICAgICAgICBpZiAoIXByZWZpeFZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goLi4ucHJlZml4VmFsaWRhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByZWZpeFZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FybmluZ3MucHVzaCguLi5wcmVmaXhWYWxpZGF0aW9uLndhcm5pbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcmVmaXhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKC4uLnByZWZpeFZhbGlkYXRpb24uc3VnZ2VzdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUga25vd2xlZGdlIGJhc2VzIGFycmF5XG4gICAgICAgIGlmIChwcm9wcy5rbm93bGVkZ2VCYXNlcyAmJiAhdGhpcy52YWxpZGF0ZU5vbkVtcHR5QXJyYXkocHJvcHMua25vd2xlZGdlQmFzZXMsICdrbm93bGVkZ2VCYXNlcycpKSB7XG4gICAgICAgICAgICAvLyBFcnJvciBhbHJlYWR5IGFkZGVkIGJ5IHZhbGlkYXRlTm9uRW1wdHlBcnJheVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgcHJvdG9jb2wgaWYgcHJvdmlkZWRcbiAgICAgICAgaWYgKHByb3BzLnByb3RvY29sKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlRW51bShwcm9wcy5wcm90b2NvbCwgWydIVFRQJywgJ0hUVFBTJ10sICdwcm90b2NvbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgY3VzdG9tIHJlc291cmNlIHRpbWVvdXRcbiAgICAgICAgaWYgKHByb3BzLmN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZVJhbmdlKHByb3BzLmN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXMsIDEsIDYwLCAnY3VzdG9tUmVzb3VyY2VUaW1lb3V0TWludXRlcycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgbmV0d29yayBtb2RlIGlmIHByb3ZpZGVkXG4gICAgICAgIGlmIChwcm9wcy5uZXR3b3JrTW9kZSkge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZUVudW0ocHJvcHMubmV0d29ya01vZGUsIFsnUFVCTElDJywgJ1ZQQyddLCAnbmV0d29ya01vZGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIGRlc2NyaXB0aW9uIGxlbmd0aFxuICAgICAgICBpZiAocHJvcHMuZGVzY3JpcHRpb24gJiYgcHJvcHMuZGVzY3JpcHRpb24ubGVuZ3RoID4gNTAwKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICdEZXNjcmlwdGlvbiBtdXN0IGJlIDUwMCBjaGFyYWN0ZXJzIG9yIGxlc3MnLFxuICAgICAgICAgICAgICAgICdQbGVhc2Ugc2hvcnRlbiB0aGUgZGVzY3JpcHRpb24gdG8gNTAwIGNoYXJhY3RlcnMgb3IgbGVzcydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgICAgICAgaWYgKHByb3BzLmVudmlyb25tZW50VmFycykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMuZW52aXJvbm1lbnRWYXJzKSkge1xuICAgICAgICAgICAgICAgIGlmICgha2V5IHx8IGtleS50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAnRW52aXJvbm1lbnQgdmFyaWFibGUga2V5cyBjYW5ub3QgYmUgZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSBwcm92aWRlIHZhbGlkIGVudmlyb25tZW50IHZhcmlhYmxlIGtleXMnXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGBFbnZpcm9ubWVudCB2YXJpYWJsZSAnJHtrZXl9JyBoYXMgdW5kZWZpbmVkIG9yIG51bGwgdmFsdWVgLFxuICAgICAgICAgICAgICAgICAgICAgICAgYENvbnNpZGVyIHByb3ZpZGluZyBhIGRlZmF1bHQgdmFsdWUgZm9yIGVudmlyb25tZW50IHZhcmlhYmxlICcke2tleX0nYFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciB0aGUgQmVkcm9jayBBZ2VudCBDb3JlIFJ1bnRpbWUgQWdlbnQgY29uc3RydWN0XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzIGV4dGVuZHMgQmFzZUNvbnN0cnVjdFByb3BzIHtcbiAgICAvKiogXG4gICAgICogVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBhZ2VudFxuICAgICAqIE11c3QgYmUgYWxwaGFudW1lcmljIHdpdGggaHlwaGVucyBhbmQgdW5kZXJzY29yZXMgb25seVxuICAgICAqL1xuICAgIGFnZW50TmFtZTogc3RyaW5nO1xuXG4gICAgLyoqIFxuICAgICAqIEFnZW50IGluc3RydWN0aW9ucy9wcm9tcHQgdGhhdCBkZWZpbmVzIHRoZSBhZ2VudCdzIGJlaGF2aW9yXG4gICAgICogU2hvdWxkIGJlIGNsZWFyIGFuZCBzcGVjaWZpYyB0byBndWlkZSB0aGUgYWdlbnQncyByZXNwb25zZXNcbiAgICAgKi9cbiAgICBpbnN0cnVjdGlvbjogc3RyaW5nO1xuXG4gICAgLyoqIFxuICAgICAqIFBhdGggdG8gRG9ja2VyIGJ1aWxkIGNvbnRleHQgY29udGFpbmluZyBEb2NrZXJmaWxlLmFnZW50LWNvcmVcbiAgICAgKiBNdXN0IGJlIGEgdmFsaWQgZGlyZWN0b3J5IHBhdGggcmVsYXRpdmUgdG8gdGhlIENESyBhcHBcbiAgICAgKi9cbiAgICBwcm9qZWN0Um9vdDogc3RyaW5nO1xuXG4gICAgLyoqIFxuICAgICAqIFMzIGJ1Y2tldCBmb3IgZGF0YSBzdG9yYWdlXG4gICAgICogVGhlIGFnZW50IHdpbGwgaGF2ZSByZWFkL3dyaXRlIGFjY2VzcyB0byB0aGlzIGJ1Y2tldFxuICAgICAqL1xuICAgIHMzQnVja2V0OiBCdWNrZXQ7XG5cbiAgICAvKiogXG4gICAgICogUzMgcHJlZml4IGZvciBhZ2VudCBkYXRhIHdpdGhpbiB0aGUgYnVja2V0XG4gICAgICogU2hvdWxkIGVuZCB3aXRoICcvJyBmb3IgcHJvcGVyIG9yZ2FuaXphdGlvblxuICAgICAqL1xuICAgIHMzUHJlZml4OiBzdHJpbmc7XG5cbiAgICAvKiogXG4gICAgICogQXNzb2NpYXRlZCBrbm93bGVkZ2UgYmFzZXMgZm9yIHRoZSBhZ2VudFxuICAgICAqIFRoZSBhZ2VudCB3aWxsIGhhdmUgcmV0cmlldmFsIHBlcm1pc3Npb25zIGZvciB0aGVzZSBrbm93bGVkZ2UgYmFzZXNcbiAgICAgKi9cbiAgICBrbm93bGVkZ2VCYXNlczogQmVkcm9ja0tub3dsZWRnZUJhc2VbXTtcblxuICAgIC8qKiBcbiAgICAgKiBDb21tdW5pY2F0aW9uIHByb3RvY29sIGZvciB0aGUgYWdlbnQgcnVudGltZVxuICAgICAqIEBkZWZhdWx0ICdIVFRQJ1xuICAgICAqL1xuICAgIHByb3RvY29sPzogJ0hUVFAnIHwgJ0hUVFBTJztcblxuICAgIC8qKiBcbiAgICAgKiBBZGRpdGlvbmFsIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGhlIGFnZW50IHJ1bnRpbWVcbiAgICAgKiBUaGVzZSB3aWxsIGJlIG1lcmdlZCB3aXRoIGRlZmF1bHQgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgICovXG4gICAgZW52aXJvbm1lbnRWYXJzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcblxuICAgIC8qKlxuICAgICAqIERvY2tlciBwbGF0Zm9ybSBmb3IgdGhlIGNvbnRhaW5lciBpbWFnZVxuICAgICAqIEBkZWZhdWx0IFBsYXRmb3JtLkxJTlVYX0FSTTY0XG4gICAgICovXG4gICAgZG9ja2VyUGxhdGZvcm0/OiBQbGF0Zm9ybTtcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSByZXNvdXJjZSB0aW1lb3V0IGluIG1pbnV0ZXNcbiAgICAgKiBAZGVmYXVsdCAxMFxuICAgICAqL1xuICAgIGN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXM/OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBBZGRpdGlvbmFsIElBTSBwb2xpY3kgc3RhdGVtZW50cyB0byBhdHRhY2ggdG8gdGhlIGFnZW50IHJvbGVcbiAgICAgKiBVc2UgdGhpcyB0byBncmFudCBhZGRpdGlvbmFsIHBlcm1pc3Npb25zIGJleW9uZCB0aGUgZGVmYXVsdCBzZXRcbiAgICAgKi9cbiAgICBhZGRpdGlvbmFsUG9saWN5U3RhdGVtZW50cz86IFBvbGljeVN0YXRlbWVudFtdO1xuXG4gICAgLyoqXG4gICAgICogQ2xvdWRXYXRjaCBsb2cgcmV0ZW50aW9uIHBlcmlvZCBmb3IgdGhlIGFnZW50IHJ1bnRpbWVcbiAgICAgKiBAZGVmYXVsdCBCYXNlZCBvbiBlbnZpcm9ubWVudCAoZGV2OiAxIHdlZWssIHN0YWdpbmc6IDEgbW9udGgsIHByb2Q6IDYgbW9udGhzKVxuICAgICAqL1xuICAgIGxvZ1JldGVudGlvbkRheXM/OiBjZGsuYXdzX2xvZ3MuUmV0ZW50aW9uRGF5cztcblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBYLVJheSB0cmFjaW5nIGZvciB0aGUgYWdlbnQgcnVudGltZVxuICAgICAqIEBkZWZhdWx0IEJhc2VkIG9uIGVudmlyb25tZW50IChkZXY6IGZhbHNlLCBzdGFnaW5nL3Byb2Q6IHRydWUpXG4gICAgICovXG4gICAgZW5hYmxlVHJhY2luZz86IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZGVzY3JpcHRpb24gZm9yIHRoZSBhZ2VudCBydW50aW1lXG4gICAgICogQGRlZmF1bHQgXCJCZWRyb2NrIEFnZW50IENvcmUgUnVudGltZSBmb3Ige2FnZW50TmFtZX1cIlxuICAgICAqL1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogTmV0d29yayBtb2RlIGZvciB0aGUgYWdlbnQgcnVudGltZVxuICAgICAqIEBkZWZhdWx0ICdQVUJMSUMnXG4gICAgICovXG4gICAgbmV0d29ya01vZGU/OiAnUFVCTElDJyB8ICdWUEMnO1xuXG4gICAgLyoqXG4gICAgICogRG9ja2VyIGJ1aWxkIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBpbWFnZSBidWlsZFxuICAgICAqL1xuICAgIGRvY2tlckJ1aWxkQXJncz86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG5cbiAgICAvKipcbiAgICAgKiBGaWxlcyBhbmQgZGlyZWN0b3JpZXMgdG8gZXhjbHVkZSBmcm9tIHRoZSBEb2NrZXIgYnVpbGQgY29udGV4dFxuICAgICAqIEBkZWZhdWx0IFN0YW5kYXJkIGV4Y2x1c2lvbnMgKG5vZGVfbW9kdWxlcywgLmdpdCwgdGVzdCBmaWxlcywgZXRjLilcbiAgICAgKi9cbiAgICBkb2NrZXJFeGNsdWRlcz86IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIEJlZHJvY2sgQWdlbnQgQ29yZSBSdW50aW1lIEFnZW50IGNvbnN0cnVjdFxuICogXG4gKiBUaGlzIEwzIGNvbnN0cnVjdCBjcmVhdGVzIGEgcHJvZHVjdGlvbi1yZWFkeSBCZWRyb2NrIEFnZW50IENvcmUgUnVudGltZSB3aXRoOlxuICogLSBEb2NrZXIgY29udGFpbmVyIGRlcGxveW1lbnQgd2l0aCBjb25maWd1cmFibGUgcGxhdGZvcm0gc3VwcG9ydFxuICogLSBDb21wcmVoZW5zaXZlIElBTSByb2xlIHdpdGggbGVhc3QtcHJpdmlsZWdlIHBlcm1pc3Npb25zXG4gKiAtIFMzIGludGVncmF0aW9uIGZvciBwZXJzaXN0ZW50IGRhdGEgc3RvcmFnZVxuICogLSBLbm93bGVkZ2UgYmFzZSBjb25uZWN0aXZpdHkgZm9yIFJBRyBjYXBhYmlsaXRpZXNcbiAqIC0gQ3VzdG9tIHJlc291cmNlIGxpZmVjeWNsZSBtYW5hZ2VtZW50IHdpdGggcm9sbGJhY2sgcHJvdGVjdGlvblxuICogLSBFbnZpcm9ubWVudC1zcGVjaWZpYyBjb25maWd1cmF0aW9uIGRlZmF1bHRzXG4gKiAtIENvbXByZWhlbnNpdmUgaW5wdXQgdmFsaWRhdGlvbiBhbmQgZXJyb3IgaGFuZGxpbmdcbiAqIFxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGFnZW50ID0gbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQodGhpcywgJ015QWdlbnQnLCB7XG4gKiAgIGFnZW50TmFtZTogJ215LWhlbHBmdWwtYWdlbnQnLFxuICogICBpbnN0cnVjdGlvbjogJ1lvdSBhcmUgYSBoZWxwZnVsIGFzc2lzdGFudCB0aGF0IGNhbiBhbnN3ZXIgcXVlc3Rpb25zIHVzaW5nIHRoZSBwcm92aWRlZCBrbm93bGVkZ2UgYmFzZS4nLFxuICogICBwcm9qZWN0Um9vdDogJy4vYWdlbnQtY29kZScsXG4gKiAgIHMzQnVja2V0OiBteURhdGFCdWNrZXQsXG4gKiAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICogICBrbm93bGVkZ2VCYXNlczogW215S25vd2xlZGdlQmFzZV0sXG4gKiAgIGVudmlyb25tZW50OiAncHJvZCcsXG4gKiAgIHByb3RvY29sOiAnSFRUUFMnXG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudCBleHRlbmRzIENvbnN0cnVjdCB7XG4gICAgLyoqIFRoZSBhZ2VudCBuYW1lIHVzZWQgZm9yIHJlc291cmNlIGlkZW50aWZpY2F0aW9uICovXG4gICAgcHVibGljIHJlYWRvbmx5IGFnZW50TmFtZTogc3RyaW5nO1xuXG4gICAgLyoqIElBTSByb2xlIHVzZWQgYnkgdGhlIGFnZW50IHJ1bnRpbWUgKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IGFnZW50Um9sZTogUm9sZTtcblxuICAgIC8qKiBBUk4gb2YgdGhlIGNyZWF0ZWQgYWdlbnQgcnVudGltZSAqL1xuICAgIHB1YmxpYyByZWFkb25seSBhZ2VudFJ1bnRpbWVBcm46IHN0cmluZztcblxuICAgIC8qKiBBV1MgYWNjb3VudCBJRCAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYWNjb3VudCA9IGNkay5TdGFjay5vZih0aGlzKS5hY2NvdW50O1xuXG4gICAgLyoqIEFXUyByZWdpb24gKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lvbiA9IGNkay5TdGFjay5vZih0aGlzKS5yZWdpb247XG5cbiAgICAvKiogQVdTIHBhcnRpdGlvbiAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcGFydGl0aW9uID0gY2RrLlN0YWNrLm9mKHRoaXMpLnBhcnRpdGlvbjtcblxuICAgIC8qKiBDb21tdW5pY2F0aW9uIHByb3RvY29sICovXG4gICAgcHJpdmF0ZSByZWFkb25seSBwcm90b2NvbDogc3RyaW5nO1xuXG4gICAgLyoqIEFwcGxpZWQgY29uZmlndXJhdGlvbiB3aXRoIGRlZmF1bHRzICovXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb25maWc6IFJlcXVpcmVkPEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcz47XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQmVkcm9jayBBZ2VudCBDb3JlIFJ1bnRpbWUgQWdlbnRcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gc2NvcGUgLSBUaGUgc2NvcGUgaW4gd2hpY2ggdG8gZGVmaW5lIHRoaXMgY29uc3RydWN0XG4gICAgICogQHBhcmFtIGlkIC0gVGhlIHNjb3BlZCBjb25zdHJ1Y3QgSUQuIE11c3QgYmUgdW5pcXVlIGFtb25nc3Qgc2libGluZ3MgaW4gdGhlIHNhbWUgc2NvcGVcbiAgICAgKiBAcGFyYW0gcHJvcHMgLSBDb25maWd1cmF0aW9uIHByb3BlcnRpZXMgZm9yIHRoZSBhZ2VudFxuICAgICAqIFxuICAgICAqIEB0aHJvd3Mge0NvbnN0cnVjdEVycm9yfSBXaGVuIHZhbGlkYXRpb24gZmFpbHMgb3IgcmVxdWlyZWQgcmVzb3VyY2VzIGNhbm5vdCBiZSBjcmVhdGVkXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSBpbnB1dCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzVmFsaWRhdG9yKCk7XG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKHByb3BzKTtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZGF0aW9uUmVzdWx0LmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBWYWxpZGF0aW9uVXRpbHMudGhyb3dJZkludmFsaWQodmFsaWRhdGlvblJlc3VsdCwgJ0JlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9nIHdhcm5pbmdzIGlmIGFueVxuICAgICAgICAgICAgaWYgKHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0JlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRdIFZhbGlkYXRpb24gd2FybmluZ3MgZm9yIGFnZW50ICcke3Byb3BzLmFnZW50TmFtZX0nOmAsIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MpO1xuICAgICAgICAgICAgICAgIGlmICh2YWxpZGF0aW9uUmVzdWx0LnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0JlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRdIFN1Z2dlc3Rpb25zOmAsIHZhbGlkYXRpb25SZXN1bHQuc3VnZ2VzdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHZhbGlkYXRlIEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQgcHJvcGVydGllczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQXBwbHkgZGVmYXVsdHMgdG8gY29uZmlndXJhdGlvblxuICAgICAgICAgICAgdGhpcy5jb25maWcgPSB0aGlzLmFwcGx5RGVmYXVsdHMocHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCBzdGFja05hbWUgPSBjZGsuU3RhY2sub2YodGhpcykuc3RhY2tOYW1lO1xuICAgICAgICAgICAgdGhpcy5hZ2VudE5hbWUgPSB0aGlzLmNvbmZpZy5hZ2VudE5hbWU7XG4gICAgICAgICAgICB0aGlzLnByb3RvY29sID0gdGhpcy5jb25maWcucHJvdG9jb2wgfHwgQkVEUk9DS19BR0VOVF9DT1JFX0RFRkFVTFRTLnByb3RvY29sO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgcmVzb3VyY2VzIHdpdGggZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgIHRoaXMuYWdlbnRSb2xlID0gdGhpcy5jcmVhdGVBZ2VudElhbVJvbGUodGhpcy5jb25maWcpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB0aGlzLmJ1aWxkSW1hZ2VBc3NldCh0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBjclBvbGljeSA9IHRoaXMuZ2V0Q3VzdG9tUmVzb3VyY2VQb2xpY3koKTtcbiAgICAgICAgICAgIGNvbnN0IGFnZW50UnVudGltZSA9IHRoaXMuY3JlYXRlQWdlbnRDb3JlUnVudGltZSh0aGlzLmNvbmZpZywgYXNzZXQsIGNyUG9saWN5KTtcbiAgICAgICAgICAgIHRoaXMuYWdlbnRSdW50aW1lQXJuID0gYWdlbnRSdW50aW1lLmdldFJlc3BvbnNlRmllbGQoJ2FnZW50UnVudGltZUFybicpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgb3V0cHV0cyBmb3IgZWFzeSByZWZlcmVuY2VcbiAgICAgICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBZ2VudFJ1bnRpbWVBcm4nLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMuYWdlbnRSdW50aW1lQXJuLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQVJOIG9mIHRoZSBjcmVhdGVkIEFnZW50IENvcmUgUnVudGltZScsXG4gICAgICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7c3RhY2tOYW1lfS1BZ2VudFJ1bnRpbWVBcm5gLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBZ2VudFJ1bnRpbWVJZCcsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogYWdlbnRSdW50aW1lLmdldFJlc3BvbnNlRmllbGQoJ2FnZW50UnVudGltZUlkJyksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJRCBvZiB0aGUgY3JlYXRlZCBBZ2VudCBDb3JlIFJ1bnRpbWUnLFxuICAgICAgICAgICAgICAgIGV4cG9ydE5hbWU6IGAke3N0YWNrTmFtZX0tQWdlbnRSdW50aW1lSWRgLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTM0J1Y2tldE5hbWUnLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMuY29uZmlnLnMzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBTMyBidWNrZXQgZm9yIGRhdGEgc3RvcmFnZScsXG4gICAgICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7c3RhY2tOYW1lfS1TM0J1Y2tldGAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FnZW50Q29yZVJvbGVBcm4nLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMuYWdlbnRSb2xlLnJvbGVBcm4sXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIEFnZW50IENvcmUgUnVudGltZSBleGVjdXRpb24gcm9sZScsXG4gICAgICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7c3RhY2tOYW1lfS1Sb2xlQXJuYCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQgcmVzb3VyY2VzOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFwcGx5IGRlZmF1bHQgdmFsdWVzIHRvIHRoZSBjb25maWd1cmF0aW9uXG4gICAgICogXG4gICAgICogTWVyZ2VzIHVzZXItcHJvdmlkZWQgcHJvcGVydGllcyB3aXRoIGVudmlyb25tZW50LXNwZWNpZmljIGRlZmF1bHRzXG4gICAgICogYW5kIGNvbnN0cnVjdC1zcGVjaWZpYyBkZWZhdWx0cyB0byBjcmVhdGUgYSBjb21wbGV0ZSBjb25maWd1cmF0aW9uLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBwcm9wcyAtIFVzZXItcHJvdmlkZWQgcHJvcGVydGllc1xuICAgICAqIEByZXR1cm5zIENvbXBsZXRlIGNvbmZpZ3VyYXRpb24gd2l0aCBhbGwgZGVmYXVsdHMgYXBwbGllZFxuICAgICAqL1xuICAgIHByaXZhdGUgYXBwbHlEZWZhdWx0cyhwcm9wczogQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzKTogUmVxdWlyZWQ8QmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzPiB7XG4gICAgICAgIGNvbnN0IGJhc2VEZWZhdWx0cyA9IENvbmZpZ0RlZmF1bHRzLmFwcGx5QmFzZURlZmF1bHRzKHByb3BzKTtcblxuICAgICAgICBjb25zdCBlbnZpcm9ubWVudCA9IGJhc2VEZWZhdWx0cy5lbnZpcm9ubWVudDtcbiAgICAgICAgY29uc3QgZW52RGVmYXVsdHMgPSBDb25maWdEZWZhdWx0cy5nZXRFbnZpcm9ubWVudERlZmF1bHRzKGVudmlyb25tZW50KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uYmFzZURlZmF1bHRzLFxuICAgICAgICAgICAgYWdlbnROYW1lOiBwcm9wcy5hZ2VudE5hbWUsXG4gICAgICAgICAgICBpbnN0cnVjdGlvbjogcHJvcHMuaW5zdHJ1Y3Rpb24sXG4gICAgICAgICAgICBwcm9qZWN0Um9vdDogcHJvcHMucHJvamVjdFJvb3QsXG4gICAgICAgICAgICBzM0J1Y2tldDogcHJvcHMuczNCdWNrZXQsXG4gICAgICAgICAgICBzM1ByZWZpeDogcHJvcHMuczNQcmVmaXgsXG4gICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogcHJvcHMua25vd2xlZGdlQmFzZXMsXG4gICAgICAgICAgICBwcm90b2NvbDogKHByb3BzLnByb3RvY29sIHx8IEJFRFJPQ0tfQUdFTlRfQ09SRV9ERUZBVUxUUy5wcm90b2NvbCkgYXMgJ0hUVFAnIHwgJ0hUVFBTJyxcbiAgICAgICAgICAgIGVudmlyb25tZW50VmFyczogcHJvcHMuZW52aXJvbm1lbnRWYXJzIHx8IHt9LFxuICAgICAgICAgICAgZG9ja2VyUGxhdGZvcm06IHByb3BzLmRvY2tlclBsYXRmb3JtIHx8IFBsYXRmb3JtLkxJTlVYX0FSTTY0LFxuICAgICAgICAgICAgY3VzdG9tUmVzb3VyY2VUaW1lb3V0TWludXRlczogcHJvcHMuY3VzdG9tUmVzb3VyY2VUaW1lb3V0TWludXRlcyB8fCBCRURST0NLX0FHRU5UX0NPUkVfREVGQVVMVFMuY3VzdG9tUmVzb3VyY2VUaW1lb3V0LFxuICAgICAgICAgICAgYWRkaXRpb25hbFBvbGljeVN0YXRlbWVudHM6IHByb3BzLmFkZGl0aW9uYWxQb2xpY3lTdGF0ZW1lbnRzIHx8IFtdLFxuICAgICAgICAgICAgbG9nUmV0ZW50aW9uRGF5czogcHJvcHMubG9nUmV0ZW50aW9uRGF5cyB8fCBlbnZEZWZhdWx0cy5tb25pdG9yaW5nLmxvZ1JldGVudGlvbkRheXMgYXMgY2RrLmF3c19sb2dzLlJldGVudGlvbkRheXMsXG4gICAgICAgICAgICBlbmFibGVUcmFjaW5nOiBwcm9wcy5lbmFibGVUcmFjaW5nICE9PSB1bmRlZmluZWQgPyBwcm9wcy5lbmFibGVUcmFjaW5nIDogZW52RGVmYXVsdHMubW9uaXRvcmluZy5lbmFibGVUcmFjaW5nIHx8IGZhbHNlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IHByb3BzLmRlc2NyaXB0aW9uIHx8IGBCZWRyb2NrIEFnZW50IENvcmUgUnVudGltZSBmb3IgJHtwcm9wcy5hZ2VudE5hbWV9YCxcbiAgICAgICAgICAgIG5ldHdvcmtNb2RlOiAocHJvcHMubmV0d29ya01vZGUgfHwgJ1BVQkxJQycpIGFzICdQVUJMSUMnIHwgJ1ZQQycsXG4gICAgICAgICAgICBkb2NrZXJCdWlsZEFyZ3M6IHByb3BzLmRvY2tlckJ1aWxkQXJncyB8fCB7fSxcbiAgICAgICAgICAgIGRvY2tlckV4Y2x1ZGVzOiBwcm9wcy5kb2NrZXJFeGNsdWRlcyB8fCBbXG4gICAgICAgICAgICAgICAgJ25vZGVfbW9kdWxlcycsXG4gICAgICAgICAgICAgICAgJ2NvdmVyYWdlJyxcbiAgICAgICAgICAgICAgICAndGVzdConLFxuICAgICAgICAgICAgICAgICcqLnRlc3QudHMnLFxuICAgICAgICAgICAgICAgICcqLnNwZWMudHMnLFxuICAgICAgICAgICAgICAgICcuZ2l0JyxcbiAgICAgICAgICAgICAgICAnUkVBRE1FLm1kJyxcbiAgICAgICAgICAgICAgICAnaW5mcmFzdHJ1Y3R1cmUvJyxcbiAgICAgICAgICAgICAgICAnIWluZnJhc3RydWN0dXJlL2FwaS1nYXRld2F5LWxhbWJkYS9sYW1iZGEvcnVuLmpzJyxcbiAgICAgICAgICAgICAgICAndGVtcCcsXG4gICAgICAgICAgICAgICAgJ2V4YW1wbGUtY2xpZW50JyxcbiAgICAgICAgICAgICAgICAnbWVtb3J5LWJhbmsnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBEb2NrZXIgaW1hZ2UgYXNzZXQgd2l0aCBjb25maWd1cmFibGUgcGxhdGZvcm1cbiAgICAgKiBcbiAgICAgKiBDcmVhdGVzIGEgRG9ja2VyIGltYWdlIGFzc2V0IGZyb20gdGhlIHNwZWNpZmllZCBwcm9qZWN0IHJvb3QgZGlyZWN0b3J5LlxuICAgICAqIFRoZSBpbWFnZSBpcyBidWlsdCBhbmQgcHVzaGVkIHRvIEVDUiBhdXRvbWF0aWNhbGx5IGJ5IENESy5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gY29uZmlnIC0gQ29tcGxldGUgY29uZmlndXJhdGlvbiB3aXRoIGRlZmF1bHRzIGFwcGxpZWRcbiAgICAgKiBAcmV0dXJucyBEb2NrZXJJbWFnZUFzc2V0IHRoYXQgY2FuIGJlIHJlZmVyZW5jZWQgaW4gdGhlIGFnZW50IHJ1bnRpbWVcbiAgICAgKiBcbiAgICAgKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHByb2plY3Qgcm9vdCBkb2Vzbid0IGV4aXN0IG9yIERvY2tlcmZpbGUuYWdlbnQtY29yZSBpcyBtaXNzaW5nXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZEltYWdlQXNzZXQoY29uZmlnOiBSZXF1aXJlZDxCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHM+KSB7XG4gICAgICAgIC8vIEJ1aWxkIGFuZCBwdXNoIERvY2tlciBpbWFnZSB0byBFQ1JcbiAgICAgICAgY29uc3QgZG9ja2VySW1hZ2VBc3NldCA9IG5ldyBEb2NrZXJJbWFnZUFzc2V0KHRoaXMsIGAke3RoaXMuYWdlbnROYW1lfS1JbWFnZUFzc2V0YCwge1xuICAgICAgICAgICAgZGlyZWN0b3J5OiBjb25maWcucHJvamVjdFJvb3QsXG4gICAgICAgICAgICBmaWxlOiAnRG9ja2VyZmlsZS5hZ2VudC1jb3JlJyxcbiAgICAgICAgICAgIHBsYXRmb3JtOiBjb25maWcuZG9ja2VyUGxhdGZvcm0sXG4gICAgICAgICAgICBleGNsdWRlOiBjb25maWcuZG9ja2VyRXhjbHVkZXMsXG4gICAgICAgICAgICBidWlsZEFyZ3M6IGNvbmZpZy5kb2NrZXJCdWlsZEFyZ3MsXG4gICAgICAgICAgICAvLyBGb3JjZSByZWJ1aWxkIHdoZW4gY3JpdGljYWwgc291cmNlIGZpbGVzIGNoYW5nZVxuICAgICAgICAgICAgLy8gZXh0cmFIYXNoOiBmaW5hbEhhc2gsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZG9ja2VySW1hZ2VBc3NldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgdGhlIEFnZW50IENvcmUgUnVudGltZSB1c2luZyBBV1MgQ3VzdG9tIFJlc291cmNlXG4gICAgICogXG4gICAgICogQ3JlYXRlcyBhIEJlZHJvY2sgQWdlbnQgQ29yZSBSdW50aW1lIHdpdGggY29tcHJlaGVuc2l2ZSBjb25maWd1cmF0aW9uIGluY2x1ZGluZzpcbiAgICAgKiAtIENvbnRhaW5lciBjb25maWd1cmF0aW9uIHdpdGggRUNSIGltYWdlIFVSSVxuICAgICAqIC0gTmV0d29yayBjb25maWd1cmF0aW9uIGZvciBwdWJsaWMgYWNjZXNzXG4gICAgICogLSBQcm90b2NvbCBjb25maWd1cmF0aW9uIChIVFRQL0hUVFBTKVxuICAgICAqIC0gRW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciBNQ1AgYW5kIFMzIGludGVncmF0aW9uXG4gICAgICogLSBSb2xsYmFjayBwcm90ZWN0aW9uIGZvciBmYWlsZWQgZGVwbG95bWVudHNcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gY29uZmlnIC0gQ29tcGxldGUgY29uZmlndXJhdGlvbiB3aXRoIGRlZmF1bHRzIGFwcGxpZWRcbiAgICAgKiBAcGFyYW0gaW1hZ2VBc3NldCAtIERvY2tlciBpbWFnZSBhc3NldCBmb3IgdGhlIGFnZW50IGNvbnRhaW5lclxuICAgICAqIEBwYXJhbSBhZ2VudENvcmVQb2xpY3kgLSBJQU0gcG9saWN5IGZvciB0aGUgY3VzdG9tIHJlc291cmNlIExhbWJkYVxuICAgICAqIEByZXR1cm5zIEF3c0N1c3RvbVJlc291cmNlIGZvciBtYW5hZ2luZyB0aGUgYWdlbnQgcnVudGltZSBsaWZlY3ljbGVcbiAgICAgKiBcbiAgICAgKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIGFnZW50IHJ1bnRpbWUgY2Fubm90IGJlIGNyZWF0ZWQgb3IgY29uZmlndXJlZFxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlQWdlbnRDb3JlUnVudGltZShjb25maWc6IFJlcXVpcmVkPEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcz4sIGltYWdlQXNzZXQ6IERvY2tlckltYWdlQXNzZXQsIGFnZW50Q29yZVBvbGljeTogY3IuQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kpIHtcblxuICAgICAgICAvLyBTaGFyZWQgY29uZmlndXJhdGlvbiBmb3IgQWdlbnQgQ29yZSBSdW50aW1lIHBhcmFtZXRlcnNcbiAgICAgICAgY29uc3QgY29tbW9uRGVzY3JpcHRpb24gPSBjb25maWcuZGVzY3JpcHRpb247XG5cbiAgICAgICAgY29uc3QgY29tbW9uQWdlbnRSdW50aW1lQXJ0aWZhY3QgPSB7XG4gICAgICAgICAgICBjb250YWluZXJDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyVXJpOiBpbWFnZUFzc2V0LmltYWdlVXJpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBjb21tb25OZXR3b3JrQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgICAgICAgIG5ldHdvcmtNb2RlOiBjb25maWcubmV0d29ya01vZGUsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29tbW9uUHJvdG9jb2xDb25maWd1cmF0aW9uID0ge1xuICAgICAgICAgICAgc2VydmVyUHJvdG9jb2w6IHRoaXMucHJvdG9jb2wsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29tbW9uUm9sZUFybiA9IHRoaXMuYWdlbnRSb2xlLnJvbGVBcm47XG5cbiAgICAgICAgLy8gR2V0IGVudmlyb25tZW50IHZhcmlhYmxlcyB3aXRoIGRlZmF1bHRzIGFuZCB1c2VyIG92ZXJyaWRlc1xuICAgICAgICBjb25zdCBlbnZpcm9ubWVudFZhcmlhYmxlcyA9IENvbmZpZ0RlZmF1bHRzLmdldEJlZHJvY2tBZ2VudENvcmVFbnZpcm9ubWVudFZhcmlhYmxlcyhcbiAgICAgICAgICAgIGNvbmZpZy5lbnZpcm9ubWVudFZhcnMsXG4gICAgICAgICAgICBjb25maWcuczNCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgICAgIGNvbmZpZy5zM1ByZWZpeCxcbiAgICAgICAgICAgIHRoaXMucmVnaW9uXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIEFnZW50IENvcmUgUnVudGltZSB1c2luZyBBd3NDdXN0b21SZXNvdXJjZSB3aXRoIGVuaGFuY2VkIHJvbGxiYWNrIGhhbmRsaW5nXG4gICAgICAgIGNvbnN0IGFnZW50UnVudGltZSA9IG5ldyBjci5Bd3NDdXN0b21SZXNvdXJjZSh0aGlzLCAnQWdlbnRSdW50aW1lJywge1xuICAgICAgICAgICAgb25DcmVhdGU6IHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlOiAnYmVkcm9jay1hZ2VudGNvcmUtY29udHJvbCcsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnY3JlYXRlQWdlbnRSdW50aW1lJyxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFnZW50UnVudGltZU5hbWU6IGNvbmZpZy5hZ2VudE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBjb21tb25EZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgYWdlbnRSdW50aW1lQXJ0aWZhY3Q6IGNvbW1vbkFnZW50UnVudGltZUFydGlmYWN0LFxuICAgICAgICAgICAgICAgICAgICBuZXR3b3JrQ29uZmlndXJhdGlvbjogY29tbW9uTmV0d29ya0NvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sQ29uZmlndXJhdGlvbjogY29tbW9uUHJvdG9jb2xDb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICByb2xlQXJuOiBjb21tb25Sb2xlQXJuLFxuICAgICAgICAgICAgICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczogZW52aXJvbm1lbnRWYXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQ6IGNyLlBoeXNpY2FsUmVzb3VyY2VJZC5mcm9tUmVzcG9uc2UoJ2FnZW50UnVudGltZUlkJyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25VcGRhdGU6IHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlOiAnYmVkcm9jay1hZ2VudGNvcmUtY29udHJvbCcsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAndXBkYXRlQWdlbnRSdW50aW1lJyxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFnZW50UnVudGltZUlkOiBuZXcgY3IuUGh5c2ljYWxSZXNvdXJjZUlkUmVmZXJlbmNlKCksXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBjb21tb25EZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgcm9sZUFybjogY29tbW9uUm9sZUFybixcbiAgICAgICAgICAgICAgICAgICAgYWdlbnRSdW50aW1lQXJ0aWZhY3Q6IGNvbW1vbkFnZW50UnVudGltZUFydGlmYWN0LFxuICAgICAgICAgICAgICAgICAgICBuZXR3b3JrQ29uZmlndXJhdGlvbjogY29tbW9uTmV0d29ya0NvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sQ29uZmlndXJhdGlvbjogY29tbW9uUHJvdG9jb2xDb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczogZW52aXJvbm1lbnRWYXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQ6IGNyLlBoeXNpY2FsUmVzb3VyY2VJZC5mcm9tUmVzcG9uc2UoJ2FnZW50UnVudGltZUlkJyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25EZWxldGU6IHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlOiAnYmVkcm9jay1hZ2VudGNvcmUtY29udHJvbCcsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZGVsZXRlQWdlbnRSdW50aW1lJyxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFnZW50UnVudGltZUlkOiBuZXcgY3IuUGh5c2ljYWxSZXNvdXJjZUlkUmVmZXJlbmNlKCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBDb21wcmVoZW5zaXZlIGVycm9yIGhhbmRsaW5nIGZvciByb2xsYmFjayBzY2VuYXJpb3NcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIHJvbGxiYWNrIGZhaWx1cmVzIHdoZW4gQWdlbnQgQ29yZSBSdW50aW1lIGNyZWF0aW9uIGZhaWxzIG9yIHdoZW4gcmVzb3VyY2VzIGRvbid0IGV4aXN0XG4gICAgICAgICAgICAgICAgaWdub3JlRXJyb3JDb2Rlc01hdGNoaW5nOiAnVmFsaWRhdGlvbkV4Y2VwdGlvbnxJbnZhbGlkUGFyYW1ldGVyRXhjZXB0aW9ufFJlc291cmNlTm90Rm91bmRFeGNlcHRpb258QmFkUmVxdWVzdEV4Y2VwdGlvbnxDb25mbGljdEV4Y2VwdGlvbnxJbnRlcm5hbFNlcnZlckV4Y2VwdGlvbnwuKmFnZW50UnVudGltZUlkLip8Lipub3QuKmZvdW5kLip8Lipkb2VzLipub3QuKmV4aXN0LionLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvbGljeTogYWdlbnRDb3JlUG9saWN5LFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoY29uZmlnLmN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXMpLFxuICAgICAgICAgICAgaW5zdGFsbExhdGVzdEF3c1NkazogdHJ1ZSwgLy8gVXNlIHRoZSBsYXRlc3QgU0RLIHZlcnNpb24gaW4gdGhlIExhbWJkYSBydW50aW1lIGZvciBzdXBwb3J0IGFnZW50IGNvcmUgb3BlcmF0aW9uc1xuICAgICAgICAgICAgbG9nUmV0ZW50aW9uOiBjb25maWcubG9nUmV0ZW50aW9uRGF5cyxcbiAgICAgICAgICAgIHJlc291cmNlVHlwZTogJ0N1c3RvbTo6QWdlbnRDb3JlUnVudGltZScsIC8vIEZpeGVkIHR5cG9cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGFnZW50UnVudGltZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBJQU0gcG9saWN5IGZvciB0aGUgY3VzdG9tIHJlc291cmNlIExhbWJkYSBmdW5jdGlvblxuICAgICAqIFxuICAgICAqIENyZWF0ZXMgYW4gSUFNIHBvbGljeSB0aGF0IGdyYW50cyB0aGUgY3VzdG9tIHJlc291cmNlIExhbWJkYSBmdW5jdGlvblxuICAgICAqIHRoZSBuZWNlc3NhcnkgcGVybWlzc2lvbnMgdG8gbWFuYWdlIEJlZHJvY2sgQWdlbnQgQ29yZSBSdW50aW1lIHJlc291cmNlcyxcbiAgICAgKiBpbmNsdWRpbmcgY3JlYXRpb24sIHVwZGF0ZXMsIGRlbGV0aW9uLCBhbmQgd29ya2xvYWQgaWRlbnRpdHkgbWFuYWdlbWVudC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBBd3NDdXN0b21SZXNvdXJjZVBvbGljeSB3aXRoIGFsbCByZXF1aXJlZCBwZXJtaXNzaW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgZ2V0Q3VzdG9tUmVzb3VyY2VQb2xpY3koKSB7XG4gICAgICAgIC8vIEN1c3RvbSByZXNvdXJjZSBwb2xpY3kgZm9yIEFnZW50IENvcmUgUnVudGltZSBvcGVyYXRpb25zXG4gICAgICAgIC8vIFRoaXMgTGFtYmRhIG5lZWRzIGV4cGxpY2l0IHBlcm1pc3Npb25zIHRvIG1hbmFnZSBBZ2VudCBDb3JlIFJ1bnRpbWVcbiAgICAgICAgY29uc3QgYWdlbnRDb3JlUG9saWN5ID0gY3IuQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kuZnJvbVN0YXRlbWVudHMoW1xuICAgICAgICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgc2lkOiAnQWdlbnRDb3JlUnVudGltZU1hbmFnZW1lbnQnLFxuICAgICAgICAgICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOkNyZWF0ZUFnZW50UnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpDcmVhdGVBZ2VudFJ1bnRpbWVFbmRwb2ludCcsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpVcGRhdGVBZ2VudFJ1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6VXBkYXRlQWdlbnRSdW50aW1lRW5kcG9pbnQnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6RGVsZXRlQWdlbnRSdW50aW1lJyxcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOkRlbGV0ZUFnZW50UnVudGltZUVuZHBvaW50JyxcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOkdldEFnZW50UnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpHZXRBZ2VudFJ1bnRpbWVFbmRwb2ludCcsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpEZXNjcmliZUFnZW50UnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpMaXN0QWdlbnRSdW50aW1lcycsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpMaXN0QWdlbnRSdW50aW1lRW5kcG9pbnRzJyxcbiAgICAgICAgICAgICAgICAgICAgLy8gV29ya2xvYWQgSWRlbnRpdHkgbWFuYWdlbWVudCAtIFJlcXVpcmVkIGZvciBBZ2VudCBDb3JlIFJ1bnRpbWUgY3JlYXRpb25cbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOkNyZWF0ZVdvcmtsb2FkSWRlbnRpdHknLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6RGVsZXRlV29ya2xvYWRJZGVudGl0eScsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpHZXRXb3JrbG9hZElkZW50aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOlVwZGF0ZVdvcmtsb2FkSWRlbnRpdHknLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6TGlzdFdvcmtsb2FkSWRlbnRpdGllcycsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3RoaXMucGFydGl0aW9ufTpiZWRyb2NrLWFnZW50Y29yZToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06KmAsXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHt0aGlzLnBhcnRpdGlvbn06YmVkcm9jay1hZ2VudGNvcmU6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OnJ1bnRpbWUvKmAsXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHt0aGlzLnBhcnRpdGlvbn06YmVkcm9jay1hZ2VudGNvcmU6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9Ondvcmtsb2FkLWlkZW50aXR5LWRpcmVjdG9yeS8qYCxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAvLyBJQU0gcGFzcyByb2xlIHBlcm1pc3Npb25zIGZvciB0aGUgQWdlbnQgQ29yZSBleGVjdXRpb24gcm9sZVxuICAgICAgICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgc2lkOiAnQWdlbnRDb3JlUGFzc1JvbGUnLFxuICAgICAgICAgICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ2lhbTpQYXNzUm9sZScsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFt0aGlzLmFnZW50Um9sZS5yb2xlQXJuXSxcbiAgICAgICAgICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2lhbTpQYXNzZWRUb1NlcnZpY2UnOiAnYmVkcm9jay1hZ2VudGNvcmUuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgLy8gRUNSIHBlcm1pc3Npb25zIHRvIHZhbGlkYXRlIGNvbnRhaW5lciBpbWFnZXNcbiAgICAgICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIHNpZDogJ0VDUlZhbGlkYXRlSW1hZ2VzJyxcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICdlY3I6RGVzY3JpYmVJbWFnZXMnLFxuICAgICAgICAgICAgICAgICAgICAnZWNyOkRlc2NyaWJlUmVwb3NpdG9yaWVzJyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7dGhpcy5wYXJ0aXRpb259OmVjcjoke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06cmVwb3NpdG9yeS8qYCxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gYWdlbnRDb3JlUG9saWN5XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIElBTSByb2xlIGZvciB0aGUgQWdlbnQgQ29yZSBSdW50aW1lIHdpdGggbGVhc3QtcHJpdmlsZWdlIHBlcm1pc3Npb25zXG4gICAgICogXG4gICAgICogQ3JlYXRlcyBhbiBJQU0gcm9sZSB0aGF0IHRoZSBBZ2VudCBDb3JlIFJ1bnRpbWUgYXNzdW1lcyB0byBhY2Nlc3MgQVdTIHNlcnZpY2VzLlxuICAgICAqIFRoZSByb2xlIGluY2x1ZGVzIHBlcm1pc3Npb25zIGZvcjpcbiAgICAgKiAtIEJlZHJvY2sgbW9kZWwgaW52b2NhdGlvblxuICAgICAqIC0gRUNSIGltYWdlIGFjY2VzcyBmb3IgY29udGFpbmVyIGRlcGxveW1lbnRcbiAgICAgKiAtIENsb3VkV2F0Y2ggbG9nZ2luZyBhbmQgWC1SYXkgdHJhY2luZ1xuICAgICAqIC0gUzMgYWNjZXNzIGZvciBkYXRhIHN0b3JhZ2UgKHNjb3BlZCB0byBzcGVjaWZpYyBidWNrZXQvcHJlZml4KVxuICAgICAqIC0gS25vd2xlZGdlIGJhc2UgcmV0cmlldmFsIHBlcm1pc3Npb25zXG4gICAgICogLSBPcGVuU2VhcmNoIFNlcnZlcmxlc3MgYWNjZXNzIGZvciB2ZWN0b3Igb3BlcmF0aW9uc1xuICAgICAqIC0gV29ya2xvYWQgaWRlbnRpdHkgdG9rZW4gbWFuYWdlbWVudFxuICAgICAqIFxuICAgICAqIEBwYXJhbSBjb25maWcgLSBDb21wbGV0ZSBjb25maWd1cmF0aW9uIHdpdGggZGVmYXVsdHMgYXBwbGllZFxuICAgICAqIEByZXR1cm5zIElBTSBSb2xlIHRoYXQgdGhlIGFnZW50IHJ1bnRpbWUgd2lsbCBhc3N1bWVcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZUFnZW50SWFtUm9sZShjb25maWc6IFJlcXVpcmVkPEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcz4pIHtcbiAgICAgICAgY29uc3QgYWdlbnRSb2xlID0gbmV3IFJvbGUodGhpcywgJ0FnZW50Um9sZScsIHtcbiAgICAgICAgICAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2JlZHJvY2stYWdlbnRjb3JlLmFtYXpvbmF3cy5jb20nLCB7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAnU3RyaW5nRXF1YWxzJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2F3czpTb3VyY2VBY2NvdW50JzogdGhpcy5hY2NvdW50XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICdBcm5MaWtlJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2F3czpTb3VyY2VBcm4nOiBgYXJuOmF3czpiZWRyb2NrLWFnZW50Y29yZToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06KmBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgc2lkOiBcIkJlZHJvY2tQZXJtaXNzaW9uc1wiLFxuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbFdpdGhSZXNwb25zZVN0cmVhbScsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYCpgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBzaWQ6IFwiRUNSSW1hZ2VBY2Nlc3NcIixcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBcImVjcjpCYXRjaEdldEltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJlY3I6R2V0RG93bmxvYWRVcmxGb3JMYXllclwiLFxuICAgICAgICAgICAgICAgIFwiZWNyOkdldEF1dGhvcml6YXRpb25Ub2tlblwiLFxuICAgICAgICAgICAgICAgIFwiZWNyOkJhdGNoR2V0SW1hZ2VcIixcbiAgICAgICAgICAgICAgICBcImVjcjpHZXREb3dubG9hZFVybEZvckxheWVyXCIsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYGFybjphd3M6ZWNyOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpyZXBvc2l0b3J5LypgXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG4gICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnbG9nczpEZXNjcmliZUxvZ1N0cmVhbXMnLFxuICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBgYXJuOmF3czpsb2dzOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpsb2ctZ3JvdXA6L2F3cy9iZWRyb2NrLWFnZW50Y29yZS9ydW50aW1lcy8qYCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdsb2dzOkRlc2NyaWJlTG9nU3RyZWFtcycsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGBhcm46YXdzOmxvZ3M6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OmxvZy1ncm91cDovYXdzL2JlZHJvY2stYWdlbnRjb3JlL3J1bnRpbWVzLypgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dHcm91cHMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGBhcm46YXdzOmxvZ3M6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OmxvZy1ncm91cDoqYCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dTdHJlYW1cIixcbiAgICAgICAgICAgICAgICBcImxvZ3M6UHV0TG9nRXZlbnRzXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBgYXJuOmF3czpsb2dzOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpsb2ctZ3JvdXA6L2F3cy9iZWRyb2NrLWFnZW50Y29yZS9ydW50aW1lcy8qOmxvZy1zdHJlYW06KmAsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG4gICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIHNpZDogXCJFQ1JUb2tlbkFjY2Vzc1wiLFxuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgIFwiZWNyOkdldEF1dGhvcml6YXRpb25Ub2tlblwiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYCpgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBzaWQ6IFwiWFJheVBlcm1pc3Npb25zXCIsXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgXCJ4cmF5OlB1dFRyYWNlU2VnbWVudHNcIixcbiAgICAgICAgICAgICAgICBcInhyYXk6UHV0VGVsZW1ldHJ5UmVjb3Jkc1wiLFxuICAgICAgICAgICAgICAgIFwieHJheTpHZXRTYW1wbGluZ1J1bGVzXCIsXG4gICAgICAgICAgICAgICAgXCJ4cmF5OkdldFNhbXBsaW5nVGFyZ2V0c1wiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYCpgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgXCJjbG91ZHdhdGNoOlB1dE1ldHJpY0RhdGFcIixcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBgKmAsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgICAgIFwiU3RyaW5nRXF1YWxzXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJjbG91ZHdhdGNoOm5hbWVzcGFjZVwiOiBcImJlZHJvY2stYWdlbnRjb3JlXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgc2lkOiBcIkdldEFnZW50QWNjZXNzVG9rZW5cIixcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBcImJlZHJvY2stYWdlbnRjb3JlOkdldFdvcmtsb2FkQWNjZXNzVG9rZW5cIixcbiAgICAgICAgICAgICAgICBcImJlZHJvY2stYWdlbnRjb3JlOkdldFdvcmtsb2FkQWNjZXNzVG9rZW5Gb3JKV1RcIixcbiAgICAgICAgICAgICAgICBcImJlZHJvY2stYWdlbnRjb3JlOkdldFdvcmtsb2FkQWNjZXNzVG9rZW5Gb3JVc2VySWRcIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGBhcm46YXdzOmJlZHJvY2stYWdlbnRjb3JlOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTp3b3JrbG9hZC1pZGVudGl0eS1kaXJlY3RvcnkvZGVmYXVsdGAsXG4gICAgICAgICAgICAgICAgYGFybjphd3M6YmVkcm9jay1hZ2VudGNvcmU6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9Ondvcmtsb2FkLWlkZW50aXR5LWRpcmVjdG9yeS9kZWZhdWx0d29ya2xvYWQtaWRlbnRpdHkvJHt0aGlzLmFnZW50TmFtZX0tKmBcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgLy8gUzMgcGVybWlzc2lvbnMgZm9yIGRhdGEgc3RvcmFnZSAtIEFwcGxpY2F0aW9uIHNwZWNpZmljXG5cbiAgICAgICAgICAgIHNpZDogJ1MzRGF0YVN0b3JhZ2UnLFxuICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgJ3MzOkdldE9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ3MzOkxpc3RCdWNrZXQnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGNvbmZpZy5zM0J1Y2tldC5idWNrZXRBcm4sXG4gICAgICAgICAgICAgICAgYCR7Y29uZmlnLnMzQnVja2V0LmJ1Y2tldEFybn0vJHtjb25maWcuczNQcmVmaXh9KmAsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG4gICAgICAgIC8vIEFkZCBrbm93bGVkZ2UgYmFzZSBwZXJtaXNzaW9uc1xuICAgICAgICBmb3IgKGNvbnN0IGtiIG9mIGNvbmZpZy5rbm93bGVkZ2VCYXNlcykge1xuICAgICAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJhb3NzOkFQSUFjY2Vzc0FsbFwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3RoaXMucGFydGl0aW9ufTphb3NzOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpjb2xsZWN0aW9uLyR7KGtiLnZlY3RvcktiLnZlY3RvclN0b3JlIGFzIFZlY3RvckNvbGxlY3Rpb24pLmNvbGxlY3Rpb25OYW1lfWBcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgc2lkOiBgS25vd2xlZGdlQmFzZUlkLSR7a2IudmVjdG9yS2Iua25vd2xlZGdlQmFzZUlkfWAsXG4gICAgICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICBcImJlZHJvY2s6UmV0cmlldmVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJiZWRyb2NrOlJldHJpZXZlQW5kR2VuZXJhdGVcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgIGAke2tiLnZlY3RvcktiLmtub3dsZWRnZUJhc2VBcm59YFxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgYWRkaXRpb25hbCBwb2xpY3kgc3RhdGVtZW50cyBwcm92aWRlZCBieSB0aGUgdXNlclxuICAgICAgICBmb3IgKGNvbnN0IHN0YXRlbWVudCBvZiBjb25maWcuYWRkaXRpb25hbFBvbGljeVN0YXRlbWVudHMpIHtcbiAgICAgICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShzdGF0ZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFnZW50Um9sZTtcbiAgICB9XG59Il19