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
        this.validateRequired(props.s3Bucket, 's3Bucket');
        this.validateRequired(props.s3Prefix, 's3Prefix');
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
        if (props.tarballImageFile) {
            const pathValidation = validation_1.ValidationUtils.validateTarballImageFilePath(props.tarballImageFile);
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
        // Validate knowledge bases array if provided
        // Empty array is allowed since knowledgeBases is now optional
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
 * // With knowledge bases
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
 *
 * // Without knowledge bases
 * const simpleAgent = new BedrockAgentCoreRuntimeAgent(this, 'SimpleAgent', {
 *   agentName: 'simple-agent',
 *   instruction: 'You are a helpful assistant.',
 *   projectRoot: './agent-code',
 *   s3Bucket: myDataBucket,
 *   s3Prefix: 'agent-data/',
 *   environment: 'prod'
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
            let asset;
            if (this.config.projectRoot !== "" && this.config.tarballImageFile === "") {
                asset = this.buildImageAsset(this.config);
            }
            else if (this.config.tarballImageFile !== "" && this.config.projectRoot === "") {
                asset = this.buildTarballAsset(this.config);
            }
            else {
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
            projectRoot: props.projectRoot || "",
            tarballImageFile: props.tarballImageFile || "",
            s3Bucket: props.s3Bucket,
            s3Prefix: props.s3Prefix,
            knowledgeBases: props.knowledgeBases || [],
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
    buildTarballAsset(config) {
        const tarballImageAsset = new aws_ecr_assets_1.TarballImageAsset(this, `${this.agentName}-TarballAsset`, {
            tarballFile: config.tarballImageFile,
        });
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
        // Add knowledge base permissions if provided
        if (config.knowledgeBases && config.knowledgeBases.length > 0) {
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
                    sid: `KB${kb.vectorKb.knowledgeBaseId}`,
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
        }
        // Add any additional policy statements provided by the user
        for (const statement of config.additionalPolicyStatements) {
            agentRole.addToPolicy(statement);
        }
        return agentRole;
    }
}
exports.BedrockAgentCoreRuntimeAgent = BedrockAgentCoreRuntimeAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1hZ2VudGNvcmUtcnVudGltZS1hZ2VudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb25zdHJ1Y3RzL2JlZHJvY2stYWdlbnRjb3JlL2JlZHJvY2stYWdlbnRjb3JlLXJ1bnRpbWUtYWdlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsMkNBQXVDO0FBQ3ZDLGlFQUFtRDtBQUNuRCxpREFLNkI7QUFDN0IsK0RBQTJGO0FBUTNGLHdEQUF5RTtBQUN6RSxvREFBb0Y7QUFFcEY7Ozs7O0dBS0c7QUFDSCxNQUFNLDBDQUEyQyxTQUFRLDBCQUFnRDtJQUNyRzs7Ozs7T0FLRztJQUNILFFBQVEsQ0FBQyxLQUF3QztRQUM3QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYiwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFbEQsNkJBQTZCO1FBQzdCLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sY0FBYyxHQUFHLDRCQUFlLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM3RixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLGNBQWMsQ0FB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bXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBjciBmcm9tICdhd3MtY2RrLWxpYi9jdXN0b20tcmVzb3VyY2VzJztcbmltcG9ydCB7XG4gICAgUm9sZSxcbiAgICBQb2xpY3lTdGF0ZW1lbnQsXG4gICAgU2VydmljZVByaW5jaXBhbCxcbiAgICBFZmZlY3Rcbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBEb2NrZXJJbWFnZUFzc2V0LCBQbGF0Zm9ybSwgVGFyYmFsbEltYWdlQXNzZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyLWFzc2V0cyc7XG5pbXBvcnQgeyBCdWNrZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQmVkcm9ja0tub3dsZWRnZUJhc2UgfSBmcm9tICcuLi9iZWRyb2NrL2JlZHJvY2sta25vd2xlZGdlLWJhc2UnO1xuaW1wb3J0IHsgVmVjdG9yQ29sbGVjdGlvbiB9IGZyb20gJ0BjZGtsYWJzL2dlbmVyYXRpdmUtYWktY2RrLWNvbnN0cnVjdHMvbGliL2Nkay1saWIvb3BlbnNlYXJjaHNlcnZlcmxlc3MnO1xuaW1wb3J0IHtcbiAgICBCYXNlQ29uc3RydWN0UHJvcHMsXG4gICAgVmFsaWRhdGlvblJlc3VsdFxufSBmcm9tICcuLi8uLi9jb21tb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBCYXNlVmFsaWRhdG9yLCBWYWxpZGF0aW9uVXRpbHMgfSBmcm9tICcuLi8uLi9jb21tb24vdmFsaWRhdGlvbic7XG5pbXBvcnQgeyBDb25maWdEZWZhdWx0cywgQkVEUk9DS19BR0VOVF9DT1JFX0RFRkFVTFRTIH0gZnJvbSAnLi4vLi4vY29tbW9uL2RlZmF1bHRzJztcblxuLyoqXG4gKiBWYWxpZGF0b3IgZm9yIEJlZHJvY2sgQWdlbnQgQ29yZSBSdW50aW1lIEFnZW50IHByb3BlcnRpZXNcbiAqIFxuICogVmFsaWRhdGVzIGFsbCByZXF1aXJlZCBhbmQgb3B0aW9uYWwgcHJvcGVydGllcyB0byBlbnN1cmUgdGhleSBtZWV0XG4gKiBBV1Mgc2VydmljZSByZXF1aXJlbWVudHMgYW5kIGJlc3QgcHJhY3RpY2VzLlxuICovXG5jbGFzcyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHNWYWxpZGF0b3IgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcz4ge1xuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIHRoZSBwcm9wZXJ0aWVzIGZvciBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50XG4gICAgICogXG4gICAgICogQHBhcmFtIHByb3BzIC0gVGhlIHByb3BlcnRpZXMgdG8gdmFsaWRhdGVcbiAgICAgKiBAcmV0dXJucyBWYWxpZGF0aW9uUmVzdWx0IHdpdGggZXJyb3JzLCB3YXJuaW5ncywgYW5kIHN1Z2dlc3Rpb25zXG4gICAgICovXG4gICAgdmFsaWRhdGUocHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcyk6IFZhbGlkYXRpb25SZXN1bHQge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZmllbGRzXG4gICAgICAgIHRoaXMudmFsaWRhdGVSZXF1aXJlZChwcm9wcy5hZ2VudE5hbWUsICdhZ2VudE5hbWUnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLmluc3RydWN0aW9uLCAnaW5zdHJ1Y3Rpb24nKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLnMzQnVja2V0LCAnczNCdWNrZXQnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLnMzUHJlZml4LCAnczNQcmVmaXgnKTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSBhZ2VudCBuYW1lIGZvcm1hdFxuICAgICAgICBpZiAocHJvcHMuYWdlbnROYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lVmFsaWRhdGlvbiA9IFZhbGlkYXRpb25VdGlscy52YWxpZGF0ZUF3c1Jlc291cmNlTmFtZShwcm9wcy5hZ2VudE5hbWUsICdhZ2VudE5hbWUnKTtcbiAgICAgICAgICAgIGlmICghbmFtZVZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goLi4ubmFtZVZhbGlkYXRpb24uZXJyb3JzKTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZVZhbGlkYXRpb24uc3VnZ2VzdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKC4uLm5hbWVWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBpbnN0cnVjdGlvbiBsZW5ndGggYW5kIGNvbnRlbnRcbiAgICAgICAgaWYgKHByb3BzLmluc3RydWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAocHJvcHMuaW5zdHJ1Y3Rpb24ubGVuZ3RoIDwgMTApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnQWdlbnQgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBhdCBsZWFzdCAxMCBjaGFyYWN0ZXJzIGxvbmcnLFxuICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIHByb3ZpZGUgYSBtb3JlIGRldGFpbGVkIGluc3RydWN0aW9uIGZvciB0aGUgYWdlbnQnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wcy5pbnN0cnVjdGlvbi5sZW5ndGggPiA0MDAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgJ0FnZW50IGluc3RydWN0aW9uIG11c3QgYmUgNDAwMCBjaGFyYWN0ZXJzIG9yIGxlc3MnLFxuICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIHNob3J0ZW4gdGhlIGFnZW50IGluc3RydWN0aW9uIHRvIDQwMDAgY2hhcmFjdGVycyBvciBsZXNzJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBwcm9qZWN0IHJvb3QgcGF0aFxuICAgICAgICBpZiAocHJvcHMucHJvamVjdFJvb3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhWYWxpZGF0aW9uID0gVmFsaWRhdGlvblV0aWxzLnZhbGlkYXRlRG9ja2VyUHJvamVjdFJvb3QocHJvcHMucHJvamVjdFJvb3QpO1xuICAgICAgICAgICAgaWYgKCFwYXRoVmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaCguLi5wYXRoVmFsaWRhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhdGhWYWxpZGF0aW9uLndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhcm5pbmdzLnB1c2goLi4ucGF0aFZhbGlkYXRpb24ud2FybmluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhdGhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKC4uLnBhdGhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9wcy50YXJiYWxsSW1hZ2VGaWxlKSB7XG4gICAgICAgICAgICBjb25zdCBwYXRoVmFsaWRhdGlvbiA9IFZhbGlkYXRpb25VdGlscy52YWxpZGF0ZVRhcmJhbGxJbWFnZUZpbGVQYXRoKHByb3BzLnRhcmJhbGxJbWFnZUZpbGUpO1xuICAgICAgICAgICAgaWYgKCFwYXRoVmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaCguLi5wYXRoVmFsaWRhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhdGhWYWxpZGF0aW9uLndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhcm5pbmdzLnB1c2goLi4ucGF0aFZhbGlkYXRpb24ud2FybmluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhdGhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKC4uLnBhdGhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIFMzIHByZWZpeFxuICAgICAgICBpZiAocHJvcHMuczNQcmVmaXgpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeFZhbGlkYXRpb24gPSBWYWxpZGF0aW9uVXRpbHMudmFsaWRhdGVTM1ByZWZpeChwcm9wcy5zM1ByZWZpeCk7XG4gICAgICAgICAgICBpZiAoIXByZWZpeFZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goLi4ucHJlZml4VmFsaWRhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByZWZpeFZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FybmluZ3MucHVzaCguLi5wcmVmaXhWYWxpZGF0aW9uLndhcm5pbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcmVmaXhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5wdXNoKC4uLnByZWZpeFZhbGlkYXRpb24uc3VnZ2VzdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUga25vd2xlZGdlIGJhc2VzIGFycmF5IGlmIHByb3ZpZGVkXG4gICAgICAgIC8vIEVtcHR5IGFycmF5IGlzIGFsbG93ZWQgc2luY2Uga25vd2xlZGdlQmFzZXMgaXMgbm93IG9wdGlvbmFsXG5cbiAgICAgICAgLy8gVmFsaWRhdGUgcHJvdG9jb2wgaWYgcHJvdmlkZWRcbiAgICAgICAgaWYgKHByb3BzLnByb3RvY29sKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlRW51bShwcm9wcy5wcm90b2NvbCwgWydIVFRQJywgJ0hUVFBTJ10sICdwcm90b2NvbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgY3VzdG9tIHJlc291cmNlIHRpbWVvdXRcbiAgICAgICAgaWYgKHByb3BzLmN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZVJhbmdlKHByb3BzLmN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXMsIDEsIDYwLCAnY3VzdG9tUmVzb3VyY2VUaW1lb3V0TWludXRlcycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgbmV0d29yayBtb2RlIGlmIHByb3ZpZGVkXG4gICAgICAgIGlmIChwcm9wcy5uZXR3b3JrTW9kZSkge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZUVudW0ocHJvcHMubmV0d29ya01vZGUsIFsnUFVCTElDJywgJ1ZQQyddLCAnbmV0d29ya01vZGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIGRlc2NyaXB0aW9uIGxlbmd0aFxuICAgICAgICBpZiAocHJvcHMuZGVzY3JpcHRpb24gJiYgcHJvcHMuZGVzY3JpcHRpb24ubGVuZ3RoID4gNTAwKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICdEZXNjcmlwdGlvbiBtdXN0IGJlIDUwMCBjaGFyYWN0ZXJzIG9yIGxlc3MnLFxuICAgICAgICAgICAgICAgICdQbGVhc2Ugc2hvcnRlbiB0aGUgZGVzY3JpcHRpb24gdG8gNTAwIGNoYXJhY3RlcnMgb3IgbGVzcydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgICAgICAgaWYgKHByb3BzLmVudmlyb25tZW50VmFycykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMuZW52aXJvbm1lbnRWYXJzKSkge1xuICAgICAgICAgICAgICAgIGlmICgha2V5IHx8IGtleS50cmltKCkgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAnRW52aXJvbm1lbnQgdmFyaWFibGUga2V5cyBjYW5ub3QgYmUgZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSBwcm92aWRlIHZhbGlkIGVudmlyb25tZW50IHZhcmlhYmxlIGtleXMnXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGBFbnZpcm9ubWVudCB2YXJpYWJsZSAnJHtrZXl9JyBoYXMgdW5kZWZpbmVkIG9yIG51bGwgdmFsdWVgLFxuICAgICAgICAgICAgICAgICAgICAgICAgYENvbnNpZGVyIHByb3ZpZGluZyBhIGRlZmF1bHQgdmFsdWUgZm9yIGVudmlyb25tZW50IHZhcmlhYmxlICcke2tleX0nYFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciB0aGUgQmVkcm9jayBBZ2VudCBDb3JlIFJ1bnRpbWUgQWdlbnQgY29uc3RydWN0XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzIGV4dGVuZHMgQmFzZUNvbnN0cnVjdFByb3BzIHtcbiAgICAvKiogXG4gICAgICogVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBhZ2VudFxuICAgICAqIE11c3QgYmUgYWxwaGFudW1lcmljIHdpdGggaHlwaGVucyBhbmQgdW5kZXJzY29yZXMgb25seVxuICAgICAqL1xuICAgIGFnZW50TmFtZTogc3RyaW5nO1xuXG4gICAgLyoqIFxuICAgICAqIEFnZW50IGluc3RydWN0aW9ucy9wcm9tcHQgdGhhdCBkZWZpbmVzIHRoZSBhZ2VudCdzIGJlaGF2aW9yXG4gICAgICogU2hvdWxkIGJlIGNsZWFyIGFuZCBzcGVjaWZpYyB0byBndWlkZSB0aGUgYWdlbnQncyByZXNwb25zZXNcbiAgICAgKi9cbiAgICBpbnN0cnVjdGlvbjogc3RyaW5nO1xuXG4gICAgLyoqIFxuICAgICAqIFBhdGggdG8gRG9ja2VyIGJ1aWxkIGNvbnRleHQgY29udGFpbmluZyBEb2NrZXJmaWxlLmFnZW50LWNvcmVcbiAgICAgKiBNdXN0IGJlIGEgdmFsaWQgZGlyZWN0b3J5IHBhdGggcmVsYXRpdmUgdG8gdGhlIENESyBhcHBcbiAgICAgKi9cbiAgICBwcm9qZWN0Um9vdD86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRhcmJhbGwgaW1hZ2UgLSBleGNsdXNpdmUgdXNlIGZvciBpbnN0ZWFkIG9mIHByb2plY3RSb290LiBcbiAgICAgKi9cbiAgICB0YXJiYWxsSW1hZ2VGaWxlPzogc3RyaW5nO1xuXG4gICAgLyoqIFxuICAgICAqIFMzIGJ1Y2tldCBmb3IgZGF0YSBzdG9yYWdlXG4gICAgICogVGhlIGFnZW50IHdpbGwgaGF2ZSByZWFkL3dyaXRlIGFjY2VzcyB0byB0aGlzIGJ1Y2tldFxuICAgICAqL1xuICAgIHMzQnVja2V0OiBCdWNrZXQ7XG5cbiAgICAvKiogXG4gICAgICogUzMgcHJlZml4IGZvciBhZ2VudCBkYXRhIHdpdGhpbiB0aGUgYnVja2V0XG4gICAgICogU2hvdWxkIGVuZCB3aXRoICcvJyBmb3IgcHJvcGVyIG9yZ2FuaXphdGlvblxuICAgICAqL1xuICAgIHMzUHJlZml4OiBzdHJpbmc7XG5cbiAgICAvKiogXG4gICAgICogQXNzb2NpYXRlZCBrbm93bGVkZ2UgYmFzZXMgZm9yIHRoZSBhZ2VudFxuICAgICAqIFRoZSBhZ2VudCB3aWxsIGhhdmUgcmV0cmlldmFsIHBlcm1pc3Npb25zIGZvciB0aGVzZSBrbm93bGVkZ2UgYmFzZXNcbiAgICAgKiBAZGVmYXVsdCBbXVxuICAgICAqL1xuICAgIGtub3dsZWRnZUJhc2VzPzogQmVkcm9ja0tub3dsZWRnZUJhc2VbXTtcblxuICAgIC8qKiBcbiAgICAgKiBDb21tdW5pY2F0aW9uIHByb3RvY29sIGZvciB0aGUgYWdlbnQgcnVudGltZVxuICAgICAqIEBkZWZhdWx0ICdIVFRQJ1xuICAgICAqL1xuICAgIHByb3RvY29sPzogJ0hUVFAnIHwgJ0hUVFBTJztcblxuICAgIC8qKiBcbiAgICAgKiBBZGRpdGlvbmFsIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGhlIGFnZW50IHJ1bnRpbWVcbiAgICAgKiBUaGVzZSB3aWxsIGJlIG1lcmdlZCB3aXRoIGRlZmF1bHQgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgICovXG4gICAgZW52aXJvbm1lbnRWYXJzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcblxuICAgIC8qKlxuICAgICAqIERvY2tlciBwbGF0Zm9ybSBmb3IgdGhlIGNvbnRhaW5lciBpbWFnZVxuICAgICAqIEBkZWZhdWx0IFBsYXRmb3JtLkxJTlVYX0FSTTY0XG4gICAgICovXG4gICAgZG9ja2VyUGxhdGZvcm0/OiBQbGF0Zm9ybTtcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSByZXNvdXJjZSB0aW1lb3V0IGluIG1pbnV0ZXNcbiAgICAgKiBAZGVmYXVsdCAxMFxuICAgICAqL1xuICAgIGN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXM/OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBBZGRpdGlvbmFsIElBTSBwb2xpY3kgc3RhdGVtZW50cyB0byBhdHRhY2ggdG8gdGhlIGFnZW50IHJvbGVcbiAgICAgKiBVc2UgdGhpcyB0byBncmFudCBhZGRpdGlvbmFsIHBlcm1pc3Npb25zIGJleW9uZCB0aGUgZGVmYXVsdCBzZXRcbiAgICAgKi9cbiAgICBhZGRpdGlvbmFsUG9saWN5U3RhdGVtZW50cz86IFBvbGljeVN0YXRlbWVudFtdO1xuXG4gICAgLyoqXG4gICAgICogQ2xvdWRXYXRjaCBsb2cgcmV0ZW50aW9uIHBlcmlvZCBmb3IgdGhlIGFnZW50IHJ1bnRpbWVcbiAgICAgKiBAZGVmYXVsdCBCYXNlZCBvbiBlbnZpcm9ubWVudCAoZGV2OiAxIHdlZWssIHN0YWdpbmc6IDEgbW9udGgsIHByb2Q6IDYgbW9udGhzKVxuICAgICAqL1xuICAgIGxvZ1JldGVudGlvbkRheXM/OiBjZGsuYXdzX2xvZ3MuUmV0ZW50aW9uRGF5cztcblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBYLVJheSB0cmFjaW5nIGZvciB0aGUgYWdlbnQgcnVudGltZVxuICAgICAqIEBkZWZhdWx0IEJhc2VkIG9uIGVudmlyb25tZW50IChkZXY6IGZhbHNlLCBzdGFnaW5nL3Byb2Q6IHRydWUpXG4gICAgICovXG4gICAgZW5hYmxlVHJhY2luZz86IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZGVzY3JpcHRpb24gZm9yIHRoZSBhZ2VudCBydW50aW1lXG4gICAgICogQGRlZmF1bHQgXCJCZWRyb2NrIEFnZW50IENvcmUgUnVudGltZSBmb3Ige2FnZW50TmFtZX1cIlxuICAgICAqL1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogTmV0d29yayBtb2RlIGZvciB0aGUgYWdlbnQgcnVudGltZVxuICAgICAqIEBkZWZhdWx0ICdQVUJMSUMnXG4gICAgICovXG4gICAgbmV0d29ya01vZGU/OiAnUFVCTElDJyB8ICdWUEMnO1xuXG4gICAgLyoqXG4gICAgICogRG9ja2VyIGJ1aWxkIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBpbWFnZSBidWlsZFxuICAgICAqL1xuICAgIGRvY2tlckJ1aWxkQXJncz86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG5cbiAgICAvKipcbiAgICAgKiBGaWxlcyBhbmQgZGlyZWN0b3JpZXMgdG8gZXhjbHVkZSBmcm9tIHRoZSBEb2NrZXIgYnVpbGQgY29udGV4dFxuICAgICAqIEBkZWZhdWx0IFN0YW5kYXJkIGV4Y2x1c2lvbnMgKG5vZGVfbW9kdWxlcywgLmdpdCwgdGVzdCBmaWxlcywgZXRjLilcbiAgICAgKi9cbiAgICBkb2NrZXJFeGNsdWRlcz86IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIEJlZHJvY2sgQWdlbnQgQ29yZSBSdW50aW1lIEFnZW50IGNvbnN0cnVjdFxuICogXG4gKiBUaGlzIEwzIGNvbnN0cnVjdCBjcmVhdGVzIGEgcHJvZHVjdGlvbi1yZWFkeSBCZWRyb2NrIEFnZW50IENvcmUgUnVudGltZSB3aXRoOlxuICogLSBEb2NrZXIgY29udGFpbmVyIGRlcGxveW1lbnQgd2l0aCBjb25maWd1cmFibGUgcGxhdGZvcm0gc3VwcG9ydFxuICogLSBDb21wcmVoZW5zaXZlIElBTSByb2xlIHdpdGggbGVhc3QtcHJpdmlsZWdlIHBlcm1pc3Npb25zXG4gKiAtIFMzIGludGVncmF0aW9uIGZvciBwZXJzaXN0ZW50IGRhdGEgc3RvcmFnZVxuICogLSBLbm93bGVkZ2UgYmFzZSBjb25uZWN0aXZpdHkgZm9yIFJBRyBjYXBhYmlsaXRpZXNcbiAqIC0gQ3VzdG9tIHJlc291cmNlIGxpZmVjeWNsZSBtYW5hZ2VtZW50IHdpdGggcm9sbGJhY2sgcHJvdGVjdGlvblxuICogLSBFbnZpcm9ubWVudC1zcGVjaWZpYyBjb25maWd1cmF0aW9uIGRlZmF1bHRzXG4gKiAtIENvbXByZWhlbnNpdmUgaW5wdXQgdmFsaWRhdGlvbiBhbmQgZXJyb3IgaGFuZGxpbmdcbiAqIFxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIFdpdGgga25vd2xlZGdlIGJhc2VzXG4gKiBjb25zdCBhZ2VudCA9IG5ldyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50KHRoaXMsICdNeUFnZW50Jywge1xuICogICBhZ2VudE5hbWU6ICdteS1oZWxwZnVsLWFnZW50JyxcbiAqICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCBhc3Npc3RhbnQgdGhhdCBjYW4gYW5zd2VyIHF1ZXN0aW9ucyB1c2luZyB0aGUgcHJvdmlkZWQga25vd2xlZGdlIGJhc2UuJyxcbiAqICAgcHJvamVjdFJvb3Q6ICcuL2FnZW50LWNvZGUnLFxuICogICBzM0J1Y2tldDogbXlEYXRhQnVja2V0LFxuICogICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAqICAga25vd2xlZGdlQmFzZXM6IFtteUtub3dsZWRnZUJhc2VdLFxuICogICBlbnZpcm9ubWVudDogJ3Byb2QnLFxuICogICBwcm90b2NvbDogJ0hUVFBTJ1xuICogfSk7XG4gKiBcbiAqIC8vIFdpdGhvdXQga25vd2xlZGdlIGJhc2VzXG4gKiBjb25zdCBzaW1wbGVBZ2VudCA9IG5ldyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50KHRoaXMsICdTaW1wbGVBZ2VudCcsIHtcbiAqICAgYWdlbnROYW1lOiAnc2ltcGxlLWFnZW50JyxcbiAqICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCBhc3Npc3RhbnQuJyxcbiAqICAgcHJvamVjdFJvb3Q6ICcuL2FnZW50LWNvZGUnLFxuICogICBzM0J1Y2tldDogbXlEYXRhQnVja2V0LFxuICogICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAqICAgZW52aXJvbm1lbnQ6ICdwcm9kJ1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAgIC8qKiBUaGUgYWdlbnQgbmFtZSB1c2VkIGZvciByZXNvdXJjZSBpZGVudGlmaWNhdGlvbiAqL1xuICAgIHB1YmxpYyByZWFkb25seSBhZ2VudE5hbWU6IHN0cmluZztcblxuICAgIC8qKiBJQU0gcm9sZSB1c2VkIGJ5IHRoZSBhZ2VudCBydW50aW1lICovXG4gICAgcHJpdmF0ZSByZWFkb25seSBhZ2VudFJvbGU6IFJvbGU7XG5cbiAgICAvKiogQVJOIG9mIHRoZSBjcmVhdGVkIGFnZW50IHJ1bnRpbWUgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgYWdlbnRSdW50aW1lQXJuOiBzdHJpbmc7XG5cbiAgICAvKiogQVdTIGFjY291bnQgSUQgKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IGFjY291bnQgPSBjZGsuU3RhY2sub2YodGhpcykuYWNjb3VudDtcblxuICAgIC8qKiBBV1MgcmVnaW9uICovXG4gICAgcHJpdmF0ZSByZWFkb25seSByZWdpb24gPSBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uO1xuXG4gICAgLyoqIEFXUyBwYXJ0aXRpb24gKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IHBhcnRpdGlvbiA9IGNkay5TdGFjay5vZih0aGlzKS5wYXJ0aXRpb247XG5cbiAgICAvKiogQ29tbXVuaWNhdGlvbiBwcm90b2NvbCAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcHJvdG9jb2w6IHN0cmluZztcblxuICAgIC8qKiBBcHBsaWVkIGNvbmZpZ3VyYXRpb24gd2l0aCBkZWZhdWx0cyAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnOiBSZXF1aXJlZDxCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHM+O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEJlZHJvY2sgQWdlbnQgQ29yZSBSdW50aW1lIEFnZW50XG4gICAgICogXG4gICAgICogQHBhcmFtIHNjb3BlIC0gVGhlIHNjb3BlIGluIHdoaWNoIHRvIGRlZmluZSB0aGlzIGNvbnN0cnVjdFxuICAgICAqIEBwYXJhbSBpZCAtIFRoZSBzY29wZWQgY29uc3RydWN0IElELiBNdXN0IGJlIHVuaXF1ZSBhbW9uZ3N0IHNpYmxpbmdzIGluIHRoZSBzYW1lIHNjb3BlXG4gICAgICogQHBhcmFtIHByb3BzIC0gQ29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGUgYWdlbnRcbiAgICAgKiBcbiAgICAgKiBAdGhyb3dzIHtDb25zdHJ1Y3RFcnJvcn0gV2hlbiB2YWxpZGF0aW9uIGZhaWxzIG9yIHJlcXVpcmVkIHJlc291cmNlcyBjYW5ub3QgYmUgY3JlYXRlZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gVmFsaWRhdGUgaW5wdXQgcHJvcGVydGllc1xuICAgICAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wc1ZhbGlkYXRvcigpO1xuICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZShwcm9wcyk7XG5cbiAgICAgICAgICAgIGlmICghdmFsaWRhdGlvblJlc3VsdC5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgVmFsaWRhdGlvblV0aWxzLnRocm93SWZJbnZhbGlkKHZhbGlkYXRpb25SZXN1bHQsICdCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIExvZyB3YXJuaW5ncyBpZiBhbnlcbiAgICAgICAgICAgIGlmICh2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50XSBWYWxpZGF0aW9uIHdhcm5pbmdzIGZvciBhZ2VudCAnJHtwcm9wcy5hZ2VudE5hbWV9JzpgLCB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGlvblJlc3VsdC5zdWdnZXN0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50XSBTdWdnZXN0aW9uczpgLCB2YWxpZGF0aW9uUmVzdWx0LnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byB2YWxpZGF0ZSBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50IHByb3BlcnRpZXM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEFwcGx5IGRlZmF1bHRzIHRvIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIHRoaXMuY29uZmlnID0gdGhpcy5hcHBseURlZmF1bHRzKHByb3BzKTtcblxuICAgICAgICAgICAgY29uc3Qgc3RhY2tOYW1lID0gY2RrLlN0YWNrLm9mKHRoaXMpLnN0YWNrTmFtZTtcbiAgICAgICAgICAgIHRoaXMuYWdlbnROYW1lID0gdGhpcy5jb25maWcuYWdlbnROYW1lO1xuICAgICAgICAgICAgdGhpcy5wcm90b2NvbCA9IHRoaXMuY29uZmlnLnByb3RvY29sIHx8IEJFRFJPQ0tfQUdFTlRfQ09SRV9ERUZBVUxUUy5wcm90b2NvbDtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIHJlc291cmNlcyB3aXRoIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICB0aGlzLmFnZW50Um9sZSA9IHRoaXMuY3JlYXRlQWdlbnRJYW1Sb2xlKHRoaXMuY29uZmlnKTtcbiAgICAgICAgICAgIGxldCBhc3NldDtcbiAgICAgICAgICAgIGlmICggdGhpcy5jb25maWcucHJvamVjdFJvb3QgIT09IFwiXCIgJiYgdGhpcy5jb25maWcudGFyYmFsbEltYWdlRmlsZSA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgIGFzc2V0ID0gdGhpcy5idWlsZEltYWdlQXNzZXQodGhpcy5jb25maWcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggdGhpcy5jb25maWcudGFyYmFsbEltYWdlRmlsZSAhPT0gXCJcIiAmJiB0aGlzLmNvbmZpZy5wcm9qZWN0Um9vdCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgIGFzc2V0ID0gdGhpcy5idWlsZFRhcmJhbGxBc3NldCh0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50IHJlc291cmNlczogRXhhY3RseSAxIG9mIHByb2plY3RSb290IG9yIHRhcmJhbGxJbWFnZUZpbGUgbXVzdCBiZSBzZXQuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IGNyUG9saWN5ID0gdGhpcy5nZXRDdXN0b21SZXNvdXJjZVBvbGljeSgpO1xuICAgICAgICAgICAgY29uc3QgYWdlbnRSdW50aW1lID0gdGhpcy5jcmVhdGVBZ2VudENvcmVSdW50aW1lKHRoaXMuY29uZmlnLCBhc3NldCwgY3JQb2xpY3kpO1xuICAgICAgICAgICAgdGhpcy5hZ2VudFJ1bnRpbWVBcm4gPSBhZ2VudFJ1bnRpbWUuZ2V0UmVzcG9uc2VGaWVsZCgnYWdlbnRSdW50aW1lQXJuJyk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBvdXRwdXRzIGZvciBlYXN5IHJlZmVyZW5jZVxuICAgICAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FnZW50UnVudGltZUFybicsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5hZ2VudFJ1bnRpbWVBcm4sXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIGNyZWF0ZWQgQWdlbnQgQ29yZSBSdW50aW1lJyxcbiAgICAgICAgICAgICAgICBleHBvcnROYW1lOiBgJHtzdGFja05hbWV9LUFnZW50UnVudGltZUFybmAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FnZW50UnVudGltZUlkJywge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBhZ2VudFJ1bnRpbWUuZ2V0UmVzcG9uc2VGaWVsZCgnYWdlbnRSdW50aW1lSWQnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0lEIG9mIHRoZSBjcmVhdGVkIEFnZW50IENvcmUgUnVudGltZScsXG4gICAgICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7c3RhY2tOYW1lfS1BZ2VudFJ1bnRpbWVJZGAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1MzQnVja2V0TmFtZScsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5jb25maWcuczNCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIFMzIGJ1Y2tldCBmb3IgZGF0YSBzdG9yYWdlJyxcbiAgICAgICAgICAgICAgICBleHBvcnROYW1lOiBgJHtzdGFja05hbWV9LVMzQnVja2V0YCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQWdlbnRDb3JlUm9sZUFybicsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5hZ2VudFJvbGUucm9sZUFybixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgQWdlbnQgQ29yZSBSdW50aW1lIGV4ZWN1dGlvbiByb2xlJyxcbiAgICAgICAgICAgICAgICBleHBvcnROYW1lOiBgJHtzdGFja05hbWV9LVJvbGVBcm5gLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudCByZXNvdXJjZXM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXBwbHkgZGVmYXVsdCB2YWx1ZXMgdG8gdGhlIGNvbmZpZ3VyYXRpb25cbiAgICAgKiBcbiAgICAgKiBNZXJnZXMgdXNlci1wcm92aWRlZCBwcm9wZXJ0aWVzIHdpdGggZW52aXJvbm1lbnQtc3BlY2lmaWMgZGVmYXVsdHNcbiAgICAgKiBhbmQgY29uc3RydWN0LXNwZWNpZmljIGRlZmF1bHRzIHRvIGNyZWF0ZSBhIGNvbXBsZXRlIGNvbmZpZ3VyYXRpb24uXG4gICAgICogXG4gICAgICogQHBhcmFtIHByb3BzIC0gVXNlci1wcm92aWRlZCBwcm9wZXJ0aWVzXG4gICAgICogQHJldHVybnMgQ29tcGxldGUgY29uZmlndXJhdGlvbiB3aXRoIGFsbCBkZWZhdWx0cyBhcHBsaWVkXG4gICAgICovXG4gICAgcHJpdmF0ZSBhcHBseURlZmF1bHRzKHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMpOiBSZXF1aXJlZDxCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHM+IHtcbiAgICAgICAgY29uc3QgYmFzZURlZmF1bHRzID0gQ29uZmlnRGVmYXVsdHMuYXBwbHlCYXNlRGVmYXVsdHMocHJvcHMpO1xuXG4gICAgICAgIGNvbnN0IGVudmlyb25tZW50ID0gYmFzZURlZmF1bHRzLmVudmlyb25tZW50O1xuICAgICAgICBjb25zdCBlbnZEZWZhdWx0cyA9IENvbmZpZ0RlZmF1bHRzLmdldEVudmlyb25tZW50RGVmYXVsdHMoZW52aXJvbm1lbnQpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5iYXNlRGVmYXVsdHMsXG4gICAgICAgICAgICBhZ2VudE5hbWU6IHByb3BzLmFnZW50TmFtZSxcbiAgICAgICAgICAgIGluc3RydWN0aW9uOiBwcm9wcy5pbnN0cnVjdGlvbixcbiAgICAgICAgICAgIHByb2plY3RSb290OiBwcm9wcy5wcm9qZWN0Um9vdCB8fCBcIlwiLFxuICAgICAgICAgICAgdGFyYmFsbEltYWdlRmlsZTogcHJvcHMudGFyYmFsbEltYWdlRmlsZSB8fCBcIlwiLFxuICAgICAgICAgICAgczNCdWNrZXQ6IHByb3BzLnMzQnVja2V0LFxuICAgICAgICAgICAgczNQcmVmaXg6IHByb3BzLnMzUHJlZml4LFxuICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IHByb3BzLmtub3dsZWRnZUJhc2VzIHx8IFtdLFxuICAgICAgICAgICAgcHJvdG9jb2w6IChwcm9wcy5wcm90b2NvbCB8fCBCRURST0NLX0FHRU5UX0NPUkVfREVGQVVMVFMucHJvdG9jb2wpIGFzICdIVFRQJyB8ICdIVFRQUycsXG4gICAgICAgICAgICBlbnZpcm9ubWVudFZhcnM6IHByb3BzLmVudmlyb25tZW50VmFycyB8fCB7fSxcbiAgICAgICAgICAgIGRvY2tlclBsYXRmb3JtOiBwcm9wcy5kb2NrZXJQbGF0Zm9ybSB8fCBQbGF0Zm9ybS5MSU5VWF9BUk02NCxcbiAgICAgICAgICAgIGN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXM6IHByb3BzLmN1c3RvbVJlc291cmNlVGltZW91dE1pbnV0ZXMgfHwgQkVEUk9DS19BR0VOVF9DT1JFX0RFRkFVTFRTLmN1c3RvbVJlc291cmNlVGltZW91dCxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxQb2xpY3lTdGF0ZW1lbnRzOiBwcm9wcy5hZGRpdGlvbmFsUG9saWN5U3RhdGVtZW50cyB8fCBbXSxcbiAgICAgICAgICAgIGxvZ1JldGVudGlvbkRheXM6IHByb3BzLmxvZ1JldGVudGlvbkRheXMgfHwgZW52RGVmYXVsdHMubW9uaXRvcmluZy5sb2dSZXRlbnRpb25EYXlzIGFzIGNkay5hd3NfbG9ncy5SZXRlbnRpb25EYXlzLFxuICAgICAgICAgICAgZW5hYmxlVHJhY2luZzogcHJvcHMuZW5hYmxlVHJhY2luZyAhPT0gdW5kZWZpbmVkID8gcHJvcHMuZW5hYmxlVHJhY2luZyA6IGVudkRlZmF1bHRzLm1vbml0b3JpbmcuZW5hYmxlVHJhY2luZyB8fCBmYWxzZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBwcm9wcy5kZXNjcmlwdGlvbiB8fCBgQmVkcm9jayBBZ2VudCBDb3JlIFJ1bnRpbWUgZm9yICR7cHJvcHMuYWdlbnROYW1lfWAsXG4gICAgICAgICAgICBuZXR3b3JrTW9kZTogKHByb3BzLm5ldHdvcmtNb2RlIHx8ICdQVUJMSUMnKSBhcyAnUFVCTElDJyB8ICdWUEMnLFxuICAgICAgICAgICAgZG9ja2VyQnVpbGRBcmdzOiBwcm9wcy5kb2NrZXJCdWlsZEFyZ3MgfHwge30sXG4gICAgICAgICAgICBkb2NrZXJFeGNsdWRlczogcHJvcHMuZG9ja2VyRXhjbHVkZXMgfHwgW1xuICAgICAgICAgICAgICAgICdub2RlX21vZHVsZXMnLFxuICAgICAgICAgICAgICAgICdjb3ZlcmFnZScsXG4gICAgICAgICAgICAgICAgJ3Rlc3QqJyxcbiAgICAgICAgICAgICAgICAnKi50ZXN0LnRzJyxcbiAgICAgICAgICAgICAgICAnKi5zcGVjLnRzJyxcbiAgICAgICAgICAgICAgICAnLmdpdCcsXG4gICAgICAgICAgICAgICAgJ1JFQURNRS5tZCcsXG4gICAgICAgICAgICAgICAgJ2luZnJhc3RydWN0dXJlLycsXG4gICAgICAgICAgICAgICAgJyFpbmZyYXN0cnVjdHVyZS9hcGktZ2F0ZXdheS1sYW1iZGEvbGFtYmRhL3J1bi5qcycsXG4gICAgICAgICAgICAgICAgJ3RlbXAnLFxuICAgICAgICAgICAgICAgICdleGFtcGxlLWNsaWVudCcsXG4gICAgICAgICAgICAgICAgJ21lbW9yeS1iYW5rJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnVpbGQgRG9ja2VyIGltYWdlIGFzc2V0IHdpdGggY29uZmlndXJhYmxlIHBsYXRmb3JtXG4gICAgICogXG4gICAgICogQ3JlYXRlcyBhIERvY2tlciBpbWFnZSBhc3NldCBmcm9tIHRoZSBzcGVjaWZpZWQgcHJvamVjdCByb290IGRpcmVjdG9yeS5cbiAgICAgKiBUaGUgaW1hZ2UgaXMgYnVpbHQgYW5kIHB1c2hlZCB0byBFQ1IgYXV0b21hdGljYWxseSBieSBDREsuXG4gICAgICogXG4gICAgICogQHBhcmFtIGNvbmZpZyAtIENvbXBsZXRlIGNvbmZpZ3VyYXRpb24gd2l0aCBkZWZhdWx0cyBhcHBsaWVkXG4gICAgICogQHJldHVybnMgRG9ja2VySW1hZ2VBc3NldCB0aGF0IGNhbiBiZSByZWZlcmVuY2VkIGluIHRoZSBhZ2VudCBydW50aW1lXG4gICAgICogXG4gICAgICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBwcm9qZWN0IHJvb3QgZG9lc24ndCBleGlzdCBvciBEb2NrZXJmaWxlLmFnZW50LWNvcmUgaXMgbWlzc2luZ1xuICAgICAqL1xuICAgIHByaXZhdGUgYnVpbGRJbWFnZUFzc2V0KGNvbmZpZzogUmVxdWlyZWQ8QmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzPikge1xuICAgICAgICAvLyBCdWlsZCBhbmQgcHVzaCBEb2NrZXIgaW1hZ2UgdG8gRUNSXG4gICAgICAgIGNvbnN0IGRvY2tlckltYWdlQXNzZXQgPSBuZXcgRG9ja2VySW1hZ2VBc3NldCh0aGlzLCBgJHt0aGlzLmFnZW50TmFtZX0tSW1hZ2VBc3NldGAsIHtcbiAgICAgICAgICAgIGRpcmVjdG9yeTogY29uZmlnLnByb2plY3RSb290LFxuICAgICAgICAgICAgZmlsZTogJ0RvY2tlcmZpbGUuYWdlbnQtY29yZScsXG4gICAgICAgICAgICBwbGF0Zm9ybTogY29uZmlnLmRvY2tlclBsYXRmb3JtLFxuICAgICAgICAgICAgZXhjbHVkZTogY29uZmlnLmRvY2tlckV4Y2x1ZGVzLFxuICAgICAgICAgICAgYnVpbGRBcmdzOiBjb25maWcuZG9ja2VyQnVpbGRBcmdzLFxuICAgICAgICAgICAgLy8gRm9yY2UgcmVidWlsZCB3aGVuIGNyaXRpY2FsIHNvdXJjZSBmaWxlcyBjaGFuZ2VcbiAgICAgICAgICAgIC8vIGV4dHJhSGFzaDogZmluYWxIYXNoLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRvY2tlckltYWdlQXNzZXQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBidWlsZFRhcmJhbGxBc3NldChjb25maWc6IFJlcXVpcmVkPEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcz4pIHtcbiAgICAgICAgY29uc3QgdGFyYmFsbEltYWdlQXNzZXQgPSBuZXcgVGFyYmFsbEltYWdlQXNzZXQodGhpcywgYCR7dGhpcy5hZ2VudE5hbWV9LVRhcmJhbGxBc3NldGAsIHtcbiAgICAgICAgICAgIHRhcmJhbGxGaWxlOiBjb25maWcudGFyYmFsbEltYWdlRmlsZSwgICAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIHRhcmJhbGxJbWFnZUFzc2V0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgQWdlbnQgQ29yZSBSdW50aW1lIHVzaW5nIEFXUyBDdXN0b20gUmVzb3VyY2VcbiAgICAgKiBcbiAgICAgKiBDcmVhdGVzIGEgQmVkcm9jayBBZ2VudCBDb3JlIFJ1bnRpbWUgd2l0aCBjb21wcmVoZW5zaXZlIGNvbmZpZ3VyYXRpb24gaW5jbHVkaW5nOlxuICAgICAqIC0gQ29udGFpbmVyIGNvbmZpZ3VyYXRpb24gd2l0aCBFQ1IgaW1hZ2UgVVJJXG4gICAgICogLSBOZXR3b3JrIGNvbmZpZ3VyYXRpb24gZm9yIHB1YmxpYyBhY2Nlc3NcbiAgICAgKiAtIFByb3RvY29sIGNvbmZpZ3VyYXRpb24gKEhUVFAvSFRUUFMpXG4gICAgICogLSBFbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIE1DUCBhbmQgUzMgaW50ZWdyYXRpb25cbiAgICAgKiAtIFJvbGxiYWNrIHByb3RlY3Rpb24gZm9yIGZhaWxlZCBkZXBsb3ltZW50c1xuICAgICAqIFxuICAgICAqIEBwYXJhbSBjb25maWcgLSBDb21wbGV0ZSBjb25maWd1cmF0aW9uIHdpdGggZGVmYXVsdHMgYXBwbGllZFxuICAgICAqIEBwYXJhbSBpbWFnZUFzc2V0IC0gRG9ja2VyIGltYWdlIGFzc2V0IGZvciB0aGUgYWdlbnQgY29udGFpbmVyXG4gICAgICogQHBhcmFtIGFnZW50Q29yZVBvbGljeSAtIElBTSBwb2xpY3kgZm9yIHRoZSBjdXN0b20gcmVzb3VyY2UgTGFtYmRhXG4gICAgICogQHJldHVybnMgQXdzQ3VzdG9tUmVzb3VyY2UgZm9yIG1hbmFnaW5nIHRoZSBhZ2VudCBydW50aW1lIGxpZmVjeWNsZVxuICAgICAqIFxuICAgICAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgYWdlbnQgcnVudGltZSBjYW5ub3QgYmUgY3JlYXRlZCBvciBjb25maWd1cmVkXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVBZ2VudENvcmVSdW50aW1lKGNvbmZpZzogUmVxdWlyZWQ8QmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzPiwgaW1hZ2VBc3NldDogRG9ja2VySW1hZ2VBc3NldCB8IFRhcmJhbGxJbWFnZUFzc2V0LCBhZ2VudENvcmVQb2xpY3k6IGNyLkF3c0N1c3RvbVJlc291cmNlUG9saWN5KSB7XG5cbiAgICAgICAgLy8gU2hhcmVkIGNvbmZpZ3VyYXRpb24gZm9yIEFnZW50IENvcmUgUnVudGltZSBwYXJhbWV0ZXJzXG4gICAgICAgIGNvbnN0IGNvbW1vbkRlc2NyaXB0aW9uID0gY29uZmlnLmRlc2NyaXB0aW9uO1xuXG4gICAgICAgIGNvbnN0IGNvbW1vbkFnZW50UnVudGltZUFydGlmYWN0ID0ge1xuICAgICAgICAgICAgY29udGFpbmVyQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lclVyaTogaW1hZ2VBc3NldC5pbWFnZVVyaSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29tbW9uTmV0d29ya0NvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgICAgICBuZXR3b3JrTW9kZTogY29uZmlnLm5ldHdvcmtNb2RlLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvbW1vblByb3RvY29sQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgICAgICAgIHNlcnZlclByb3RvY29sOiB0aGlzLnByb3RvY29sLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNvbW1vblJvbGVBcm4gPSB0aGlzLmFnZW50Um9sZS5yb2xlQXJuO1xuXG4gICAgICAgIC8vIEdldCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgd2l0aCBkZWZhdWx0cyBhbmQgdXNlciBvdmVycmlkZXNcbiAgICAgICAgY29uc3QgZW52aXJvbm1lbnRWYXJpYWJsZXMgPSBDb25maWdEZWZhdWx0cy5nZXRCZWRyb2NrQWdlbnRDb3JlRW52aXJvbm1lbnRWYXJpYWJsZXMoXG4gICAgICAgICAgICBjb25maWcuZW52aXJvbm1lbnRWYXJzLFxuICAgICAgICAgICAgY29uZmlnLnMzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBjb25maWcuczNQcmVmaXgsXG4gICAgICAgICAgICB0aGlzLnJlZ2lvblxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENyZWF0ZSBBZ2VudCBDb3JlIFJ1bnRpbWUgdXNpbmcgQXdzQ3VzdG9tUmVzb3VyY2Ugd2l0aCBlbmhhbmNlZCByb2xsYmFjayBoYW5kbGluZ1xuICAgICAgICBjb25zdCBhZ2VudFJ1bnRpbWUgPSBuZXcgY3IuQXdzQ3VzdG9tUmVzb3VyY2UodGhpcywgJ0FnZW50UnVudGltZScsIHtcbiAgICAgICAgICAgIG9uQ3JlYXRlOiB7XG4gICAgICAgICAgICAgICAgc2VydmljZTogJ2JlZHJvY2stYWdlbnRjb3JlLWNvbnRyb2wnLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2NyZWF0ZUFnZW50UnVudGltZScsXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgICAgICBhZ2VudFJ1bnRpbWVOYW1lOiBjb25maWcuYWdlbnROYW1lLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogY29tbW9uRGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgIGFnZW50UnVudGltZUFydGlmYWN0OiBjb21tb25BZ2VudFJ1bnRpbWVBcnRpZmFjdCxcbiAgICAgICAgICAgICAgICAgICAgbmV0d29ya0NvbmZpZ3VyYXRpb246IGNvbW1vbk5ldHdvcmtDb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBwcm90b2NvbENvbmZpZ3VyYXRpb246IGNvbW1vblByb3RvY29sQ29uZmlndXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgcm9sZUFybjogY29tbW9uUm9sZUFybixcbiAgICAgICAgICAgICAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IGVudmlyb25tZW50VmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcGh5c2ljYWxSZXNvdXJjZUlkOiBjci5QaHlzaWNhbFJlc291cmNlSWQuZnJvbVJlc3BvbnNlKCdhZ2VudFJ1bnRpbWVJZCcpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVXBkYXRlOiB7XG4gICAgICAgICAgICAgICAgc2VydmljZTogJ2JlZHJvY2stYWdlbnRjb3JlLWNvbnRyb2wnLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3VwZGF0ZUFnZW50UnVudGltZScsXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgICAgICBhZ2VudFJ1bnRpbWVJZDogbmV3IGNyLlBoeXNpY2FsUmVzb3VyY2VJZFJlZmVyZW5jZSgpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogY29tbW9uRGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgIHJvbGVBcm46IGNvbW1vblJvbGVBcm4sXG4gICAgICAgICAgICAgICAgICAgIGFnZW50UnVudGltZUFydGlmYWN0OiBjb21tb25BZ2VudFJ1bnRpbWVBcnRpZmFjdCxcbiAgICAgICAgICAgICAgICAgICAgbmV0d29ya0NvbmZpZ3VyYXRpb246IGNvbW1vbk5ldHdvcmtDb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBwcm90b2NvbENvbmZpZ3VyYXRpb246IGNvbW1vblByb3RvY29sQ29uZmlndXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IGVudmlyb25tZW50VmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcGh5c2ljYWxSZXNvdXJjZUlkOiBjci5QaHlzaWNhbFJlc291cmNlSWQuZnJvbVJlc3BvbnNlKCdhZ2VudFJ1bnRpbWVJZCcpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRGVsZXRlOiB7XG4gICAgICAgICAgICAgICAgc2VydmljZTogJ2JlZHJvY2stYWdlbnRjb3JlLWNvbnRyb2wnLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2RlbGV0ZUFnZW50UnVudGltZScsXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgICAgICBhZ2VudFJ1bnRpbWVJZDogbmV3IGNyLlBoeXNpY2FsUmVzb3VyY2VJZFJlZmVyZW5jZSgpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gQ29tcHJlaGVuc2l2ZSBlcnJvciBoYW5kbGluZyBmb3Igcm9sbGJhY2sgc2NlbmFyaW9zXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyByb2xsYmFjayBmYWlsdXJlcyB3aGVuIEFnZW50IENvcmUgUnVudGltZSBjcmVhdGlvbiBmYWlscyBvciB3aGVuIHJlc291cmNlcyBkb24ndCBleGlzdFxuICAgICAgICAgICAgICAgIGlnbm9yZUVycm9yQ29kZXNNYXRjaGluZzogJ1ZhbGlkYXRpb25FeGNlcHRpb258SW52YWxpZFBhcmFtZXRlckV4Y2VwdGlvbnxSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9ufEJhZFJlcXVlc3RFeGNlcHRpb258Q29uZmxpY3RFeGNlcHRpb258SW50ZXJuYWxTZXJ2ZXJFeGNlcHRpb258LiphZ2VudFJ1bnRpbWVJZC4qfC4qbm90Lipmb3VuZC4qfC4qZG9lcy4qbm90LipleGlzdC4qJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb2xpY3k6IGFnZW50Q29yZVBvbGljeSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKGNvbmZpZy5jdXN0b21SZXNvdXJjZVRpbWVvdXRNaW51dGVzKSxcbiAgICAgICAgICAgIGluc3RhbGxMYXRlc3RBd3NTZGs6IHRydWUsIC8vIFVzZSB0aGUgbGF0ZXN0IFNESyB2ZXJzaW9uIGluIHRoZSBMYW1iZGEgcnVudGltZSBmb3Igc3VwcG9ydCBhZ2VudCBjb3JlIG9wZXJhdGlvbnNcbiAgICAgICAgICAgIGxvZ1JldGVudGlvbjogY29uZmlnLmxvZ1JldGVudGlvbkRheXMsXG4gICAgICAgICAgICByZXNvdXJjZVR5cGU6ICdDdXN0b206OkFnZW50Q29yZVJ1bnRpbWUnLCAvLyBGaXhlZCB0eXBvXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBhZ2VudFJ1bnRpbWVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgSUFNIHBvbGljeSBmb3IgdGhlIGN1c3RvbSByZXNvdXJjZSBMYW1iZGEgZnVuY3Rpb25cbiAgICAgKiBcbiAgICAgKiBDcmVhdGVzIGFuIElBTSBwb2xpY3kgdGhhdCBncmFudHMgdGhlIGN1c3RvbSByZXNvdXJjZSBMYW1iZGEgZnVuY3Rpb25cbiAgICAgKiB0aGUgbmVjZXNzYXJ5IHBlcm1pc3Npb25zIHRvIG1hbmFnZSBCZWRyb2NrIEFnZW50IENvcmUgUnVudGltZSByZXNvdXJjZXMsXG4gICAgICogaW5jbHVkaW5nIGNyZWF0aW9uLCB1cGRhdGVzLCBkZWxldGlvbiwgYW5kIHdvcmtsb2FkIGlkZW50aXR5IG1hbmFnZW1lbnQuXG4gICAgICogXG4gICAgICogQHJldHVybnMgQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kgd2l0aCBhbGwgcmVxdWlyZWQgcGVybWlzc2lvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIGdldEN1c3RvbVJlc291cmNlUG9saWN5KCkge1xuICAgICAgICAvLyBDdXN0b20gcmVzb3VyY2UgcG9saWN5IGZvciBBZ2VudCBDb3JlIFJ1bnRpbWUgb3BlcmF0aW9uc1xuICAgICAgICAvLyBUaGlzIExhbWJkYSBuZWVkcyBleHBsaWNpdCBwZXJtaXNzaW9ucyB0byBtYW5hZ2UgQWdlbnQgQ29yZSBSdW50aW1lXG4gICAgICAgIGNvbnN0IGFnZW50Q29yZVBvbGljeSA9IGNyLkF3c0N1c3RvbVJlc291cmNlUG9saWN5LmZyb21TdGF0ZW1lbnRzKFtcbiAgICAgICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIHNpZDogJ0FnZW50Q29yZVJ1bnRpbWVNYW5hZ2VtZW50JyxcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpDcmVhdGVBZ2VudFJ1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6Q3JlYXRlQWdlbnRSdW50aW1lRW5kcG9pbnQnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6VXBkYXRlQWdlbnRSdW50aW1lJyxcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOlVwZGF0ZUFnZW50UnVudGltZUVuZHBvaW50JyxcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOkRlbGV0ZUFnZW50UnVudGltZScsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpEZWxldGVBZ2VudFJ1bnRpbWVFbmRwb2ludCcsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpHZXRBZ2VudFJ1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6R2V0QWdlbnRSdW50aW1lRW5kcG9pbnQnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6RGVzY3JpYmVBZ2VudFJ1bnRpbWUnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6TGlzdEFnZW50UnVudGltZXMnLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6TGlzdEFnZW50UnVudGltZUVuZHBvaW50cycsXG4gICAgICAgICAgICAgICAgICAgIC8vIFdvcmtsb2FkIElkZW50aXR5IG1hbmFnZW1lbnQgLSBSZXF1aXJlZCBmb3IgQWdlbnQgQ29yZSBSdW50aW1lIGNyZWF0aW9uXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpDcmVhdGVXb3JrbG9hZElkZW50aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOkRlbGV0ZVdvcmtsb2FkSWRlbnRpdHknLFxuICAgICAgICAgICAgICAgICAgICAnYmVkcm9jay1hZ2VudGNvcmU6R2V0V29ya2xvYWRJZGVudGl0eScsXG4gICAgICAgICAgICAgICAgICAgICdiZWRyb2NrLWFnZW50Y29yZTpVcGRhdGVXb3JrbG9hZElkZW50aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2stYWdlbnRjb3JlOkxpc3RXb3JrbG9hZElkZW50aXRpZXMnLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHt0aGlzLnBhcnRpdGlvbn06YmVkcm9jay1hZ2VudGNvcmU6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OipgLFxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7dGhpcy5wYXJ0aXRpb259OmJlZHJvY2stYWdlbnRjb3JlOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpydW50aW1lLypgLFxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7dGhpcy5wYXJ0aXRpb259OmJlZHJvY2stYWdlbnRjb3JlOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTp3b3JrbG9hZC1pZGVudGl0eS1kaXJlY3RvcnkvKmAsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgLy8gSUFNIHBhc3Mgcm9sZSBwZXJtaXNzaW9ucyBmb3IgdGhlIEFnZW50IENvcmUgZXhlY3V0aW9uIHJvbGVcbiAgICAgICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIHNpZDogJ0FnZW50Q29yZVBhc3NSb2xlJyxcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICdpYW06UGFzc1JvbGUnLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbdGhpcy5hZ2VudFJvbGUucm9sZUFybl0sXG4gICAgICAgICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpYW06UGFzc2VkVG9TZXJ2aWNlJzogJ2JlZHJvY2stYWdlbnRjb3JlLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIC8vIEVDUiBwZXJtaXNzaW9ucyB0byB2YWxpZGF0ZSBjb250YWluZXIgaW1hZ2VzXG4gICAgICAgICAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBzaWQ6ICdFQ1JWYWxpZGF0ZUltYWdlcycsXG4gICAgICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAnZWNyOkRlc2NyaWJlSW1hZ2VzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2VjcjpEZXNjcmliZVJlcG9zaXRvcmllcycsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3RoaXMucGFydGl0aW9ufTplY3I6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OnJlcG9zaXRvcnkvKmAsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICBdKTtcbiAgICAgICAgcmV0dXJuIGFnZW50Q29yZVBvbGljeVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBJQU0gcm9sZSBmb3IgdGhlIEFnZW50IENvcmUgUnVudGltZSB3aXRoIGxlYXN0LXByaXZpbGVnZSBwZXJtaXNzaW9uc1xuICAgICAqIFxuICAgICAqIENyZWF0ZXMgYW4gSUFNIHJvbGUgdGhhdCB0aGUgQWdlbnQgQ29yZSBSdW50aW1lIGFzc3VtZXMgdG8gYWNjZXNzIEFXUyBzZXJ2aWNlcy5cbiAgICAgKiBUaGUgcm9sZSBpbmNsdWRlcyBwZXJtaXNzaW9ucyBmb3I6XG4gICAgICogLSBCZWRyb2NrIG1vZGVsIGludm9jYXRpb25cbiAgICAgKiAtIEVDUiBpbWFnZSBhY2Nlc3MgZm9yIGNvbnRhaW5lciBkZXBsb3ltZW50XG4gICAgICogLSBDbG91ZFdhdGNoIGxvZ2dpbmcgYW5kIFgtUmF5IHRyYWNpbmdcbiAgICAgKiAtIFMzIGFjY2VzcyBmb3IgZGF0YSBzdG9yYWdlIChzY29wZWQgdG8gc3BlY2lmaWMgYnVja2V0L3ByZWZpeClcbiAgICAgKiAtIEtub3dsZWRnZSBiYXNlIHJldHJpZXZhbCBwZXJtaXNzaW9uc1xuICAgICAqIC0gT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIGFjY2VzcyBmb3IgdmVjdG9yIG9wZXJhdGlvbnNcbiAgICAgKiAtIFdvcmtsb2FkIGlkZW50aXR5IHRva2VuIG1hbmFnZW1lbnRcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gY29uZmlnIC0gQ29tcGxldGUgY29uZmlndXJhdGlvbiB3aXRoIGRlZmF1bHRzIGFwcGxpZWRcbiAgICAgKiBAcmV0dXJucyBJQU0gUm9sZSB0aGF0IHRoZSBhZ2VudCBydW50aW1lIHdpbGwgYXNzdW1lXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVBZ2VudElhbVJvbGUoY29uZmlnOiBSZXF1aXJlZDxCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHM+KSB7XG4gICAgICAgIGNvbnN0IGFnZW50Um9sZSA9IG5ldyBSb2xlKHRoaXMsICdBZ2VudFJvbGUnLCB7XG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdiZWRyb2NrLWFnZW50Y29yZS5hbWF6b25hd3MuY29tJywge1xuICAgICAgICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ1N0cmluZ0VxdWFscyc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlQWNjb3VudCc6IHRoaXMuYWNjb3VudFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnQXJuTGlrZSc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlQXJuJzogYGFybjphd3M6YmVkcm9jay1hZ2VudGNvcmU6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OipgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG4gICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIHNpZDogXCJCZWRyb2NrUGVybWlzc2lvbnNcIixcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgICAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGAqYCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgc2lkOiBcIkVDUkltYWdlQWNjZXNzXCIsXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgXCJlY3I6QmF0Y2hHZXRJbWFnZVwiLFxuICAgICAgICAgICAgICAgIFwiZWNyOkdldERvd25sb2FkVXJsRm9yTGF5ZXJcIixcbiAgICAgICAgICAgICAgICBcImVjcjpHZXRBdXRob3JpemF0aW9uVG9rZW5cIixcbiAgICAgICAgICAgICAgICBcImVjcjpCYXRjaEdldEltYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJlY3I6R2V0RG93bmxvYWRVcmxGb3JMYXllclwiLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGBhcm46YXdzOmVjcjoke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06cmVwb3NpdG9yeS8qYFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zJyxcbiAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYGFybjphd3M6bG9nczoke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06bG9nLWdyb3VwOi9hd3MvYmVkcm9jay1hZ2VudGNvcmUvcnVudGltZXMvKmAsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG4gICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnbG9nczpEZXNjcmliZUxvZ1N0cmVhbXMnLFxuICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBgYXJuOmF3czpsb2dzOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpsb2ctZ3JvdXA6L2F3cy9iZWRyb2NrLWFnZW50Y29yZS9ydW50aW1lcy8qYCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdsb2dzOkRlc2NyaWJlTG9nR3JvdXBzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBgYXJuOmF3czpsb2dzOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTpsb2ctZ3JvdXA6KmAsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG4gICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nU3RyZWFtXCIsXG4gICAgICAgICAgICAgICAgXCJsb2dzOlB1dExvZ0V2ZW50c1wiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYGFybjphd3M6bG9nczoke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06bG9nLWdyb3VwOi9hd3MvYmVkcm9jay1hZ2VudGNvcmUvcnVudGltZXMvKjpsb2ctc3RyZWFtOipgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBzaWQ6IFwiRUNSVG9rZW5BY2Nlc3NcIixcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBcImVjcjpHZXRBdXRob3JpemF0aW9uVG9rZW5cIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGAqYCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgc2lkOiBcIlhSYXlQZXJtaXNzaW9uc1wiLFxuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgIFwieHJheTpQdXRUcmFjZVNlZ21lbnRzXCIsXG4gICAgICAgICAgICAgICAgXCJ4cmF5OlB1dFRlbGVtZXRyeVJlY29yZHNcIixcbiAgICAgICAgICAgICAgICBcInhyYXk6R2V0U2FtcGxpbmdSdWxlc1wiLFxuICAgICAgICAgICAgICAgIFwieHJheTpHZXRTYW1wbGluZ1RhcmdldHNcIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIGAqYCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgIFwiY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhXCIsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgYCpgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBcIlN0cmluZ0VxdWFsc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiY2xvdWR3YXRjaDpuYW1lc3BhY2VcIjogXCJiZWRyb2NrLWFnZW50Y29yZVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIHNpZDogXCJHZXRBZ2VudEFjY2Vzc1Rva2VuXCIsXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgXCJiZWRyb2NrLWFnZW50Y29yZTpHZXRXb3JrbG9hZEFjY2Vzc1Rva2VuXCIsXG4gICAgICAgICAgICAgICAgXCJiZWRyb2NrLWFnZW50Y29yZTpHZXRXb3JrbG9hZEFjY2Vzc1Rva2VuRm9ySldUXCIsXG4gICAgICAgICAgICAgICAgXCJiZWRyb2NrLWFnZW50Y29yZTpHZXRXb3JrbG9hZEFjY2Vzc1Rva2VuRm9yVXNlcklkXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBgYXJuOmF3czpiZWRyb2NrLWFnZW50Y29yZToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06d29ya2xvYWQtaWRlbnRpdHktZGlyZWN0b3J5L2RlZmF1bHRgLFxuICAgICAgICAgICAgICAgIGBhcm46YXdzOmJlZHJvY2stYWdlbnRjb3JlOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fTp3b3JrbG9hZC1pZGVudGl0eS1kaXJlY3RvcnkvZGVmYXVsdHdvcmtsb2FkLWlkZW50aXR5LyR7dGhpcy5hZ2VudE5hbWV9LSpgXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG4gICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIC8vIFMzIHBlcm1pc3Npb25zIGZvciBkYXRhIHN0b3JhZ2UgLSBBcHBsaWNhdGlvbiBzcGVjaWZpY1xuXG4gICAgICAgICAgICBzaWQ6ICdTM0RhdGFTdG9yYWdlJyxcbiAgICAgICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpMaXN0QnVja2V0JyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBjb25maWcuczNCdWNrZXQuYnVja2V0QXJuLFxuICAgICAgICAgICAgICAgIGAke2NvbmZpZy5zM0J1Y2tldC5idWNrZXRBcm59LyR7Y29uZmlnLnMzUHJlZml4fSpgLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuICAgICAgICAvLyBBZGQga25vd2xlZGdlIGJhc2UgcGVybWlzc2lvbnMgaWYgcHJvdmlkZWRcbiAgICAgICAgaWYgKGNvbmZpZy5rbm93bGVkZ2VCYXNlcyAmJiBjb25maWcua25vd2xlZGdlQmFzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrYiBvZiBjb25maWcua25vd2xlZGdlQmFzZXMpIHtcbiAgICAgICAgICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFvc3M6QVBJQWNjZXNzQWxsXCJcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBgYXJuOiR7dGhpcy5wYXJ0aXRpb259OmFvc3M6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OmNvbGxlY3Rpb24vJHsoa2IudmVjdG9yS2IudmVjdG9yU3RvcmUgYXMgVmVjdG9yQ29sbGVjdGlvbikuY29sbGVjdGlvbk5hbWV9YFxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIGFnZW50Um9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgc2lkOiBgS0Ike2tiLnZlY3RvcktiLmtub3dsZWRnZUJhc2VJZH1gLFxuICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJiZWRyb2NrOlJldHJpZXZlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImJlZHJvY2s6UmV0cmlldmVBbmRHZW5lcmF0ZVwiXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgYCR7a2IudmVjdG9yS2Iua25vd2xlZGdlQmFzZUFybn1gXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IGFkZGl0aW9uYWwgcG9saWN5IHN0YXRlbWVudHMgcHJvdmlkZWQgYnkgdGhlIHVzZXJcbiAgICAgICAgZm9yIChjb25zdCBzdGF0ZW1lbnQgb2YgY29uZmlnLmFkZGl0aW9uYWxQb2xpY3lTdGF0ZW1lbnRzKSB7XG4gICAgICAgICAgICBhZ2VudFJvbGUuYWRkVG9Qb2xpY3koc3RhdGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhZ2VudFJvbGU7XG4gICAgfVxufVxuIl19