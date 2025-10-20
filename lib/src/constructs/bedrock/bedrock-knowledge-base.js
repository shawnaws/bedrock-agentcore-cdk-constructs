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
exports.BedrockKnowledgeBase = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const constructs_1 = require("constructs");
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const sfn = __importStar(require("aws-cdk-lib/aws-stepfunctions"));
const tasks = __importStar(require("aws-cdk-lib/aws-stepfunctions-tasks"));
const generative_ai_cdk_constructs_1 = require("@cdklabs/generative-ai-cdk-constructs");
const validation_1 = require("../../common/validation");
const defaults_1 = require("../../common/defaults");
/**
 * Validator for Bedrock Knowledge Base properties
 *
 * Validates all required and optional properties to ensure they meet
 * AWS service requirements and best practices for knowledge base creation.
 */
class BedrockKnowledgeBasePropsValidator extends validation_1.BaseValidator {
    /**
     * Validate the properties for BedrockKnowledgeBase
     *
     * @param props - The properties to validate
     * @returns ValidationResult with errors, warnings, and suggestions
     */
    validate(props) {
        this.reset();
        // Validate required fields
        this.validateRequired(props.name, 'name');
        this.validateRequired(props.description, 'description');
        this.validateRequired(props.dataSourceBucket, 'dataSourceBucket');
        this.validateRequired(props.dataSourcePrefixes, 'dataSourcePrefixes');
        this.validateRequired(props.knowledgeBaseInstructions, 'knowledgeBaseInstructions');
        // Validate knowledge base name format
        if (props.name) {
            const nameValidation = validation_1.ValidationUtils.validateAwsResourceName(props.name, 'name');
            if (!nameValidation.isValid) {
                this.errors.push(...nameValidation.errors);
                if (nameValidation.suggestions) {
                    this.suggestions.push(...nameValidation.suggestions);
                }
            }
        }
        // Validate description length
        if (props.description) {
            if (props.description.length < 10) {
                this.addError('Knowledge base description must be at least 10 characters long', 'Please provide a more detailed description for the knowledge base');
            }
            if (props.description.length > 1000) {
                this.addError('Knowledge base description must be 1000 characters or less', 'Please shorten the knowledge base description to 1000 characters or less');
            }
        }
        // Validate knowledge base instructions
        if (props.knowledgeBaseInstructions) {
            if (props.knowledgeBaseInstructions.length < 10) {
                this.addError('Knowledge base instructions must be at least 10 characters long', 'Please provide more detailed instructions for the knowledge base');
            }
            if (props.knowledgeBaseInstructions.length > 2000) {
                this.addError('Knowledge base instructions must be 2000 characters or less', 'Please shorten the knowledge base instructions to 2000 characters or less');
            }
        }
        // Validate data source prefixes
        if (props.dataSourcePrefixes) {
            if (!this.validateNonEmptyArray(props.dataSourcePrefixes, 'dataSourcePrefixes')) {
                // Error already added by validateNonEmptyArray
            }
            else {
                // Validate each prefix
                for (const prefix of props.dataSourcePrefixes) {
                    const prefixValidation = validation_1.ValidationUtils.validateS3Prefix(prefix);
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
            }
        }
        // Validate sync interval
        if (props.dataSourceSyncMinutes !== undefined) {
            this.validateRange(props.dataSourceSyncMinutes, 1, 1440, 'dataSourceSyncMinutes'); // 1 minute to 24 hours
        }
        // Validate chunking strategy if provided
        if (props.chunkingStrategy) {
            if (props.chunkingStrategy.maxTokens !== undefined) {
                this.validateRange(props.chunkingStrategy.maxTokens, 100, 8192, 'chunkingStrategy.maxTokens');
            }
            if (props.chunkingStrategy.overlapPercentage !== undefined) {
                this.validateRange(props.chunkingStrategy.overlapPercentage, 0, 99, 'chunkingStrategy.overlapPercentage');
            }
        }
        return this.createResult();
    }
}
/**
 * Bedrock Knowledge Base construct
 *
 * This L3 construct creates a production-ready Bedrock Knowledge Base with:
 * - Vector knowledge base with configurable embedding models
 * - S3 data source integration with multiple prefix support
 * - Automated ingestion workflows using Step Functions and EventBridge
 * - Configurable chunking strategies for optimal retrieval
 * - CloudWatch monitoring and alerting for ingestion jobs
 * - Environment-specific configuration defaults
 * - Comprehensive input validation and error handling
 *
 * ## Usage Examples
 *
 * ### Basic Knowledge Base
 * ```typescript
 * const knowledgeBase = new BedrockKnowledgeBase(this, 'BasicKB', {
 *   name: 'my-knowledge-base',
 *   description: 'Basic knowledge base for document retrieval',
 *   dataSourceBucket: myBucket,
 *   dataSourcePrefixes: ['documents/'],
 *   knowledgeBaseInstructions: 'Use this knowledge base to answer questions about documents.'
 * });
 * ```
 *
 * ### Advanced Configuration
 * ```typescript
 * const knowledgeBase = new BedrockKnowledgeBase(this, 'AdvancedKB', {
 *   name: 'company-docs-kb',
 *   description: 'Knowledge base containing company documentation and policies',
 *   dataSourceBucket: myDocumentsBucket,
 *   dataSourcePrefixes: ['documents/', 'policies/', 'procedures/'],
 *   knowledgeBaseInstructions: 'Use this knowledge base to answer questions about company policies and procedures.',
 *   environment: 'prod',
 *   dataSourceSyncMinutes: 30,
 *   chunkingStrategy: {
 *     maxTokens: 1000,
 *     overlapPercentage: 15
 *   },
 *   embeddingModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
 *   enableIngestionAlarms: true,
 *   ingestionTimeoutMinutes: 120
 * });
 * ```
 *
 * ### Different Chunking Strategies
 * ```typescript
 * // For technical documentation with longer context
 * const techDocsKB = new BedrockKnowledgeBase(this, 'TechDocsKB', {
 *   name: 'tech-docs',
 *   description: 'Technical documentation knowledge base',
 *   dataSourceBucket: techDocsBucket,
 *   dataSourcePrefixes: ['api-docs/', 'guides/'],
 *   knowledgeBaseInstructions: 'Use for technical documentation and API references.',
 *   chunkingStrategy: {
 *     maxTokens: 1500,
 *     overlapPercentage: 25
 *   }
 * });
 *
 * // For FAQ-style content with shorter chunks
 * const faqKB = new BedrockKnowledgeBase(this, 'FAQKB', {
 *   name: 'faq-kb',
 *   description: 'Frequently asked questions knowledge base',
 *   dataSourceBucket: faqBucket,
 *   dataSourcePrefixes: ['faq/'],
 *   knowledgeBaseInstructions: 'Use for answering frequently asked questions.',
 *   chunkingStrategy: {
 *     maxTokens: 300,
 *     overlapPercentage: 10
 *   }
 * });
 * ```
 *
 * ## Troubleshooting
 *
 * ### Common Issues
 *
 * **Ingestion Jobs Failing**
 * - Check S3 bucket permissions and ensure the knowledge base has read access
 * - Verify that the specified S3 prefixes exist and contain supported file types
 * - Review CloudWatch logs for the Step Functions state machine
 * - Ensure the S3 bucket is in the same region as the knowledge base
 *
 * **Poor Retrieval Quality**
 * - Adjust chunking strategy: increase maxTokens for longer context, decrease for more precise matching
 * - Increase overlapPercentage to improve context continuity between chunks
 * - Consider using a different embedding model for your content type
 * - Review the quality and structure of your source documents
 *
 * **High Costs**
 * - Reduce sync frequency (dataSourceSyncMinutes) if documents don't change often
 * - Use smaller chunk sizes to reduce embedding costs
 * - Consider using environment-specific configurations to optimize for cost in dev/staging
 *
 * **Slow Ingestion**
 * - Increase ingestionTimeoutMinutes for large document sets
 * - Consider breaking large document sets into smaller batches
 * - Monitor CloudWatch metrics to identify bottlenecks
 *
 * ### Best Practices
 *
 * 1. **Document Organization**: Structure your S3 prefixes logically to make maintenance easier
 * 2. **Chunking Strategy**: Start with defaults and adjust based on retrieval quality
 * 3. **Monitoring**: Enable ingestion alarms in production environments
 * 4. **Testing**: Test with a small document set first to validate configuration
 * 5. **Security**: Use least-privilege IAM policies and enable S3 bucket encryption
 */
class BedrockKnowledgeBase extends constructs_1.Construct {
    /**
     * Create a new Bedrock Knowledge Base
     *
     * @param scope - The scope in which to define this construct
     * @param id - The scoped construct ID. Must be unique amongst siblings in the same scope
     * @param props - Configuration properties for the knowledge base
     *
     * @throws {ConstructError} When validation fails or required resources cannot be created
     */
    constructor(scope, id, props) {
        super(scope, id);
        try {
            // Validate input properties
            const validator = new BedrockKnowledgeBasePropsValidator();
            const validationResult = validator.validate(props);
            if (!validationResult.isValid) {
                validation_1.ValidationUtils.throwIfInvalid(validationResult, 'BedrockKnowledgeBase');
            }
            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                console.warn(`[BedrockKnowledgeBase] Validation warnings for knowledge base '${props.name}':`, validationResult.warnings);
                if (validationResult.suggestions) {
                    console.warn(`[BedrockKnowledgeBase] Suggestions:`, validationResult.suggestions);
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to validate BedrockKnowledgeBase properties: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            // Apply defaults to configuration
            this.config = this.applyDefaults(props);
            this.knowledgeBaseName = this.config.name;
            // Create the vector knowledge base
            this.vectorKb = this.createVectorKnowledgeBase();
            // Create S3 data source and ingestion pipeline
            this.kbS3Ds = this.createS3DataSource();
            this.createIngestionPipeline();
            // Create CloudFormation outputs
            this.createOutputs();
        }
        catch (error) {
            console.log(error);
            throw new Error(`Failed to create BedrockKnowledgeBase resources: ${error instanceof Error ? error.message : String(error)}`);
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
            name: props.name,
            description: props.description,
            dataSourceBucket: props.dataSourceBucket,
            dataSourcePrefixes: props.dataSourcePrefixes,
            knowledgeBaseInstructions: props.knowledgeBaseInstructions,
            dataSourceSyncMinutes: props.dataSourceSyncMinutes || defaults_1.BEDROCK_KNOWLEDGE_BASE_DEFAULTS.dataSourceSyncMinutes,
            knowledgeBasePropsOverride: props.knowledgeBasePropsOverride || {},
            chunkingStrategy: {
                maxTokens: props.chunkingStrategy?.maxTokens ?? defaults_1.BEDROCK_KNOWLEDGE_BASE_DEFAULTS.chunkingStrategy.maxTokens,
                overlapPercentage: props.chunkingStrategy?.overlapPercentage ?? defaults_1.BEDROCK_KNOWLEDGE_BASE_DEFAULTS.chunkingStrategy.overlapPercentage,
            },
            embeddingModel: props.embeddingModel || generative_ai_cdk_constructs_1.bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_512,
            enableIngestionAlarms: props.enableIngestionAlarms !== undefined ? props.enableIngestionAlarms : envDefaults.monitoring.enableAlarms || false,
            ingestionTimeoutMinutes: props.ingestionTimeoutMinutes || 60,
        };
    }
    /**
     * Create the vector knowledge base with configured embedding model
     *
     * @returns The created VectorKnowledgeBase
     */
    createVectorKnowledgeBase() {
        const baseProps = {
            embeddingsModel: this.config.embeddingModel,
            instruction: this.config.knowledgeBaseInstructions,
            description: this.config.description,
        };
        // Merge with overrides, but preserve the embedding model from config
        const kbProps = {
            ...baseProps,
            ...this.config.knowledgeBasePropsOverride,
            // Ensure embedding model from config takes precedence
            embeddingsModel: this.config.embeddingModel,
        };
        return new generative_ai_cdk_constructs_1.bedrock.VectorKnowledgeBase(this, this.config.name, kbProps);
    }
    /**
     * Create S3 data source with configured chunking strategy
     *
     * @returns The created S3DataSource
     */
    createS3DataSource() {
        return new generative_ai_cdk_constructs_1.bedrock.S3DataSource(this, 'kbS3DataSource', {
            bucket: this.config.dataSourceBucket,
            knowledgeBase: this.vectorKb,
            dataSourceName: this.config.name,
            inclusionPrefixes: this.config.dataSourcePrefixes,
            chunkingStrategy: generative_ai_cdk_constructs_1.bedrock.ChunkingStrategy.fixedSize({
                maxTokens: this.config.chunkingStrategy.maxTokens,
                overlapPercentage: this.config.chunkingStrategy.overlapPercentage,
            }),
        });
    }
    /**
     * Create automated ingestion pipeline with Step Functions and EventBridge
     *
     * Sets up a robust ingestion pipeline with:
     * - Retry logic for failed ingestion jobs
     * - Error handling and dead letter queues
     * - CloudWatch alarms for monitoring
     * - Scheduled execution at configured intervals
     */
    createIngestionPipeline() {
        // Create IAM role for the Step Functions state machine
        const ingestionRole = new iam.Role(this, 'IngestionRole', {
            assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
            inlinePolicies: {
                'IngestionPolicy': new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [
                                'bedrock:StartIngestionJob',
                                'bedrock:GetIngestionJob',
                                'bedrock:ListIngestionJobs'
                            ],
                            resources: [this.vectorKb.knowledgeBaseArn]
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ],
                            resources: ['*']
                        })
                    ]
                })
            }
        });
        // Create Step Functions state machine with error handling and retry logic
        const startIngestionTask = new tasks.CallAwsService(this, 'StartIngestionJob', {
            action: 'startIngestionJob',
            service: 'bedrockagent',
            parameters: {
                "KnowledgeBaseId": this.vectorKb.knowledgeBaseId,
                "DataSourceId": this.kbS3Ds.dataSourceId
            },
            iamResources: [
                this.vectorKb.knowledgeBaseArn,
                this.kbS3Ds.bucket.bucketArn,
                this.kbS3Ds.bucket.bucketArn + '/*',
            ],
            resultPath: '$.ingestionJob'
        });
        // Add retry logic for transient failures
        startIngestionTask.addRetry({
            errors: ['States.TaskFailed', 'States.Timeout'],
            interval: cdk.Duration.seconds(30),
            maxAttempts: 3,
            backoffRate: 2.0
        });
        // Add error handling for permanent failures
        const failureState = new sfn.Fail(this, 'IngestionFailed', {
            comment: 'Knowledge base ingestion job failed after retries'
        });
        startIngestionTask.addCatch(failureState, {
            errors: ['States.ALL'],
            resultPath: '$.error'
        });
        // Create success state
        const successState = new sfn.Succeed(this, 'IngestionSucceeded', {
            comment: 'Knowledge base ingestion job started successfully'
        });
        // Chain the states together
        const definition = startIngestionTask.next(successState);
        // Create the state machine
        const stateMachine = new sfn.StateMachine(this, 'StartIngestionJobStateMachine', {
            role: ingestionRole,
            timeout: cdk.Duration.minutes(this.config.ingestionTimeoutMinutes),
            definitionBody: sfn.DefinitionBody.fromChainable(definition),
            logs: {
                destination: new cdk.aws_logs.LogGroup(this, 'IngestionStateMachineLogGroup', {
                    retention: defaults_1.ConfigDefaults.getLogRetention(this.config.environment),
                    removalPolicy: defaults_1.ConfigDefaults.getRemovalPolicy(this.config.environment),
                }),
                level: sfn.LogLevel.ALL,
                includeExecutionData: true
            }
        });
        // Create EventBridge rule for scheduled ingestion
        new events.Rule(this, 'S3DataSourceIngestionSync', {
            schedule: cdk.aws_events.Schedule.rate(cdk.Duration.minutes(this.config.dataSourceSyncMinutes)),
            enabled: true,
            targets: [new targets.SfnStateMachine(stateMachine)]
        });
        // Create CloudWatch alarms if enabled
        if (this.config.enableIngestionAlarms) {
            this.createIngestionAlarms(stateMachine);
        }
    }
    /**
     * Create CloudWatch alarms for monitoring ingestion pipeline health
     *
     * Creates three types of alarms:
     * 1. Failure alarm - Triggers when ingestion jobs fail
     * 2. Timeout alarm - Triggers when ingestion jobs timeout
     * 3. Duration alarm - Warns when jobs take longer than expected
     *
     * These alarms help monitor the health of the knowledge base ingestion
     * process and can be integrated with SNS topics for notifications.
     *
     * @param stateMachine - The Step Functions state machine to monitor
     */
    createIngestionAlarms(stateMachine) {
        // Alarm for failed executions
        new cdk.aws_cloudwatch.Alarm(this, 'IngestionFailureAlarm', {
            alarmName: `${this.config.name}-ingestion-failures`,
            alarmDescription: `Knowledge base ${this.config.name} ingestion job failures`,
            metric: stateMachine.metricFailed({
                period: cdk.Duration.minutes(5),
                statistic: 'Sum'
            }),
            threshold: 1,
            evaluationPeriods: 1,
            treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING
        });
        // Alarm for execution timeouts
        new cdk.aws_cloudwatch.Alarm(this, 'IngestionTimeoutAlarm', {
            alarmName: `${this.config.name}-ingestion-timeouts`,
            alarmDescription: `Knowledge base ${this.config.name} ingestion job timeouts`,
            metric: stateMachine.metricTimedOut({
                period: cdk.Duration.minutes(5),
                statistic: 'Sum'
            }),
            threshold: 1,
            evaluationPeriods: 1,
            treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING
        });
        // Alarm for execution duration (warn if taking too long)
        new cdk.aws_cloudwatch.Alarm(this, 'IngestionDurationAlarm', {
            alarmName: `${this.config.name}-ingestion-duration`,
            alarmDescription: `Knowledge base ${this.config.name} ingestion job duration warning`,
            metric: new cdk.aws_cloudwatch.Metric({
                namespace: 'AWS/States',
                metricName: 'ExecutionTime',
                dimensionsMap: {
                    StateMachineArn: stateMachine.stateMachineArn
                },
                period: cdk.Duration.minutes(5),
                statistic: 'Average'
            }),
            threshold: this.config.ingestionTimeoutMinutes * 60 * 1000 * 0.8, // 80% of timeout in milliseconds
            evaluationPeriods: 2,
            treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING
        });
    }
    /**
     * Create CloudFormation outputs for easy reference
     */
    createOutputs() {
        const stackName = cdk.Stack.of(this).stackName;
        new cdk.CfnOutput(this, 'KnowledgeBaseId', {
            value: this.vectorKb.knowledgeBaseId,
            description: 'ID of the created knowledge base',
            exportName: `${stackName}-${this.config.name}-KnowledgeBaseId`,
        });
        new cdk.CfnOutput(this, 'KnowledgeBaseArn', {
            value: this.vectorKb.knowledgeBaseArn,
            description: 'ARN of the created knowledge base',
            exportName: `${stackName}-${this.config.name}-KnowledgeBaseArn`,
        });
        new cdk.CfnOutput(this, 'DataSourceId', {
            value: this.kbS3Ds.dataSourceId,
            description: 'ID of the S3 data source',
            exportName: `${stackName}-${this.config.name}-DataSourceId`,
        });
    }
}
exports.BedrockKnowledgeBase = BedrockKnowledgeBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1rbm93bGVkZ2UtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb25zdHJ1Y3RzL2JlZHJvY2svYmVkcm9jay1rbm93bGVkZ2UtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyQ0FBdUM7QUFFdkMseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCx3RUFBMEQ7QUFDMUQsbUVBQXFEO0FBQ3JELDJFQUE2RDtBQUM3RCx3RkFBZ0U7QUFLaEUsd0RBQXlFO0FBQ3pFLG9EQUF3RjtBQUV4Rjs7Ozs7R0FLRztBQUNILE1BQU0sa0NBQW1DLFNBQVEsMEJBQWlDO0lBQzlFOzs7OztPQUtHO0lBQ0gsUUFBUSxDQUFDLEtBQXlCO1FBQzlCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztRQUVwRixzQ0FBc0M7UUFDdEMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDYixNQUFNLGNBQWMsR0FBRyw0QkFBZSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkYs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RyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCO1lBQ3JDLFdBQVcsRUFBRSxtQ0FBbUM7WUFDaEQsVUFBVSxFQUFFLEdBQUcsU0FBUyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxtQkFBbUI7U0FDbEUsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDcEMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWTtZQUMvQixXQUFXLEVBQUUsMEJBQTBCO1lBQ3ZDLFVBQVUsRUFBRSxHQUFHLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksZUFBZTtTQUM5RCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUF6VUQsb0RBeVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJztcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzJztcbmltcG9ydCAqIGFzIHNmbiBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucyc7XG5pbXBvcnQgKiBhcyB0YXNrcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucy10YXNrcyc7XG5pbXBvcnQgeyBiZWRyb2NrIH0gZnJvbSAnQGNka2xhYnMvZ2VuZXJhdGl2ZS1haS1jZGstY29uc3RydWN0cyc7XG5pbXBvcnQgeyBcbiAgICBCYXNlQ29uc3RydWN0UHJvcHMsIFxuICAgIFZhbGlkYXRpb25SZXN1bHRcbn0gZnJvbSAnLi4vLi4vY29tbW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHsgQmFzZVZhbGlkYXRvciwgVmFsaWRhdGlvblV0aWxzIH0gZnJvbSAnLi4vLi4vY29tbW9uL3ZhbGlkYXRpb24nO1xuaW1wb3J0IHsgQ29uZmlnRGVmYXVsdHMsIEJFRFJPQ0tfS05PV0xFREdFX0JBU0VfREVGQVVMVFMgfSBmcm9tICcuLi8uLi9jb21tb24vZGVmYXVsdHMnO1xuXG4vKipcbiAqIFZhbGlkYXRvciBmb3IgQmVkcm9jayBLbm93bGVkZ2UgQmFzZSBwcm9wZXJ0aWVzXG4gKiBcbiAqIFZhbGlkYXRlcyBhbGwgcmVxdWlyZWQgYW5kIG9wdGlvbmFsIHByb3BlcnRpZXMgdG8gZW5zdXJlIHRoZXkgbWVldFxuICogQVdTIHNlcnZpY2UgcmVxdWlyZW1lbnRzIGFuZCBiZXN0IHByYWN0aWNlcyBmb3Iga25vd2xlZGdlIGJhc2UgY3JlYXRpb24uXG4gKi9cbmNsYXNzIEJlZHJvY2tLbm93bGVkZ2VCYXNlUHJvcHNWYWxpZGF0b3IgZXh0ZW5kcyBCYXNlVmFsaWRhdG9yPEtub3dsZWRnZUJhc2VQcm9wcz4ge1xuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIHRoZSBwcm9wZXJ0aWVzIGZvciBCZWRyb2NrS25vd2xlZGdlQmFzZVxuICAgICAqIFxuICAgICAqIEBwYXJhbSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIHRvIHZhbGlkYXRlXG4gICAgICogQHJldHVybnMgVmFsaWRhdGlvblJlc3VsdCB3aXRoIGVycm9ycywgd2FybmluZ3MsIGFuZCBzdWdnZXN0aW9uc1xuICAgICAqL1xuICAgIHZhbGlkYXRlKHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMpOiBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIC8vIFZhbGlkYXRlIHJlcXVpcmVkIGZpZWxkc1xuICAgICAgICB0aGlzLnZhbGlkYXRlUmVxdWlyZWQocHJvcHMubmFtZSwgJ25hbWUnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLmRlc2NyaXB0aW9uLCAnZGVzY3JpcHRpb24nKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLmRhdGFTb3VyY2VCdWNrZXQsICdkYXRhU291cmNlQnVja2V0Jyk7XG4gICAgICAgIHRoaXMudmFsaWRhdGVSZXF1aXJlZChwcm9wcy5kYXRhU291cmNlUHJlZml4ZXMsICdkYXRhU291cmNlUHJlZml4ZXMnKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLmtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnMsICdrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zJyk7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUga25vd2xlZGdlIGJhc2UgbmFtZSBmb3JtYXRcbiAgICAgICAgaWYgKHByb3BzLm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVWYWxpZGF0aW9uID0gVmFsaWRhdGlvblV0aWxzLnZhbGlkYXRlQXdzUmVzb3VyY2VOYW1lKHByb3BzLm5hbWUsICduYW1lJyk7XG4gICAgICAgICAgICBpZiAoIW5hbWVWYWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKC4uLm5hbWVWYWxpZGF0aW9uLmVycm9ycyk7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnMucHVzaCguLi5uYW1lVmFsaWRhdGlvbi5zdWdnZXN0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgZGVzY3JpcHRpb24gbGVuZ3RoXG4gICAgICAgIGlmIChwcm9wcy5kZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgaWYgKHByb3BzLmRlc2NyaXB0aW9uLmxlbmd0aCA8IDEwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgJ0tub3dsZWRnZSBiYXNlIGRlc2NyaXB0aW9uIG11c3QgYmUgYXQgbGVhc3QgMTAgY2hhcmFjdGVycyBsb25nJyxcbiAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSBwcm92aWRlIGEgbW9yZSBkZXRhaWxlZCBkZXNjcmlwdGlvbiBmb3IgdGhlIGtub3dsZWRnZSBiYXNlJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJvcHMuZGVzY3JpcHRpb24ubGVuZ3RoID4gMTAwMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICdLbm93bGVkZ2UgYmFzZSBkZXNjcmlwdGlvbiBtdXN0IGJlIDEwMDAgY2hhcmFjdGVycyBvciBsZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSBzaG9ydGVuIHRoZSBrbm93bGVkZ2UgYmFzZSBkZXNjcmlwdGlvbiB0byAxMDAwIGNoYXJhY3RlcnMgb3IgbGVzcydcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUga25vd2xlZGdlIGJhc2UgaW5zdHJ1Y3Rpb25zXG4gICAgICAgIGlmIChwcm9wcy5rbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICAgICAgICBpZiAocHJvcHMua25vd2xlZGdlQmFzZUluc3RydWN0aW9ucy5sZW5ndGggPCAxMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICdLbm93bGVkZ2UgYmFzZSBpbnN0cnVjdGlvbnMgbXVzdCBiZSBhdCBsZWFzdCAxMCBjaGFyYWN0ZXJzIGxvbmcnLFxuICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIHByb3ZpZGUgbW9yZSBkZXRhaWxlZCBpbnN0cnVjdGlvbnMgZm9yIHRoZSBrbm93bGVkZ2UgYmFzZSdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb3BzLmtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnMubGVuZ3RoID4gMjAwMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICdLbm93bGVkZ2UgYmFzZSBpbnN0cnVjdGlvbnMgbXVzdCBiZSAyMDAwIGNoYXJhY3RlcnMgb3IgbGVzcycsXG4gICAgICAgICAgICAgICAgICAgICdQbGVhc2Ugc2hvcnRlbiB0aGUga25vd2xlZGdlIGJhc2UgaW5zdHJ1Y3Rpb25zIHRvIDIwMDAgY2hhcmFjdGVycyBvciBsZXNzJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBkYXRhIHNvdXJjZSBwcmVmaXhlc1xuICAgICAgICBpZiAocHJvcHMuZGF0YVNvdXJjZVByZWZpeGVzKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudmFsaWRhdGVOb25FbXB0eUFycmF5KHByb3BzLmRhdGFTb3VyY2VQcmVmaXhlcywgJ2RhdGFTb3VyY2VQcmVmaXhlcycpKSB7XG4gICAgICAgICAgICAgICAgLy8gRXJyb3IgYWxyZWFkeSBhZGRlZCBieSB2YWxpZGF0ZU5vbkVtcHR5QXJyYXlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgZWFjaCBwcmVmaXhcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByZWZpeCBvZiBwcm9wcy5kYXRhU291cmNlUHJlZml4ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJlZml4VmFsaWRhdGlvbiA9IFZhbGlkYXRpb25VdGlscy52YWxpZGF0ZVMzUHJlZml4KHByZWZpeCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJlZml4VmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKC4uLnByZWZpeFZhbGlkYXRpb24uZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocHJlZml4VmFsaWRhdGlvbi53YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5pbmdzLnB1c2goLi4ucHJlZml4VmFsaWRhdGlvbi53YXJuaW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZWZpeFZhbGlkYXRpb24uc3VnZ2VzdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnMucHVzaCguLi5wcmVmaXhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHN5bmMgaW50ZXJ2YWxcbiAgICAgICAgaWYgKHByb3BzLmRhdGFTb3VyY2VTeW5jTWludXRlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlUmFuZ2UocHJvcHMuZGF0YVNvdXJjZVN5bmNNaW51dGVzLCAxLCAxNDQwLCAnZGF0YVNvdXJjZVN5bmNNaW51dGVzJyk7IC8vIDEgbWludXRlIHRvIDI0IGhvdXJzXG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBjaHVua2luZyBzdHJhdGVneSBpZiBwcm92aWRlZFxuICAgICAgICBpZiAocHJvcHMuY2h1bmtpbmdTdHJhdGVneSkge1xuICAgICAgICAgICAgaWYgKHByb3BzLmNodW5raW5nU3RyYXRlZ3kubWF4VG9rZW5zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlUmFuZ2UocHJvcHMuY2h1bmtpbmdTdHJhdGVneS5tYXhUb2tlbnMsIDEwMCwgODE5MiwgJ2NodW5raW5nU3RyYXRlZ3kubWF4VG9rZW5zJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJvcHMuY2h1bmtpbmdTdHJhdGVneS5vdmVybGFwUGVyY2VudGFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0ZVJhbmdlKHByb3BzLmNodW5raW5nU3RyYXRlZ3kub3ZlcmxhcFBlcmNlbnRhZ2UsIDAsIDk5LCAnY2h1bmtpbmdTdHJhdGVneS5vdmVybGFwUGVyY2VudGFnZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUmVzdWx0KCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFByb3BlcnRpZXMgZm9yIHRoZSBCZWRyb2NrIEtub3dsZWRnZSBCYXNlIGNvbnN0cnVjdFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEtub3dsZWRnZUJhc2VQcm9wcyBleHRlbmRzIEJhc2VDb25zdHJ1Y3RQcm9wcyB7XG4gICAgLyoqIFxuICAgICAqIFVuaXF1ZSBuYW1lIGZvciB0aGUga25vd2xlZGdlIGJhc2VcbiAgICAgKiBNdXN0IGJlIGFscGhhbnVtZXJpYyB3aXRoIGh5cGhlbnMgYW5kIHVuZGVyc2NvcmVzIG9ubHlcbiAgICAgKi9cbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgXG4gICAgLyoqIFxuICAgICAqIERlc2NyaXB0aW9uIG9mIHRoZSBrbm93bGVkZ2UgYmFzZSBhbmQgaXRzIHB1cnBvc2VcbiAgICAgKiBTaG91bGQgYmUgYmV0d2VlbiAxMC0xMDAwIGNoYXJhY3RlcnNcbiAgICAgKi9cbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIFxuICAgIC8qKiBcbiAgICAgKiBTMyBidWNrZXQgY29udGFpbmluZyB0aGUgc291cmNlIGRhdGEgZm9yIHRoZSBrbm93bGVkZ2UgYmFzZVxuICAgICAqIFRoZSBrbm93bGVkZ2UgYmFzZSB3aWxsIGhhdmUgcmVhZCBhY2Nlc3MgdG8gdGhpcyBidWNrZXRcbiAgICAgKi9cbiAgICBkYXRhU291cmNlQnVja2V0OiBzMy5CdWNrZXQ7XG4gICAgXG4gICAgLyoqIFxuICAgICAqIFMzIHByZWZpeGVzIHRvIGluY2x1ZGUgaW4gdGhlIGtub3dsZWRnZSBiYXNlXG4gICAgICogRWFjaCBwcmVmaXggc2hvdWxkIGVuZCB3aXRoICcvJyBmb3IgcHJvcGVyIG9yZ2FuaXphdGlvblxuICAgICAqL1xuICAgIGRhdGFTb3VyY2VQcmVmaXhlczogc3RyaW5nW107XG4gICAgXG4gICAgLyoqIFxuICAgICAqIFN5bmMgaW50ZXJ2YWwgaW4gbWludXRlcyBmb3IgYXV0b21hdGVkIGluZ2VzdGlvblxuICAgICAqIEBkZWZhdWx0IDEwIG1pbnV0ZXNcbiAgICAgKi9cbiAgICBkYXRhU291cmNlU3luY01pbnV0ZXM/OiBudW1iZXI7XG4gICAgXG4gICAgLyoqIFxuICAgICAqIEluc3RydWN0aW9ucyBmb3IgaG93IHRoZSBrbm93bGVkZ2UgYmFzZSBzaG91bGQgYmUgdXNlZFxuICAgICAqIFNob3VsZCBiZSBiZXR3ZWVuIDEwLTIwMDAgY2hhcmFjdGVyc1xuICAgICAqL1xuICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6IHN0cmluZztcbiAgICBcbiAgICAvKiogXG4gICAgICogT3ZlcnJpZGUgcHJvcGVydGllcyBmb3IgdGhlIHVuZGVybHlpbmcgVmVjdG9yS25vd2xlZGdlQmFzZVxuICAgICAqIFVzZSB0aGlzIHRvIGN1c3RvbWl6ZSBhZHZhbmNlZCBzZXR0aW5ncyAoZW1iZWRkaW5nIG1vZGVsIGlzIGhhbmRsZWQgc2VwYXJhdGVseSlcbiAgICAgKi9cbiAgICBrbm93bGVkZ2VCYXNlUHJvcHNPdmVycmlkZT86IFBhcnRpYWw8YmVkcm9jay5WZWN0b3JLbm93bGVkZ2VCYXNlUHJvcHM+O1xuICAgIFxuICAgIC8qKlxuICAgICAqIENodW5raW5nIHN0cmF0ZWd5IGZvciBkb2N1bWVudCBwcm9jZXNzaW5nXG4gICAgICogQGRlZmF1bHQgeyBtYXhUb2tlbnM6IDUwMCwgb3ZlcmxhcFBlcmNlbnRhZ2U6IDIwIH1cbiAgICAgKi9cbiAgICBjaHVua2luZ1N0cmF0ZWd5Pzoge1xuICAgICAgICBtYXhUb2tlbnM/OiBudW1iZXI7XG4gICAgICAgIG92ZXJsYXBQZXJjZW50YWdlPzogbnVtYmVyO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICogRW1iZWRkaW5nIG1vZGVsIHRvIHVzZSBmb3IgdGhlIGtub3dsZWRnZSBiYXNlXG4gICAgICogQGRlZmF1bHQgYmVkcm9jay5CZWRyb2NrRm91bmRhdGlvbk1vZGVsLlRJVEFOX0VNQkVEX1RFWFRfVjJfNTEyXG4gICAgICovXG4gICAgZW1iZWRkaW5nTW9kZWw/OiBiZWRyb2NrLkJlZHJvY2tGb3VuZGF0aW9uTW9kZWw7XG4gICAgXG4gICAgLyoqXG4gICAgICogRW5hYmxlIENsb3VkV2F0Y2ggYWxhcm1zIGZvciBpbmdlc3Rpb24gam9iIGZhaWx1cmVzXG4gICAgICogQGRlZmF1bHQgQmFzZWQgb24gZW52aXJvbm1lbnQgKGRldjogZmFsc2UsIHN0YWdpbmcvcHJvZDogdHJ1ZSlcbiAgICAgKi9cbiAgICBlbmFibGVJbmdlc3Rpb25BbGFybXM/OiBib29sZWFuO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEN1c3RvbSB0aW1lb3V0IGZvciBpbmdlc3Rpb24gam9icyBpbiBtaW51dGVzXG4gICAgICogQGRlZmF1bHQgNjAgbWludXRlc1xuICAgICAqL1xuICAgIGluZ2VzdGlvblRpbWVvdXRNaW51dGVzPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIEJlZHJvY2sgS25vd2xlZGdlIEJhc2UgY29uc3RydWN0XG4gKiBcbiAqIFRoaXMgTDMgY29uc3RydWN0IGNyZWF0ZXMgYSBwcm9kdWN0aW9uLXJlYWR5IEJlZHJvY2sgS25vd2xlZGdlIEJhc2Ugd2l0aDpcbiAqIC0gVmVjdG9yIGtub3dsZWRnZSBiYXNlIHdpdGggY29uZmlndXJhYmxlIGVtYmVkZGluZyBtb2RlbHNcbiAqIC0gUzMgZGF0YSBzb3VyY2UgaW50ZWdyYXRpb24gd2l0aCBtdWx0aXBsZSBwcmVmaXggc3VwcG9ydFxuICogLSBBdXRvbWF0ZWQgaW5nZXN0aW9uIHdvcmtmbG93cyB1c2luZyBTdGVwIEZ1bmN0aW9ucyBhbmQgRXZlbnRCcmlkZ2VcbiAqIC0gQ29uZmlndXJhYmxlIGNodW5raW5nIHN0cmF0ZWdpZXMgZm9yIG9wdGltYWwgcmV0cmlldmFsXG4gKiAtIENsb3VkV2F0Y2ggbW9uaXRvcmluZyBhbmQgYWxlcnRpbmcgZm9yIGluZ2VzdGlvbiBqb2JzXG4gKiAtIEVudmlyb25tZW50LXNwZWNpZmljIGNvbmZpZ3VyYXRpb24gZGVmYXVsdHNcbiAqIC0gQ29tcHJlaGVuc2l2ZSBpbnB1dCB2YWxpZGF0aW9uIGFuZCBlcnJvciBoYW5kbGluZ1xuICogXG4gKiAjIyBVc2FnZSBFeGFtcGxlc1xuICogXG4gKiAjIyMgQmFzaWMgS25vd2xlZGdlIEJhc2VcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGtub3dsZWRnZUJhc2UgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2UodGhpcywgJ0Jhc2ljS0InLCB7XG4gKiAgIG5hbWU6ICdteS1rbm93bGVkZ2UtYmFzZScsXG4gKiAgIGRlc2NyaXB0aW9uOiAnQmFzaWMga25vd2xlZGdlIGJhc2UgZm9yIGRvY3VtZW50IHJldHJpZXZhbCcsXG4gKiAgIGRhdGFTb3VyY2VCdWNrZXQ6IG15QnVja2V0LFxuICogICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICogICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIHRoaXMga25vd2xlZGdlIGJhc2UgdG8gYW5zd2VyIHF1ZXN0aW9ucyBhYm91dCBkb2N1bWVudHMuJ1xuICogfSk7XG4gKiBgYGBcbiAqIFxuICogIyMjIEFkdmFuY2VkIENvbmZpZ3VyYXRpb25cbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGtub3dsZWRnZUJhc2UgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2UodGhpcywgJ0FkdmFuY2VkS0InLCB7XG4gKiAgIG5hbWU6ICdjb21wYW55LWRvY3Mta2InLFxuICogICBkZXNjcmlwdGlvbjogJ0tub3dsZWRnZSBiYXNlIGNvbnRhaW5pbmcgY29tcGFueSBkb2N1bWVudGF0aW9uIGFuZCBwb2xpY2llcycsXG4gKiAgIGRhdGFTb3VyY2VCdWNrZXQ6IG15RG9jdW1lbnRzQnVja2V0LFxuICogICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLycsICdwb2xpY2llcy8nLCAncHJvY2VkdXJlcy8nXSxcbiAqICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgY29tcGFueSBwb2xpY2llcyBhbmQgcHJvY2VkdXJlcy4nLFxuICogICBlbnZpcm9ubWVudDogJ3Byb2QnLFxuICogICBkYXRhU291cmNlU3luY01pbnV0ZXM6IDMwLFxuICogICBjaHVua2luZ1N0cmF0ZWd5OiB7XG4gKiAgICAgbWF4VG9rZW5zOiAxMDAwLFxuICogICAgIG92ZXJsYXBQZXJjZW50YWdlOiAxNVxuICogICB9LFxuICogICBlbWJlZGRpbmdNb2RlbDogYmVkcm9jay5CZWRyb2NrRm91bmRhdGlvbk1vZGVsLlRJVEFOX0VNQkVEX1RFWFRfVjJfMTAyNCxcbiAqICAgZW5hYmxlSW5nZXN0aW9uQWxhcm1zOiB0cnVlLFxuICogICBpbmdlc3Rpb25UaW1lb3V0TWludXRlczogMTIwXG4gKiB9KTtcbiAqIGBgYFxuICogXG4gKiAjIyMgRGlmZmVyZW50IENodW5raW5nIFN0cmF0ZWdpZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIEZvciB0ZWNobmljYWwgZG9jdW1lbnRhdGlvbiB3aXRoIGxvbmdlciBjb250ZXh0XG4gKiBjb25zdCB0ZWNoRG9jc0tCID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHRoaXMsICdUZWNoRG9jc0tCJywge1xuICogICBuYW1lOiAndGVjaC1kb2NzJyxcbiAqICAgZGVzY3JpcHRpb246ICdUZWNobmljYWwgZG9jdW1lbnRhdGlvbiBrbm93bGVkZ2UgYmFzZScsXG4gKiAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlY2hEb2NzQnVja2V0LFxuICogICBkYXRhU291cmNlUHJlZml4ZXM6IFsnYXBpLWRvY3MvJywgJ2d1aWRlcy8nXSxcbiAqICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSBmb3IgdGVjaG5pY2FsIGRvY3VtZW50YXRpb24gYW5kIEFQSSByZWZlcmVuY2VzLicsXG4gKiAgIGNodW5raW5nU3RyYXRlZ3k6IHtcbiAqICAgICBtYXhUb2tlbnM6IDE1MDAsXG4gKiAgICAgb3ZlcmxhcFBlcmNlbnRhZ2U6IDI1XG4gKiAgIH1cbiAqIH0pO1xuICogXG4gKiAvLyBGb3IgRkFRLXN0eWxlIGNvbnRlbnQgd2l0aCBzaG9ydGVyIGNodW5rc1xuICogY29uc3QgZmFxS0IgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2UodGhpcywgJ0ZBUUtCJywge1xuICogICBuYW1lOiAnZmFxLWtiJyxcbiAqICAgZGVzY3JpcHRpb246ICdGcmVxdWVudGx5IGFza2VkIHF1ZXN0aW9ucyBrbm93bGVkZ2UgYmFzZScsXG4gKiAgIGRhdGFTb3VyY2VCdWNrZXQ6IGZhcUJ1Y2tldCxcbiAqICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2ZhcS8nXSxcbiAqICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSBmb3IgYW5zd2VyaW5nIGZyZXF1ZW50bHkgYXNrZWQgcXVlc3Rpb25zLicsXG4gKiAgIGNodW5raW5nU3RyYXRlZ3k6IHtcbiAqICAgICBtYXhUb2tlbnM6IDMwMCxcbiAqICAgICBvdmVybGFwUGVyY2VudGFnZTogMTBcbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqIFxuICogIyMgVHJvdWJsZXNob290aW5nXG4gKiBcbiAqICMjIyBDb21tb24gSXNzdWVzXG4gKiBcbiAqICoqSW5nZXN0aW9uIEpvYnMgRmFpbGluZyoqXG4gKiAtIENoZWNrIFMzIGJ1Y2tldCBwZXJtaXNzaW9ucyBhbmQgZW5zdXJlIHRoZSBrbm93bGVkZ2UgYmFzZSBoYXMgcmVhZCBhY2Nlc3NcbiAqIC0gVmVyaWZ5IHRoYXQgdGhlIHNwZWNpZmllZCBTMyBwcmVmaXhlcyBleGlzdCBhbmQgY29udGFpbiBzdXBwb3J0ZWQgZmlsZSB0eXBlc1xuICogLSBSZXZpZXcgQ2xvdWRXYXRjaCBsb2dzIGZvciB0aGUgU3RlcCBGdW5jdGlvbnMgc3RhdGUgbWFjaGluZVxuICogLSBFbnN1cmUgdGhlIFMzIGJ1Y2tldCBpcyBpbiB0aGUgc2FtZSByZWdpb24gYXMgdGhlIGtub3dsZWRnZSBiYXNlXG4gKiBcbiAqICoqUG9vciBSZXRyaWV2YWwgUXVhbGl0eSoqXG4gKiAtIEFkanVzdCBjaHVua2luZyBzdHJhdGVneTogaW5jcmVhc2UgbWF4VG9rZW5zIGZvciBsb25nZXIgY29udGV4dCwgZGVjcmVhc2UgZm9yIG1vcmUgcHJlY2lzZSBtYXRjaGluZ1xuICogLSBJbmNyZWFzZSBvdmVybGFwUGVyY2VudGFnZSB0byBpbXByb3ZlIGNvbnRleHQgY29udGludWl0eSBiZXR3ZWVuIGNodW5rc1xuICogLSBDb25zaWRlciB1c2luZyBhIGRpZmZlcmVudCBlbWJlZGRpbmcgbW9kZWwgZm9yIHlvdXIgY29udGVudCB0eXBlXG4gKiAtIFJldmlldyB0aGUgcXVhbGl0eSBhbmQgc3RydWN0dXJlIG9mIHlvdXIgc291cmNlIGRvY3VtZW50c1xuICogXG4gKiAqKkhpZ2ggQ29zdHMqKlxuICogLSBSZWR1Y2Ugc3luYyBmcmVxdWVuY3kgKGRhdGFTb3VyY2VTeW5jTWludXRlcykgaWYgZG9jdW1lbnRzIGRvbid0IGNoYW5nZSBvZnRlblxuICogLSBVc2Ugc21hbGxlciBjaHVuayBzaXplcyB0byByZWR1Y2UgZW1iZWRkaW5nIGNvc3RzXG4gKiAtIENvbnNpZGVyIHVzaW5nIGVudmlyb25tZW50LXNwZWNpZmljIGNvbmZpZ3VyYXRpb25zIHRvIG9wdGltaXplIGZvciBjb3N0IGluIGRldi9zdGFnaW5nXG4gKiBcbiAqICoqU2xvdyBJbmdlc3Rpb24qKlxuICogLSBJbmNyZWFzZSBpbmdlc3Rpb25UaW1lb3V0TWludXRlcyBmb3IgbGFyZ2UgZG9jdW1lbnQgc2V0c1xuICogLSBDb25zaWRlciBicmVha2luZyBsYXJnZSBkb2N1bWVudCBzZXRzIGludG8gc21hbGxlciBiYXRjaGVzXG4gKiAtIE1vbml0b3IgQ2xvdWRXYXRjaCBtZXRyaWNzIHRvIGlkZW50aWZ5IGJvdHRsZW5lY2tzXG4gKiBcbiAqICMjIyBCZXN0IFByYWN0aWNlc1xuICogXG4gKiAxLiAqKkRvY3VtZW50IE9yZ2FuaXphdGlvbioqOiBTdHJ1Y3R1cmUgeW91ciBTMyBwcmVmaXhlcyBsb2dpY2FsbHkgdG8gbWFrZSBtYWludGVuYW5jZSBlYXNpZXJcbiAqIDIuICoqQ2h1bmtpbmcgU3RyYXRlZ3kqKjogU3RhcnQgd2l0aCBkZWZhdWx0cyBhbmQgYWRqdXN0IGJhc2VkIG9uIHJldHJpZXZhbCBxdWFsaXR5XG4gKiAzLiAqKk1vbml0b3JpbmcqKjogRW5hYmxlIGluZ2VzdGlvbiBhbGFybXMgaW4gcHJvZHVjdGlvbiBlbnZpcm9ubWVudHNcbiAqIDQuICoqVGVzdGluZyoqOiBUZXN0IHdpdGggYSBzbWFsbCBkb2N1bWVudCBzZXQgZmlyc3QgdG8gdmFsaWRhdGUgY29uZmlndXJhdGlvblxuICogNS4gKipTZWN1cml0eSoqOiBVc2UgbGVhc3QtcHJpdmlsZWdlIElBTSBwb2xpY2llcyBhbmQgZW5hYmxlIFMzIGJ1Y2tldCBlbmNyeXB0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBCZWRyb2NrS25vd2xlZGdlQmFzZSBleHRlbmRzIENvbnN0cnVjdCB7XG4gICAgLyoqIFRoZSB1bmRlcmx5aW5nIHZlY3RvciBrbm93bGVkZ2UgYmFzZSAqL1xuICAgIHB1YmxpYyByZWFkb25seSB2ZWN0b3JLYjogYmVkcm9jay5WZWN0b3JLbm93bGVkZ2VCYXNlO1xuICAgIFxuICAgIC8qKiBUaGUgUzMgZGF0YSBzb3VyY2UgZm9yIHRoZSBrbm93bGVkZ2UgYmFzZSAqL1xuICAgIHB1YmxpYyByZWFkb25seSBrYlMzRHM6IGJlZHJvY2suUzNEYXRhU291cmNlO1xuICAgIFxuICAgIC8qKiBUaGUga25vd2xlZGdlIGJhc2UgbmFtZSB1c2VkIGZvciByZXNvdXJjZSBpZGVudGlmaWNhdGlvbiAqL1xuICAgIHB1YmxpYyByZWFkb25seSBrbm93bGVkZ2VCYXNlTmFtZTogc3RyaW5nO1xuICAgIFxuICAgIC8qKiBBcHBsaWVkIGNvbmZpZ3VyYXRpb24gd2l0aCBkZWZhdWx0cyAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnOiBSZXF1aXJlZDxLbm93bGVkZ2VCYXNlUHJvcHM+O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEJlZHJvY2sgS25vd2xlZGdlIEJhc2VcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gc2NvcGUgLSBUaGUgc2NvcGUgaW4gd2hpY2ggdG8gZGVmaW5lIHRoaXMgY29uc3RydWN0XG4gICAgICogQHBhcmFtIGlkIC0gVGhlIHNjb3BlZCBjb25zdHJ1Y3QgSUQuIE11c3QgYmUgdW5pcXVlIGFtb25nc3Qgc2libGluZ3MgaW4gdGhlIHNhbWUgc2NvcGVcbiAgICAgKiBAcGFyYW0gcHJvcHMgLSBDb25maWd1cmF0aW9uIHByb3BlcnRpZXMgZm9yIHRoZSBrbm93bGVkZ2UgYmFzZVxuICAgICAqIFxuICAgICAqIEB0aHJvd3Mge0NvbnN0cnVjdEVycm9yfSBXaGVuIHZhbGlkYXRpb24gZmFpbHMgb3IgcmVxdWlyZWQgcmVzb3VyY2VzIGNhbm5vdCBiZSBjcmVhdGVkXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSBpbnB1dCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2VQcm9wc1ZhbGlkYXRvcigpO1xuICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZShwcm9wcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghdmFsaWRhdGlvblJlc3VsdC5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgVmFsaWRhdGlvblV0aWxzLnRocm93SWZJbnZhbGlkKHZhbGlkYXRpb25SZXN1bHQsICdCZWRyb2NrS25vd2xlZGdlQmFzZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb2cgd2FybmluZ3MgaWYgYW55XG4gICAgICAgICAgICBpZiAodmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQmVkcm9ja0tub3dsZWRnZUJhc2VdIFZhbGlkYXRpb24gd2FybmluZ3MgZm9yIGtub3dsZWRnZSBiYXNlICcke3Byb3BzLm5hbWV9JzpgLCB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGlvblJlc3VsdC5zdWdnZXN0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtCZWRyb2NrS25vd2xlZGdlQmFzZV0gU3VnZ2VzdGlvbnM6YCwgdmFsaWRhdGlvblJlc3VsdC5zdWdnZXN0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gdmFsaWRhdGUgQmVkcm9ja0tub3dsZWRnZUJhc2UgcHJvcGVydGllczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQXBwbHkgZGVmYXVsdHMgdG8gY29uZmlndXJhdGlvblxuICAgICAgICAgICAgdGhpcy5jb25maWcgPSB0aGlzLmFwcGx5RGVmYXVsdHMocHJvcHMpO1xuICAgICAgICAgICAgdGhpcy5rbm93bGVkZ2VCYXNlTmFtZSA9IHRoaXMuY29uZmlnLm5hbWU7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgdmVjdG9yIGtub3dsZWRnZSBiYXNlXG4gICAgICAgICAgICB0aGlzLnZlY3RvcktiID0gdGhpcy5jcmVhdGVWZWN0b3JLbm93bGVkZ2VCYXNlKCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBTMyBkYXRhIHNvdXJjZSBhbmQgaW5nZXN0aW9uIHBpcGVsaW5lXG4gICAgICAgICAgICB0aGlzLmtiUzNEcyA9IHRoaXMuY3JlYXRlUzNEYXRhU291cmNlKCk7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUluZ2VzdGlvblBpcGVsaW5lKCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBDbG91ZEZvcm1hdGlvbiBvdXRwdXRzXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIEJlZHJvY2tLbm93bGVkZ2VCYXNlIHJlc291cmNlczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBseSBkZWZhdWx0IHZhbHVlcyB0byB0aGUgY29uZmlndXJhdGlvblxuICAgICAqIFxuICAgICAqIE1lcmdlcyB1c2VyLXByb3ZpZGVkIHByb3BlcnRpZXMgd2l0aCBlbnZpcm9ubWVudC1zcGVjaWZpYyBkZWZhdWx0c1xuICAgICAqIGFuZCBjb25zdHJ1Y3Qtc3BlY2lmaWMgZGVmYXVsdHMgdG8gY3JlYXRlIGEgY29tcGxldGUgY29uZmlndXJhdGlvbi5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gcHJvcHMgLSBVc2VyLXByb3ZpZGVkIHByb3BlcnRpZXNcbiAgICAgKiBAcmV0dXJucyBDb21wbGV0ZSBjb25maWd1cmF0aW9uIHdpdGggYWxsIGRlZmF1bHRzIGFwcGxpZWRcbiAgICAgKi9cbiAgICBwcml2YXRlIGFwcGx5RGVmYXVsdHMocHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcyk6IFJlcXVpcmVkPEtub3dsZWRnZUJhc2VQcm9wcz4ge1xuICAgICAgICBjb25zdCBiYXNlRGVmYXVsdHMgPSBDb25maWdEZWZhdWx0cy5hcHBseUJhc2VEZWZhdWx0cyhwcm9wcyk7XG4gICAgICAgIGNvbnN0IGVudmlyb25tZW50ID0gYmFzZURlZmF1bHRzLmVudmlyb25tZW50O1xuICAgICAgICBjb25zdCBlbnZEZWZhdWx0cyA9IENvbmZpZ0RlZmF1bHRzLmdldEVudmlyb25tZW50RGVmYXVsdHMoZW52aXJvbm1lbnQpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmJhc2VEZWZhdWx0cyxcbiAgICAgICAgICAgIG5hbWU6IHByb3BzLm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogcHJvcHMuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiBwcm9wcy5kYXRhU291cmNlQnVja2V0LFxuICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBwcm9wcy5kYXRhU291cmNlUHJlZml4ZXMsXG4gICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiBwcm9wcy5rbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zLFxuICAgICAgICAgICAgZGF0YVNvdXJjZVN5bmNNaW51dGVzOiBwcm9wcy5kYXRhU291cmNlU3luY01pbnV0ZXMgfHwgQkVEUk9DS19LTk9XTEVER0VfQkFTRV9ERUZBVUxUUy5kYXRhU291cmNlU3luY01pbnV0ZXMsXG4gICAgICAgICAgICBrbm93bGVkZ2VCYXNlUHJvcHNPdmVycmlkZTogcHJvcHMua25vd2xlZGdlQmFzZVByb3BzT3ZlcnJpZGUgfHwge30sXG4gICAgICAgICAgICBjaHVua2luZ1N0cmF0ZWd5OiB7XG4gICAgICAgICAgICAgICAgbWF4VG9rZW5zOiBwcm9wcy5jaHVua2luZ1N0cmF0ZWd5Py5tYXhUb2tlbnMgPz8gQkVEUk9DS19LTk9XTEVER0VfQkFTRV9ERUZBVUxUUy5jaHVua2luZ1N0cmF0ZWd5Lm1heFRva2VucyxcbiAgICAgICAgICAgICAgICBvdmVybGFwUGVyY2VudGFnZTogcHJvcHMuY2h1bmtpbmdTdHJhdGVneT8ub3ZlcmxhcFBlcmNlbnRhZ2UgPz8gQkVEUk9DS19LTk9XTEVER0VfQkFTRV9ERUZBVUxUUy5jaHVua2luZ1N0cmF0ZWd5Lm92ZXJsYXBQZXJjZW50YWdlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVtYmVkZGluZ01vZGVsOiBwcm9wcy5lbWJlZGRpbmdNb2RlbCB8fCBiZWRyb2NrLkJlZHJvY2tGb3VuZGF0aW9uTW9kZWwuVElUQU5fRU1CRURfVEVYVF9WMl81MTIsXG4gICAgICAgICAgICBlbmFibGVJbmdlc3Rpb25BbGFybXM6IHByb3BzLmVuYWJsZUluZ2VzdGlvbkFsYXJtcyAhPT0gdW5kZWZpbmVkID8gcHJvcHMuZW5hYmxlSW5nZXN0aW9uQWxhcm1zIDogZW52RGVmYXVsdHMubW9uaXRvcmluZy5lbmFibGVBbGFybXMgfHwgZmFsc2UsXG4gICAgICAgICAgICBpbmdlc3Rpb25UaW1lb3V0TWludXRlczogcHJvcHMuaW5nZXN0aW9uVGltZW91dE1pbnV0ZXMgfHwgNjAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSB2ZWN0b3Iga25vd2xlZGdlIGJhc2Ugd2l0aCBjb25maWd1cmVkIGVtYmVkZGluZyBtb2RlbFxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIFRoZSBjcmVhdGVkIFZlY3Rvcktub3dsZWRnZUJhc2VcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZVZlY3Rvcktub3dsZWRnZUJhc2UoKTogYmVkcm9jay5WZWN0b3JLbm93bGVkZ2VCYXNlIHtcbiAgICAgICAgY29uc3QgYmFzZVByb3BzOiBiZWRyb2NrLlZlY3Rvcktub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgIGVtYmVkZGluZ3NNb2RlbDogdGhpcy5jb25maWcuZW1iZWRkaW5nTW9kZWwsXG4gICAgICAgICAgICBpbnN0cnVjdGlvbjogdGhpcy5jb25maWcua25vd2xlZGdlQmFzZUluc3RydWN0aW9ucyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB0aGlzLmNvbmZpZy5kZXNjcmlwdGlvbixcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIE1lcmdlIHdpdGggb3ZlcnJpZGVzLCBidXQgcHJlc2VydmUgdGhlIGVtYmVkZGluZyBtb2RlbCBmcm9tIGNvbmZpZ1xuICAgICAgICBjb25zdCBrYlByb3BzOiBiZWRyb2NrLlZlY3Rvcktub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgIC4uLmJhc2VQcm9wcyxcbiAgICAgICAgICAgIC4uLnRoaXMuY29uZmlnLmtub3dsZWRnZUJhc2VQcm9wc092ZXJyaWRlLFxuICAgICAgICAgICAgLy8gRW5zdXJlIGVtYmVkZGluZyBtb2RlbCBmcm9tIGNvbmZpZyB0YWtlcyBwcmVjZWRlbmNlXG4gICAgICAgICAgICBlbWJlZGRpbmdzTW9kZWw6IHRoaXMuY29uZmlnLmVtYmVkZGluZ01vZGVsLFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBiZWRyb2NrLlZlY3Rvcktub3dsZWRnZUJhc2UodGhpcywgdGhpcy5jb25maWcubmFtZSwga2JQcm9wcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIFMzIGRhdGEgc291cmNlIHdpdGggY29uZmlndXJlZCBjaHVua2luZyBzdHJhdGVneVxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIFRoZSBjcmVhdGVkIFMzRGF0YVNvdXJjZVxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlUzNEYXRhU291cmNlKCk6IGJlZHJvY2suUzNEYXRhU291cmNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBiZWRyb2NrLlMzRGF0YVNvdXJjZSh0aGlzLCAna2JTM0RhdGFTb3VyY2UnLCB7XG4gICAgICAgICAgICBidWNrZXQ6IHRoaXMuY29uZmlnLmRhdGFTb3VyY2VCdWNrZXQsXG4gICAgICAgICAgICBrbm93bGVkZ2VCYXNlOiB0aGlzLnZlY3RvcktiLFxuICAgICAgICAgICAgZGF0YVNvdXJjZU5hbWU6IHRoaXMuY29uZmlnLm5hbWUsXG4gICAgICAgICAgICBpbmNsdXNpb25QcmVmaXhlczogdGhpcy5jb25maWcuZGF0YVNvdXJjZVByZWZpeGVzLFxuICAgICAgICAgICAgY2h1bmtpbmdTdHJhdGVneTogYmVkcm9jay5DaHVua2luZ1N0cmF0ZWd5LmZpeGVkU2l6ZSh7XG4gICAgICAgICAgICAgICAgbWF4VG9rZW5zOiB0aGlzLmNvbmZpZy5jaHVua2luZ1N0cmF0ZWd5Lm1heFRva2VucyEsXG4gICAgICAgICAgICAgICAgb3ZlcmxhcFBlcmNlbnRhZ2U6IHRoaXMuY29uZmlnLmNodW5raW5nU3RyYXRlZ3kub3ZlcmxhcFBlcmNlbnRhZ2UhLFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhdXRvbWF0ZWQgaW5nZXN0aW9uIHBpcGVsaW5lIHdpdGggU3RlcCBGdW5jdGlvbnMgYW5kIEV2ZW50QnJpZGdlXG4gICAgICogXG4gICAgICogU2V0cyB1cCBhIHJvYnVzdCBpbmdlc3Rpb24gcGlwZWxpbmUgd2l0aDpcbiAgICAgKiAtIFJldHJ5IGxvZ2ljIGZvciBmYWlsZWQgaW5nZXN0aW9uIGpvYnNcbiAgICAgKiAtIEVycm9yIGhhbmRsaW5nIGFuZCBkZWFkIGxldHRlciBxdWV1ZXNcbiAgICAgKiAtIENsb3VkV2F0Y2ggYWxhcm1zIGZvciBtb25pdG9yaW5nXG4gICAgICogLSBTY2hlZHVsZWQgZXhlY3V0aW9uIGF0IGNvbmZpZ3VyZWQgaW50ZXJ2YWxzXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVJbmdlc3Rpb25QaXBlbGluZSgpOiB2b2lkIHtcbiAgICAgICAgLy8gQ3JlYXRlIElBTSByb2xlIGZvciB0aGUgU3RlcCBGdW5jdGlvbnMgc3RhdGUgbWFjaGluZVxuICAgICAgICBjb25zdCBpbmdlc3Rpb25Sb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdJbmdlc3Rpb25Sb2xlJywge1xuICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ3N0YXRlcy5hbWF6b25hd3MuY29tJyksXG4gICAgICAgICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICAgICAgICAgICdJbmdlc3Rpb25Qb2xpY3knOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2s6U3RhcnRJbmdlc3Rpb25Kb2InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYmVkcm9jazpHZXRJbmdlc3Rpb25Kb2InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYmVkcm9jazpMaXN0SW5nZXN0aW9uSm9icydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogW3RoaXMudmVjdG9yS2Iua25vd2xlZGdlQmFzZUFybl1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIFN0ZXAgRnVuY3Rpb25zIHN0YXRlIG1hY2hpbmUgd2l0aCBlcnJvciBoYW5kbGluZyBhbmQgcmV0cnkgbG9naWNcbiAgICAgICAgY29uc3Qgc3RhcnRJbmdlc3Rpb25UYXNrID0gbmV3IHRhc2tzLkNhbGxBd3NTZXJ2aWNlKHRoaXMsICdTdGFydEluZ2VzdGlvbkpvYicsIHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3N0YXJ0SW5nZXN0aW9uSm9iJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdiZWRyb2NrYWdlbnQnLFxuICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgIFwiS25vd2xlZGdlQmFzZUlkXCI6IHRoaXMudmVjdG9yS2Iua25vd2xlZGdlQmFzZUlkLFxuICAgICAgICAgICAgICAgIFwiRGF0YVNvdXJjZUlkXCI6IHRoaXMua2JTM0RzLmRhdGFTb3VyY2VJZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlhbVJlc291cmNlczogW1xuICAgICAgICAgICAgICAgIHRoaXMudmVjdG9yS2Iua25vd2xlZGdlQmFzZUFybiwgXG4gICAgICAgICAgICAgICAgdGhpcy5rYlMzRHMuYnVja2V0LmJ1Y2tldEFybixcbiAgICAgICAgICAgICAgICB0aGlzLmtiUzNEcy5idWNrZXQuYnVja2V0QXJuICsgJy8qJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXN1bHRQYXRoOiAnJC5pbmdlc3Rpb25Kb2InXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFkZCByZXRyeSBsb2dpYyBmb3IgdHJhbnNpZW50IGZhaWx1cmVzXG4gICAgICAgIHN0YXJ0SW5nZXN0aW9uVGFzay5hZGRSZXRyeSh7XG4gICAgICAgICAgICBlcnJvcnM6IFsnU3RhdGVzLlRhc2tGYWlsZWQnLCAnU3RhdGVzLlRpbWVvdXQnXSxcbiAgICAgICAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICAgICAgICBtYXhBdHRlbXB0czogMyxcbiAgICAgICAgICAgIGJhY2tvZmZSYXRlOiAyLjBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWRkIGVycm9yIGhhbmRsaW5nIGZvciBwZXJtYW5lbnQgZmFpbHVyZXNcbiAgICAgICAgY29uc3QgZmFpbHVyZVN0YXRlID0gbmV3IHNmbi5GYWlsKHRoaXMsICdJbmdlc3Rpb25GYWlsZWQnLCB7XG4gICAgICAgICAgICBjb21tZW50OiAnS25vd2xlZGdlIGJhc2UgaW5nZXN0aW9uIGpvYiBmYWlsZWQgYWZ0ZXIgcmV0cmllcydcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc3RhcnRJbmdlc3Rpb25UYXNrLmFkZENhdGNoKGZhaWx1cmVTdGF0ZSwge1xuICAgICAgICAgICAgZXJyb3JzOiBbJ1N0YXRlcy5BTEwnXSxcbiAgICAgICAgICAgIHJlc3VsdFBhdGg6ICckLmVycm9yJ1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgc3VjY2VzcyBzdGF0ZVxuICAgICAgICBjb25zdCBzdWNjZXNzU3RhdGUgPSBuZXcgc2ZuLlN1Y2NlZWQodGhpcywgJ0luZ2VzdGlvblN1Y2NlZWRlZCcsIHtcbiAgICAgICAgICAgIGNvbW1lbnQ6ICdLbm93bGVkZ2UgYmFzZSBpbmdlc3Rpb24gam9iIHN0YXJ0ZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDaGFpbiB0aGUgc3RhdGVzIHRvZ2V0aGVyXG4gICAgICAgIGNvbnN0IGRlZmluaXRpb24gPSBzdGFydEluZ2VzdGlvblRhc2submV4dChzdWNjZXNzU3RhdGUpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc3RhdGUgbWFjaGluZVxuICAgICAgICBjb25zdCBzdGF0ZU1hY2hpbmUgPSBuZXcgc2ZuLlN0YXRlTWFjaGluZSh0aGlzLCAnU3RhcnRJbmdlc3Rpb25Kb2JTdGF0ZU1hY2hpbmUnLCB7XG4gICAgICAgICAgICByb2xlOiBpbmdlc3Rpb25Sb2xlLFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXModGhpcy5jb25maWcuaW5nZXN0aW9uVGltZW91dE1pbnV0ZXMpLFxuICAgICAgICAgICAgZGVmaW5pdGlvbkJvZHk6IHNmbi5EZWZpbml0aW9uQm9keS5mcm9tQ2hhaW5hYmxlKGRlZmluaXRpb24pLFxuICAgICAgICAgICAgbG9nczoge1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiBuZXcgY2RrLmF3c19sb2dzLkxvZ0dyb3VwKHRoaXMsICdJbmdlc3Rpb25TdGF0ZU1hY2hpbmVMb2dHcm91cCcsIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0ZW50aW9uOiBDb25maWdEZWZhdWx0cy5nZXRMb2dSZXRlbnRpb24odGhpcy5jb25maWcuZW52aXJvbm1lbnQpLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmFsUG9saWN5OiBDb25maWdEZWZhdWx0cy5nZXRSZW1vdmFsUG9saWN5KHRoaXMuY29uZmlnLmVudmlyb25tZW50KSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBsZXZlbDogc2ZuLkxvZ0xldmVsLkFMTCxcbiAgICAgICAgICAgICAgICBpbmNsdWRlRXhlY3V0aW9uRGF0YTogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgRXZlbnRCcmlkZ2UgcnVsZSBmb3Igc2NoZWR1bGVkIGluZ2VzdGlvblxuICAgICAgICBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ1MzRGF0YVNvdXJjZUluZ2VzdGlvblN5bmMnLCB7XG4gICAgICAgICAgICBzY2hlZHVsZTogY2RrLmF3c19ldmVudHMuU2NoZWR1bGUucmF0ZShjZGsuRHVyYXRpb24ubWludXRlcyh0aGlzLmNvbmZpZy5kYXRhU291cmNlU3luY01pbnV0ZXMpKSxcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICB0YXJnZXRzOiBbbmV3IHRhcmdldHMuU2ZuU3RhdGVNYWNoaW5lKHN0YXRlTWFjaGluZSldXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIGFsYXJtcyBpZiBlbmFibGVkXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5lbmFibGVJbmdlc3Rpb25BbGFybXMpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlSW5nZXN0aW9uQWxhcm1zKHN0YXRlTWFjaGluZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgQ2xvdWRXYXRjaCBhbGFybXMgZm9yIG1vbml0b3JpbmcgaW5nZXN0aW9uIHBpcGVsaW5lIGhlYWx0aFxuICAgICAqIFxuICAgICAqIENyZWF0ZXMgdGhyZWUgdHlwZXMgb2YgYWxhcm1zOlxuICAgICAqIDEuIEZhaWx1cmUgYWxhcm0gLSBUcmlnZ2VycyB3aGVuIGluZ2VzdGlvbiBqb2JzIGZhaWxcbiAgICAgKiAyLiBUaW1lb3V0IGFsYXJtIC0gVHJpZ2dlcnMgd2hlbiBpbmdlc3Rpb24gam9icyB0aW1lb3V0XG4gICAgICogMy4gRHVyYXRpb24gYWxhcm0gLSBXYXJucyB3aGVuIGpvYnMgdGFrZSBsb25nZXIgdGhhbiBleHBlY3RlZFxuICAgICAqIFxuICAgICAqIFRoZXNlIGFsYXJtcyBoZWxwIG1vbml0b3IgdGhlIGhlYWx0aCBvZiB0aGUga25vd2xlZGdlIGJhc2UgaW5nZXN0aW9uXG4gICAgICogcHJvY2VzcyBhbmQgY2FuIGJlIGludGVncmF0ZWQgd2l0aCBTTlMgdG9waWNzIGZvciBub3RpZmljYXRpb25zLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBzdGF0ZU1hY2hpbmUgLSBUaGUgU3RlcCBGdW5jdGlvbnMgc3RhdGUgbWFjaGluZSB0byBtb25pdG9yXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVJbmdlc3Rpb25BbGFybXMoc3RhdGVNYWNoaW5lOiBzZm4uU3RhdGVNYWNoaW5lKTogdm9pZCB7XG4gICAgICAgIC8vIEFsYXJtIGZvciBmYWlsZWQgZXhlY3V0aW9uc1xuICAgICAgICBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdJbmdlc3Rpb25GYWlsdXJlQWxhcm0nLCB7XG4gICAgICAgICAgICBhbGFybU5hbWU6IGAke3RoaXMuY29uZmlnLm5hbWV9LWluZ2VzdGlvbi1mYWlsdXJlc2AsXG4gICAgICAgICAgICBhbGFybURlc2NyaXB0aW9uOiBgS25vd2xlZGdlIGJhc2UgJHt0aGlzLmNvbmZpZy5uYW1lfSBpbmdlc3Rpb24gam9iIGZhaWx1cmVzYCxcbiAgICAgICAgICAgIG1ldHJpYzogc3RhdGVNYWNoaW5lLm1ldHJpY0ZhaWxlZCh7XG4gICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHRocmVzaG9sZDogMSxcbiAgICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICAgICAgdHJlYXRNaXNzaW5nRGF0YTogY2RrLmF3c19jbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElOR1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGFybSBmb3IgZXhlY3V0aW9uIHRpbWVvdXRzXG4gICAgICAgIG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0luZ2VzdGlvblRpbWVvdXRBbGFybScsIHtcbiAgICAgICAgICAgIGFsYXJtTmFtZTogYCR7dGhpcy5jb25maWcubmFtZX0taW5nZXN0aW9uLXRpbWVvdXRzYCxcbiAgICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246IGBLbm93bGVkZ2UgYmFzZSAke3RoaXMuY29uZmlnLm5hbWV9IGluZ2VzdGlvbiBqb2IgdGltZW91dHNgLFxuICAgICAgICAgICAgbWV0cmljOiBzdGF0ZU1hY2hpbmUubWV0cmljVGltZWRPdXQoe1xuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJ1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNkay5hd3NfY2xvdWR3YXRjaC5UcmVhdE1pc3NpbmdEYXRhLk5PVF9CUkVBQ0hJTkdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWxhcm0gZm9yIGV4ZWN1dGlvbiBkdXJhdGlvbiAod2FybiBpZiB0YWtpbmcgdG9vIGxvbmcpXG4gICAgICAgIG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0luZ2VzdGlvbkR1cmF0aW9uQWxhcm0nLCB7XG4gICAgICAgICAgICBhbGFybU5hbWU6IGAke3RoaXMuY29uZmlnLm5hbWV9LWluZ2VzdGlvbi1kdXJhdGlvbmAsXG4gICAgICAgICAgICBhbGFybURlc2NyaXB0aW9uOiBgS25vd2xlZGdlIGJhc2UgJHt0aGlzLmNvbmZpZy5uYW1lfSBpbmdlc3Rpb24gam9iIGR1cmF0aW9uIHdhcm5pbmdgLFxuICAgICAgICAgICAgbWV0cmljOiBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL1N0YXRlcycsXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0V4ZWN1dGlvblRpbWUnLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICAgICAgU3RhdGVNYWNoaW5lQXJuOiBzdGF0ZU1hY2hpbmUuc3RhdGVNYWNoaW5lQXJuXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHRocmVzaG9sZDogdGhpcy5jb25maWcuaW5nZXN0aW9uVGltZW91dE1pbnV0ZXMgKiA2MCAqIDEwMDAgKiAwLjgsIC8vIDgwJSBvZiB0aW1lb3V0IGluIG1pbGxpc2Vjb25kc1xuICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjZGsuYXdzX2Nsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBDbG91ZEZvcm1hdGlvbiBvdXRwdXRzIGZvciBlYXN5IHJlZmVyZW5jZVxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc3RhY2tOYW1lID0gY2RrLlN0YWNrLm9mKHRoaXMpLnN0YWNrTmFtZTtcblxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnS25vd2xlZGdlQmFzZUlkJywge1xuICAgICAgICAgICAgdmFsdWU6IHRoaXMudmVjdG9yS2Iua25vd2xlZGdlQmFzZUlkLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJRCBvZiB0aGUgY3JlYXRlZCBrbm93bGVkZ2UgYmFzZScsXG4gICAgICAgICAgICBleHBvcnROYW1lOiBgJHtzdGFja05hbWV9LSR7dGhpcy5jb25maWcubmFtZX0tS25vd2xlZGdlQmFzZUlkYCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0tub3dsZWRnZUJhc2VBcm4nLCB7XG4gICAgICAgICAgICB2YWx1ZTogdGhpcy52ZWN0b3JLYi5rbm93bGVkZ2VCYXNlQXJuLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIGNyZWF0ZWQga25vd2xlZGdlIGJhc2UnLFxuICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7c3RhY2tOYW1lfS0ke3RoaXMuY29uZmlnLm5hbWV9LUtub3dsZWRnZUJhc2VBcm5gLFxuICAgICAgICB9KTtcblxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YVNvdXJjZUlkJywge1xuICAgICAgICAgICAgdmFsdWU6IHRoaXMua2JTM0RzLmRhdGFTb3VyY2VJZCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSUQgb2YgdGhlIFMzIGRhdGEgc291cmNlJyxcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6IGAke3N0YWNrTmFtZX0tJHt0aGlzLmNvbmZpZy5uYW1lfS1EYXRhU291cmNlSWRgLFxuICAgICAgICB9KTtcbiAgICB9XG59Il19