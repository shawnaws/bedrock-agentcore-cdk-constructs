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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1rbm93bGVkZ2UtYmFzZS1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29uc3RydWN0cy9iZWRyb2NrLWFnZW50Y29yZS9iZWRyb2NrLWtub3dsZWRnZS1iYXNlLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyQ0FBdUM7QUFFdkMseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCx3RUFBMEQ7QUFDMUQsbUVBQXFEO0FBQ3JELDJFQUE2RDtBQUM3RCx3RkFBZ0U7QUFLaEUsd0RBQXlFO0FBQ3pFLG9EQUF3RjtBQUV4Rjs7Ozs7R0FLRztBQUNILE1BQU0sa0NBQW1DLFNBQVEsMEJBQWlDO0lBQzlFOzs7OztPQUtHO0lBQ0gsUUFBUSxDQUFDLEtBQXlCO1FBQzlCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztRQUVwRixzQ0FBc0M7UUFDdEMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDYixNQUFNLGNBQWMsR0FBRyw0QkFBZSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxJQUFJ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QUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQjtZQUNyQyxXQUFXLEVBQUUsbUNBQW1DO1lBQ2hELFVBQVUsRUFBRSxHQUFHLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksbUJBQW1CO1NBQ2xFLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3BDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVk7WUFDL0IsV0FBVyxFQUFFLDBCQUEwQjtZQUN2QyxVQUFVLEVBQUUsR0FBRyxTQUFTLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLGVBQWU7U0FDOUQsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBeFVELG9EQXdVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBzZm4gZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMnO1xuaW1wb3J0ICogYXMgdGFza3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMtdGFza3MnO1xuaW1wb3J0IHsgYmVkcm9jayB9IGZyb20gJ0BjZGtsYWJzL2dlbmVyYXRpdmUtYWktY2RrLWNvbnN0cnVjdHMnO1xuaW1wb3J0IHsgXG4gICAgQmFzZUNvbnN0cnVjdFByb3BzLCBcbiAgICBWYWxpZGF0aW9uUmVzdWx0XG59IGZyb20gJy4uLy4uL2NvbW1vbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7IEJhc2VWYWxpZGF0b3IsIFZhbGlkYXRpb25VdGlscyB9IGZyb20gJy4uLy4uL2NvbW1vbi92YWxpZGF0aW9uJztcbmltcG9ydCB7IENvbmZpZ0RlZmF1bHRzLCBCRURST0NLX0tOT1dMRURHRV9CQVNFX0RFRkFVTFRTIH0gZnJvbSAnLi4vLi4vY29tbW9uL2RlZmF1bHRzJztcblxuLyoqXG4gKiBWYWxpZGF0b3IgZm9yIEJlZHJvY2sgS25vd2xlZGdlIEJhc2UgcHJvcGVydGllc1xuICogXG4gKiBWYWxpZGF0ZXMgYWxsIHJlcXVpcmVkIGFuZCBvcHRpb25hbCBwcm9wZXJ0aWVzIHRvIGVuc3VyZSB0aGV5IG1lZXRcbiAqIEFXUyBzZXJ2aWNlIHJlcXVpcmVtZW50cyBhbmQgYmVzdCBwcmFjdGljZXMgZm9yIGtub3dsZWRnZSBiYXNlIGNyZWF0aW9uLlxuICovXG5jbGFzcyBCZWRyb2NrS25vd2xlZGdlQmFzZVByb3BzVmFsaWRhdG9yIGV4dGVuZHMgQmFzZVZhbGlkYXRvcjxLbm93bGVkZ2VCYXNlUHJvcHM+IHtcbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZSB0aGUgcHJvcGVydGllcyBmb3IgQmVkcm9ja0tub3dsZWRnZUJhc2VcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gcHJvcHMgLSBUaGUgcHJvcGVydGllcyB0byB2YWxpZGF0ZVxuICAgICAqIEByZXR1cm5zIFZhbGlkYXRpb25SZXN1bHQgd2l0aCBlcnJvcnMsIHdhcm5pbmdzLCBhbmQgc3VnZ2VzdGlvbnNcbiAgICAgKi9cbiAgICB2YWxpZGF0ZShwcm9wczogS25vd2xlZGdlQmFzZVByb3BzKTogVmFsaWRhdGlvblJlc3VsdCB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkKHByb3BzLm5hbWUsICduYW1lJyk7XG4gICAgICAgIHRoaXMudmFsaWRhdGVSZXF1aXJlZChwcm9wcy5kZXNjcmlwdGlvbiwgJ2Rlc2NyaXB0aW9uJyk7XG4gICAgICAgIHRoaXMudmFsaWRhdGVSZXF1aXJlZChwcm9wcy5kYXRhU291cmNlQnVja2V0LCAnZGF0YVNvdXJjZUJ1Y2tldCcpO1xuICAgICAgICB0aGlzLnZhbGlkYXRlUmVxdWlyZWQocHJvcHMuZGF0YVNvdXJjZVByZWZpeGVzLCAnZGF0YVNvdXJjZVByZWZpeGVzJyk7XG4gICAgICAgIHRoaXMudmFsaWRhdGVSZXF1aXJlZChwcm9wcy5rbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zLCAna25vd2xlZGdlQmFzZUluc3RydWN0aW9ucycpO1xuXG4gICAgICAgIC8vIFZhbGlkYXRlIGtub3dsZWRnZSBiYXNlIG5hbWUgZm9ybWF0XG4gICAgICAgIGlmIChwcm9wcy5uYW1lKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lVmFsaWRhdGlvbiA9IFZhbGlkYXRpb25VdGlscy52YWxpZGF0ZUF3c1Jlc291cmNlTmFtZShwcm9wcy5uYW1lLCAnbmFtZScpO1xuICAgICAgICAgICAgaWYgKCFuYW1lVmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaCguLi5uYW1lVmFsaWRhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lVmFsaWRhdGlvbi5zdWdnZXN0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zLnB1c2goLi4ubmFtZVZhbGlkYXRpb24uc3VnZ2VzdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIGRlc2NyaXB0aW9uIGxlbmd0aFxuICAgICAgICBpZiAocHJvcHMuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChwcm9wcy5kZXNjcmlwdGlvbi5sZW5ndGggPCAxMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICdLbm93bGVkZ2UgYmFzZSBkZXNjcmlwdGlvbiBtdXN0IGJlIGF0IGxlYXN0IDEwIGNoYXJhY3RlcnMgbG9uZycsXG4gICAgICAgICAgICAgICAgICAgICdQbGVhc2UgcHJvdmlkZSBhIG1vcmUgZGV0YWlsZWQgZGVzY3JpcHRpb24gZm9yIHRoZSBrbm93bGVkZ2UgYmFzZSdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb3BzLmRlc2NyaXB0aW9uLmxlbmd0aCA+IDEwMDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnS25vd2xlZGdlIGJhc2UgZGVzY3JpcHRpb24gbXVzdCBiZSAxMDAwIGNoYXJhY3RlcnMgb3IgbGVzcycsXG4gICAgICAgICAgICAgICAgICAgICdQbGVhc2Ugc2hvcnRlbiB0aGUga25vd2xlZGdlIGJhc2UgZGVzY3JpcHRpb24gdG8gMTAwMCBjaGFyYWN0ZXJzIG9yIGxlc3MnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIGtub3dsZWRnZSBiYXNlIGluc3RydWN0aW9uc1xuICAgICAgICBpZiAocHJvcHMua25vd2xlZGdlQmFzZUluc3RydWN0aW9ucykge1xuICAgICAgICAgICAgaWYgKHByb3BzLmtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnMubGVuZ3RoIDwgMTApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnS25vd2xlZGdlIGJhc2UgaW5zdHJ1Y3Rpb25zIG11c3QgYmUgYXQgbGVhc3QgMTAgY2hhcmFjdGVycyBsb25nJyxcbiAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSBwcm92aWRlIG1vcmUgZGV0YWlsZWQgaW5zdHJ1Y3Rpb25zIGZvciB0aGUga25vd2xlZGdlIGJhc2UnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wcy5rbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zLmxlbmd0aCA+IDIwMDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnS25vd2xlZGdlIGJhc2UgaW5zdHJ1Y3Rpb25zIG11c3QgYmUgMjAwMCBjaGFyYWN0ZXJzIG9yIGxlc3MnLFxuICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIHNob3J0ZW4gdGhlIGtub3dsZWRnZSBiYXNlIGluc3RydWN0aW9ucyB0byAyMDAwIGNoYXJhY3RlcnMgb3IgbGVzcydcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgZGF0YSBzb3VyY2UgcHJlZml4ZXNcbiAgICAgICAgaWYgKHByb3BzLmRhdGFTb3VyY2VQcmVmaXhlcykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnZhbGlkYXRlTm9uRW1wdHlBcnJheShwcm9wcy5kYXRhU291cmNlUHJlZml4ZXMsICdkYXRhU291cmNlUHJlZml4ZXMnKSkge1xuICAgICAgICAgICAgICAgIC8vIEVycm9yIGFscmVhZHkgYWRkZWQgYnkgdmFsaWRhdGVOb25FbXB0eUFycmF5XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRlIGVhY2ggcHJlZml4XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcmVmaXggb2YgcHJvcHMuZGF0YVNvdXJjZVByZWZpeGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZpeFZhbGlkYXRpb24gPSBWYWxpZGF0aW9uVXRpbHMudmFsaWRhdGVTM1ByZWZpeChwcmVmaXgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXByZWZpeFZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaCguLi5wcmVmaXhWYWxpZGF0aW9uLmVycm9ycyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZWZpeFZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuaW5ncy5wdXNoKC4uLnByZWZpeFZhbGlkYXRpb24ud2FybmluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmVmaXhWYWxpZGF0aW9uLnN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zLnB1c2goLi4ucHJlZml4VmFsaWRhdGlvbi5zdWdnZXN0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBzeW5jIGludGVydmFsXG4gICAgICAgIGlmIChwcm9wcy5kYXRhU291cmNlU3luY01pbnV0ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZVJhbmdlKHByb3BzLmRhdGFTb3VyY2VTeW5jTWludXRlcywgMSwgMTQ0MCwgJ2RhdGFTb3VyY2VTeW5jTWludXRlcycpOyAvLyAxIG1pbnV0ZSB0byAyNCBob3Vyc1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgY2h1bmtpbmcgc3RyYXRlZ3kgaWYgcHJvdmlkZWRcbiAgICAgICAgaWYgKHByb3BzLmNodW5raW5nU3RyYXRlZ3kpIHtcbiAgICAgICAgICAgIGlmIChwcm9wcy5jaHVua2luZ1N0cmF0ZWd5Lm1heFRva2VucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0ZVJhbmdlKHByb3BzLmNodW5raW5nU3RyYXRlZ3kubWF4VG9rZW5zLCAxMDAsIDgxOTIsICdjaHVua2luZ1N0cmF0ZWd5Lm1heFRva2VucycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb3BzLmNodW5raW5nU3RyYXRlZ3kub3ZlcmxhcFBlcmNlbnRhZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGVSYW5nZShwcm9wcy5jaHVua2luZ1N0cmF0ZWd5Lm92ZXJsYXBQZXJjZW50YWdlLCAwLCA5OSwgJ2NodW5raW5nU3RyYXRlZ3kub3ZlcmxhcFBlcmNlbnRhZ2UnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVJlc3VsdCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciB0aGUgQmVkcm9jayBLbm93bGVkZ2UgQmFzZSBjb25zdHJ1Y3RcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLbm93bGVkZ2VCYXNlUHJvcHMgZXh0ZW5kcyBCYXNlQ29uc3RydWN0UHJvcHMge1xuICAgIC8qKiBcbiAgICAgKiBVbmlxdWUgbmFtZSBmb3IgdGhlIGtub3dsZWRnZSBiYXNlXG4gICAgICogTXVzdCBiZSBhbHBoYW51bWVyaWMgd2l0aCBoeXBoZW5zIGFuZCB1bmRlcnNjb3JlcyBvbmx5XG4gICAgICovXG4gICAgbmFtZTogc3RyaW5nO1xuICAgIFxuICAgIC8qKiBcbiAgICAgKiBEZXNjcmlwdGlvbiBvZiB0aGUga25vd2xlZGdlIGJhc2UgYW5kIGl0cyBwdXJwb3NlXG4gICAgICogU2hvdWxkIGJlIGJldHdlZW4gMTAtMTAwMCBjaGFyYWN0ZXJzXG4gICAgICovXG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBcbiAgICAvKiogXG4gICAgICogUzMgYnVja2V0IGNvbnRhaW5pbmcgdGhlIHNvdXJjZSBkYXRhIGZvciB0aGUga25vd2xlZGdlIGJhc2VcbiAgICAgKiBUaGUga25vd2xlZGdlIGJhc2Ugd2lsbCBoYXZlIHJlYWQgYWNjZXNzIHRvIHRoaXMgYnVja2V0XG4gICAgICovXG4gICAgZGF0YVNvdXJjZUJ1Y2tldDogczMuQnVja2V0O1xuICAgIFxuICAgIC8qKiBcbiAgICAgKiBTMyBwcmVmaXhlcyB0byBpbmNsdWRlIGluIHRoZSBrbm93bGVkZ2UgYmFzZVxuICAgICAqIEVhY2ggcHJlZml4IHNob3VsZCBlbmQgd2l0aCAnLycgZm9yIHByb3BlciBvcmdhbml6YXRpb25cbiAgICAgKi9cbiAgICBkYXRhU291cmNlUHJlZml4ZXM6IHN0cmluZ1tdO1xuICAgIFxuICAgIC8qKiBcbiAgICAgKiBTeW5jIGludGVydmFsIGluIG1pbnV0ZXMgZm9yIGF1dG9tYXRlZCBpbmdlc3Rpb25cbiAgICAgKiBAZGVmYXVsdCAxMCBtaW51dGVzXG4gICAgICovXG4gICAgZGF0YVNvdXJjZVN5bmNNaW51dGVzPzogbnVtYmVyO1xuICAgIFxuICAgIC8qKiBcbiAgICAgKiBJbnN0cnVjdGlvbnMgZm9yIGhvdyB0aGUga25vd2xlZGdlIGJhc2Ugc2hvdWxkIGJlIHVzZWRcbiAgICAgKiBTaG91bGQgYmUgYmV0d2VlbiAxMC0yMDAwIGNoYXJhY3RlcnNcbiAgICAgKi9cbiAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiBzdHJpbmc7XG4gICAgXG4gICAgLyoqIFxuICAgICAqIE92ZXJyaWRlIHByb3BlcnRpZXMgZm9yIHRoZSB1bmRlcmx5aW5nIFZlY3Rvcktub3dsZWRnZUJhc2VcbiAgICAgKiBVc2UgdGhpcyB0byBjdXN0b21pemUgYWR2YW5jZWQgc2V0dGluZ3MgKGVtYmVkZGluZyBtb2RlbCBpcyBoYW5kbGVkIHNlcGFyYXRlbHkpXG4gICAgICovXG4gICAga25vd2xlZGdlQmFzZVByb3BzT3ZlcnJpZGU/OiBQYXJ0aWFsPGJlZHJvY2suVmVjdG9yS25vd2xlZGdlQmFzZVByb3BzPjtcbiAgICBcbiAgICAvKipcbiAgICAgKiBDaHVua2luZyBzdHJhdGVneSBmb3IgZG9jdW1lbnQgcHJvY2Vzc2luZ1xuICAgICAqIEBkZWZhdWx0IHsgbWF4VG9rZW5zOiA1MDAsIG92ZXJsYXBQZXJjZW50YWdlOiAyMCB9XG4gICAgICovXG4gICAgY2h1bmtpbmdTdHJhdGVneT86IHtcbiAgICAgICAgbWF4VG9rZW5zPzogbnVtYmVyO1xuICAgICAgICBvdmVybGFwUGVyY2VudGFnZT86IG51bWJlcjtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIEVtYmVkZGluZyBtb2RlbCB0byB1c2UgZm9yIHRoZSBrbm93bGVkZ2UgYmFzZVxuICAgICAqIEBkZWZhdWx0IGJlZHJvY2suQmVkcm9ja0ZvdW5kYXRpb25Nb2RlbC5USVRBTl9FTUJFRF9URVhUX1YyXzUxMlxuICAgICAqL1xuICAgIGVtYmVkZGluZ01vZGVsPzogYmVkcm9jay5CZWRyb2NrRm91bmRhdGlvbk1vZGVsO1xuICAgIFxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBDbG91ZFdhdGNoIGFsYXJtcyBmb3IgaW5nZXN0aW9uIGpvYiBmYWlsdXJlc1xuICAgICAqIEBkZWZhdWx0IEJhc2VkIG9uIGVudmlyb25tZW50IChkZXY6IGZhbHNlLCBzdGFnaW5nL3Byb2Q6IHRydWUpXG4gICAgICovXG4gICAgZW5hYmxlSW5nZXN0aW9uQWxhcm1zPzogYm9vbGVhbjtcbiAgICBcbiAgICAvKipcbiAgICAgKiBDdXN0b20gdGltZW91dCBmb3IgaW5nZXN0aW9uIGpvYnMgaW4gbWludXRlc1xuICAgICAqIEBkZWZhdWx0IDYwIG1pbnV0ZXNcbiAgICAgKi9cbiAgICBpbmdlc3Rpb25UaW1lb3V0TWludXRlcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBCZWRyb2NrIEtub3dsZWRnZSBCYXNlIGNvbnN0cnVjdFxuICogXG4gKiBUaGlzIEwzIGNvbnN0cnVjdCBjcmVhdGVzIGEgcHJvZHVjdGlvbi1yZWFkeSBCZWRyb2NrIEtub3dsZWRnZSBCYXNlIHdpdGg6XG4gKiAtIFZlY3RvciBrbm93bGVkZ2UgYmFzZSB3aXRoIGNvbmZpZ3VyYWJsZSBlbWJlZGRpbmcgbW9kZWxzXG4gKiAtIFMzIGRhdGEgc291cmNlIGludGVncmF0aW9uIHdpdGggbXVsdGlwbGUgcHJlZml4IHN1cHBvcnRcbiAqIC0gQXV0b21hdGVkIGluZ2VzdGlvbiB3b3JrZmxvd3MgdXNpbmcgU3RlcCBGdW5jdGlvbnMgYW5kIEV2ZW50QnJpZGdlXG4gKiAtIENvbmZpZ3VyYWJsZSBjaHVua2luZyBzdHJhdGVnaWVzIGZvciBvcHRpbWFsIHJldHJpZXZhbFxuICogLSBDbG91ZFdhdGNoIG1vbml0b3JpbmcgYW5kIGFsZXJ0aW5nIGZvciBpbmdlc3Rpb24gam9ic1xuICogLSBFbnZpcm9ubWVudC1zcGVjaWZpYyBjb25maWd1cmF0aW9uIGRlZmF1bHRzXG4gKiAtIENvbXByZWhlbnNpdmUgaW5wdXQgdmFsaWRhdGlvbiBhbmQgZXJyb3IgaGFuZGxpbmdcbiAqIFxuICogIyMgVXNhZ2UgRXhhbXBsZXNcbiAqIFxuICogIyMjIEJhc2ljIEtub3dsZWRnZSBCYXNlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBrbm93bGVkZ2VCYXNlID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHRoaXMsICdCYXNpY0tCJywge1xuICogICBuYW1lOiAnbXkta25vd2xlZGdlLWJhc2UnLFxuICogICBkZXNjcmlwdGlvbjogJ0Jhc2ljIGtub3dsZWRnZSBiYXNlIGZvciBkb2N1bWVudCByZXRyaWV2YWwnLFxuICogICBkYXRhU291cmNlQnVja2V0OiBteUJ1Y2tldCxcbiAqICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAqICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgZG9jdW1lbnRzLidcbiAqIH0pO1xuICogYGBgXG4gKiBcbiAqICMjIyBBZHZhbmNlZCBDb25maWd1cmF0aW9uXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBrbm93bGVkZ2VCYXNlID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHRoaXMsICdBZHZhbmNlZEtCJywge1xuICogICBuYW1lOiAnY29tcGFueS1kb2NzLWtiJyxcbiAqICAgZGVzY3JpcHRpb246ICdLbm93bGVkZ2UgYmFzZSBjb250YWluaW5nIGNvbXBhbnkgZG9jdW1lbnRhdGlvbiBhbmQgcG9saWNpZXMnLFxuICogICBkYXRhU291cmNlQnVja2V0OiBteURvY3VtZW50c0J1Y2tldCxcbiAqICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nLCAncG9saWNpZXMvJywgJ3Byb2NlZHVyZXMvJ10sXG4gKiAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IGNvbXBhbnkgcG9saWNpZXMgYW5kIHByb2NlZHVyZXMuJyxcbiAqICAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcbiAqICAgZGF0YVNvdXJjZVN5bmNNaW51dGVzOiAzMCxcbiAqICAgY2h1bmtpbmdTdHJhdGVneToge1xuICogICAgIG1heFRva2VuczogMTAwMCxcbiAqICAgICBvdmVybGFwUGVyY2VudGFnZTogMTVcbiAqICAgfSxcbiAqICAgZW1iZWRkaW5nTW9kZWw6IGJlZHJvY2suQmVkcm9ja0ZvdW5kYXRpb25Nb2RlbC5USVRBTl9FTUJFRF9URVhUX1YyXzEwMjQsXG4gKiAgIGVuYWJsZUluZ2VzdGlvbkFsYXJtczogdHJ1ZSxcbiAqICAgaW5nZXN0aW9uVGltZW91dE1pbnV0ZXM6IDEyMFxuICogfSk7XG4gKiBgYGBcbiAqIFxuICogIyMjIERpZmZlcmVudCBDaHVua2luZyBTdHJhdGVnaWVzXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBGb3IgdGVjaG5pY2FsIGRvY3VtZW50YXRpb24gd2l0aCBsb25nZXIgY29udGV4dFxuICogY29uc3QgdGVjaERvY3NLQiA9IG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZSh0aGlzLCAnVGVjaERvY3NLQicsIHtcbiAqICAgbmFtZTogJ3RlY2gtZG9jcycsXG4gKiAgIGRlc2NyaXB0aW9uOiAnVGVjaG5pY2FsIGRvY3VtZW50YXRpb24ga25vd2xlZGdlIGJhc2UnLFxuICogICBkYXRhU291cmNlQnVja2V0OiB0ZWNoRG9jc0J1Y2tldCxcbiAqICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2FwaS1kb2NzLycsICdndWlkZXMvJ10sXG4gKiAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgZm9yIHRlY2huaWNhbCBkb2N1bWVudGF0aW9uIGFuZCBBUEkgcmVmZXJlbmNlcy4nLFxuICogICBjaHVua2luZ1N0cmF0ZWd5OiB7XG4gKiAgICAgbWF4VG9rZW5zOiAxNTAwLFxuICogICAgIG92ZXJsYXBQZXJjZW50YWdlOiAyNVxuICogICB9XG4gKiB9KTtcbiAqIFxuICogLy8gRm9yIEZBUS1zdHlsZSBjb250ZW50IHdpdGggc2hvcnRlciBjaHVua3NcbiAqIGNvbnN0IGZhcUtCID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHRoaXMsICdGQVFLQicsIHtcbiAqICAgbmFtZTogJ2ZhcS1rYicsXG4gKiAgIGRlc2NyaXB0aW9uOiAnRnJlcXVlbnRseSBhc2tlZCBxdWVzdGlvbnMga25vd2xlZGdlIGJhc2UnLFxuICogICBkYXRhU291cmNlQnVja2V0OiBmYXFCdWNrZXQsXG4gKiAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydmYXEvJ10sXG4gKiAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgZm9yIGFuc3dlcmluZyBmcmVxdWVudGx5IGFza2VkIHF1ZXN0aW9ucy4nLFxuICogICBjaHVua2luZ1N0cmF0ZWd5OiB7XG4gKiAgICAgbWF4VG9rZW5zOiAzMDAsXG4gKiAgICAgb3ZlcmxhcFBlcmNlbnRhZ2U6IDEwXG4gKiAgIH1cbiAqIH0pO1xuICogYGBgXG4gKiBcbiAqICMjIFRyb3VibGVzaG9vdGluZ1xuICogXG4gKiAjIyMgQ29tbW9uIElzc3Vlc1xuICogXG4gKiAqKkluZ2VzdGlvbiBKb2JzIEZhaWxpbmcqKlxuICogLSBDaGVjayBTMyBidWNrZXQgcGVybWlzc2lvbnMgYW5kIGVuc3VyZSB0aGUga25vd2xlZGdlIGJhc2UgaGFzIHJlYWQgYWNjZXNzXG4gKiAtIFZlcmlmeSB0aGF0IHRoZSBzcGVjaWZpZWQgUzMgcHJlZml4ZXMgZXhpc3QgYW5kIGNvbnRhaW4gc3VwcG9ydGVkIGZpbGUgdHlwZXNcbiAqIC0gUmV2aWV3IENsb3VkV2F0Y2ggbG9ncyBmb3IgdGhlIFN0ZXAgRnVuY3Rpb25zIHN0YXRlIG1hY2hpbmVcbiAqIC0gRW5zdXJlIHRoZSBTMyBidWNrZXQgaXMgaW4gdGhlIHNhbWUgcmVnaW9uIGFzIHRoZSBrbm93bGVkZ2UgYmFzZVxuICogXG4gKiAqKlBvb3IgUmV0cmlldmFsIFF1YWxpdHkqKlxuICogLSBBZGp1c3QgY2h1bmtpbmcgc3RyYXRlZ3k6IGluY3JlYXNlIG1heFRva2VucyBmb3IgbG9uZ2VyIGNvbnRleHQsIGRlY3JlYXNlIGZvciBtb3JlIHByZWNpc2UgbWF0Y2hpbmdcbiAqIC0gSW5jcmVhc2Ugb3ZlcmxhcFBlcmNlbnRhZ2UgdG8gaW1wcm92ZSBjb250ZXh0IGNvbnRpbnVpdHkgYmV0d2VlbiBjaHVua3NcbiAqIC0gQ29uc2lkZXIgdXNpbmcgYSBkaWZmZXJlbnQgZW1iZWRkaW5nIG1vZGVsIGZvciB5b3VyIGNvbnRlbnQgdHlwZVxuICogLSBSZXZpZXcgdGhlIHF1YWxpdHkgYW5kIHN0cnVjdHVyZSBvZiB5b3VyIHNvdXJjZSBkb2N1bWVudHNcbiAqIFxuICogKipIaWdoIENvc3RzKipcbiAqIC0gUmVkdWNlIHN5bmMgZnJlcXVlbmN5IChkYXRhU291cmNlU3luY01pbnV0ZXMpIGlmIGRvY3VtZW50cyBkb24ndCBjaGFuZ2Ugb2Z0ZW5cbiAqIC0gVXNlIHNtYWxsZXIgY2h1bmsgc2l6ZXMgdG8gcmVkdWNlIGVtYmVkZGluZyBjb3N0c1xuICogLSBDb25zaWRlciB1c2luZyBlbnZpcm9ubWVudC1zcGVjaWZpYyBjb25maWd1cmF0aW9ucyB0byBvcHRpbWl6ZSBmb3IgY29zdCBpbiBkZXYvc3RhZ2luZ1xuICogXG4gKiAqKlNsb3cgSW5nZXN0aW9uKipcbiAqIC0gSW5jcmVhc2UgaW5nZXN0aW9uVGltZW91dE1pbnV0ZXMgZm9yIGxhcmdlIGRvY3VtZW50IHNldHNcbiAqIC0gQ29uc2lkZXIgYnJlYWtpbmcgbGFyZ2UgZG9jdW1lbnQgc2V0cyBpbnRvIHNtYWxsZXIgYmF0Y2hlc1xuICogLSBNb25pdG9yIENsb3VkV2F0Y2ggbWV0cmljcyB0byBpZGVudGlmeSBib3R0bGVuZWNrc1xuICogXG4gKiAjIyMgQmVzdCBQcmFjdGljZXNcbiAqIFxuICogMS4gKipEb2N1bWVudCBPcmdhbml6YXRpb24qKjogU3RydWN0dXJlIHlvdXIgUzMgcHJlZml4ZXMgbG9naWNhbGx5IHRvIG1ha2UgbWFpbnRlbmFuY2UgZWFzaWVyXG4gKiAyLiAqKkNodW5raW5nIFN0cmF0ZWd5Kio6IFN0YXJ0IHdpdGggZGVmYXVsdHMgYW5kIGFkanVzdCBiYXNlZCBvbiByZXRyaWV2YWwgcXVhbGl0eVxuICogMy4gKipNb25pdG9yaW5nKio6IEVuYWJsZSBpbmdlc3Rpb24gYWxhcm1zIGluIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRzXG4gKiA0LiAqKlRlc3RpbmcqKjogVGVzdCB3aXRoIGEgc21hbGwgZG9jdW1lbnQgc2V0IGZpcnN0IHRvIHZhbGlkYXRlIGNvbmZpZ3VyYXRpb25cbiAqIDUuICoqU2VjdXJpdHkqKjogVXNlIGxlYXN0LXByaXZpbGVnZSBJQU0gcG9saWNpZXMgYW5kIGVuYWJsZSBTMyBidWNrZXQgZW5jcnlwdGlvblxuICovXG5leHBvcnQgY2xhc3MgQmVkcm9ja0tub3dsZWRnZUJhc2UgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAgIC8qKiBUaGUgdW5kZXJseWluZyB2ZWN0b3Iga25vd2xlZGdlIGJhc2UgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgdmVjdG9yS2I6IGJlZHJvY2suVmVjdG9yS25vd2xlZGdlQmFzZTtcbiAgICBcbiAgICAvKiogVGhlIFMzIGRhdGEgc291cmNlIGZvciB0aGUga25vd2xlZGdlIGJhc2UgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkga2JTM0RzOiBiZWRyb2NrLlMzRGF0YVNvdXJjZTtcbiAgICBcbiAgICAvKiogVGhlIGtub3dsZWRnZSBiYXNlIG5hbWUgdXNlZCBmb3IgcmVzb3VyY2UgaWRlbnRpZmljYXRpb24gKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkga25vd2xlZGdlQmFzZU5hbWU6IHN0cmluZztcbiAgICBcbiAgICAvKiogQXBwbGllZCBjb25maWd1cmF0aW9uIHdpdGggZGVmYXVsdHMgKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbmZpZzogUmVxdWlyZWQ8S25vd2xlZGdlQmFzZVByb3BzPjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBCZWRyb2NrIEtub3dsZWRnZSBCYXNlXG4gICAgICogXG4gICAgICogQHBhcmFtIHNjb3BlIC0gVGhlIHNjb3BlIGluIHdoaWNoIHRvIGRlZmluZSB0aGlzIGNvbnN0cnVjdFxuICAgICAqIEBwYXJhbSBpZCAtIFRoZSBzY29wZWQgY29uc3RydWN0IElELiBNdXN0IGJlIHVuaXF1ZSBhbW9uZ3N0IHNpYmxpbmdzIGluIHRoZSBzYW1lIHNjb3BlXG4gICAgICogQHBhcmFtIHByb3BzIC0gQ29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGUga25vd2xlZGdlIGJhc2VcbiAgICAgKiBcbiAgICAgKiBAdGhyb3dzIHtDb25zdHJ1Y3RFcnJvcn0gV2hlbiB2YWxpZGF0aW9uIGZhaWxzIG9yIHJlcXVpcmVkIHJlc291cmNlcyBjYW5ub3QgYmUgY3JlYXRlZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gVmFsaWRhdGUgaW5wdXQgcHJvcGVydGllc1xuICAgICAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlUHJvcHNWYWxpZGF0b3IoKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb25SZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUocHJvcHMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRpb25SZXN1bHQuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIFZhbGlkYXRpb25VdGlscy50aHJvd0lmSW52YWxpZCh2YWxpZGF0aW9uUmVzdWx0LCAnQmVkcm9ja0tub3dsZWRnZUJhc2UnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9nIHdhcm5pbmdzIGlmIGFueVxuICAgICAgICAgICAgaWYgKHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0JlZHJvY2tLbm93bGVkZ2VCYXNlXSBWYWxpZGF0aW9uIHdhcm5pbmdzIGZvciBrbm93bGVkZ2UgYmFzZSAnJHtwcm9wcy5uYW1lfSc6YCwgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncyk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRpb25SZXN1bHQuc3VnZ2VzdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQmVkcm9ja0tub3dsZWRnZUJhc2VdIFN1Z2dlc3Rpb25zOmAsIHZhbGlkYXRpb25SZXN1bHQuc3VnZ2VzdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHZhbGlkYXRlIEJlZHJvY2tLbm93bGVkZ2VCYXNlIHByb3BlcnRpZXM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEFwcGx5IGRlZmF1bHRzIHRvIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIHRoaXMuY29uZmlnID0gdGhpcy5hcHBseURlZmF1bHRzKHByb3BzKTtcbiAgICAgICAgICAgIHRoaXMua25vd2xlZGdlQmFzZU5hbWUgPSB0aGlzLmNvbmZpZy5uYW1lO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIHZlY3RvciBrbm93bGVkZ2UgYmFzZVxuICAgICAgICAgICAgdGhpcy52ZWN0b3JLYiA9IHRoaXMuY3JlYXRlVmVjdG9yS25vd2xlZGdlQmFzZSgpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgUzMgZGF0YSBzb3VyY2UgYW5kIGluZ2VzdGlvbiBwaXBlbGluZVxuICAgICAgICAgICAgdGhpcy5rYlMzRHMgPSB0aGlzLmNyZWF0ZVMzRGF0YVNvdXJjZSgpO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVJbmdlc3Rpb25QaXBlbGluZSgpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgQ2xvdWRGb3JtYXRpb24gb3V0cHV0c1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVPdXRwdXRzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgQmVkcm9ja0tub3dsZWRnZUJhc2UgcmVzb3VyY2VzOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFwcGx5IGRlZmF1bHQgdmFsdWVzIHRvIHRoZSBjb25maWd1cmF0aW9uXG4gICAgICogXG4gICAgICogTWVyZ2VzIHVzZXItcHJvdmlkZWQgcHJvcGVydGllcyB3aXRoIGVudmlyb25tZW50LXNwZWNpZmljIGRlZmF1bHRzXG4gICAgICogYW5kIGNvbnN0cnVjdC1zcGVjaWZpYyBkZWZhdWx0cyB0byBjcmVhdGUgYSBjb21wbGV0ZSBjb25maWd1cmF0aW9uLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBwcm9wcyAtIFVzZXItcHJvdmlkZWQgcHJvcGVydGllc1xuICAgICAqIEByZXR1cm5zIENvbXBsZXRlIGNvbmZpZ3VyYXRpb24gd2l0aCBhbGwgZGVmYXVsdHMgYXBwbGllZFxuICAgICAqL1xuICAgIHByaXZhdGUgYXBwbHlEZWZhdWx0cyhwcm9wczogS25vd2xlZGdlQmFzZVByb3BzKTogUmVxdWlyZWQ8S25vd2xlZGdlQmFzZVByb3BzPiB7XG4gICAgICAgIGNvbnN0IGJhc2VEZWZhdWx0cyA9IENvbmZpZ0RlZmF1bHRzLmFwcGx5QmFzZURlZmF1bHRzKHByb3BzKTtcbiAgICAgICAgY29uc3QgZW52aXJvbm1lbnQgPSBiYXNlRGVmYXVsdHMuZW52aXJvbm1lbnQ7XG4gICAgICAgIGNvbnN0IGVudkRlZmF1bHRzID0gQ29uZmlnRGVmYXVsdHMuZ2V0RW52aXJvbm1lbnREZWZhdWx0cyhlbnZpcm9ubWVudCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uYmFzZURlZmF1bHRzLFxuICAgICAgICAgICAgbmFtZTogcHJvcHMubmFtZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBwcm9wcy5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHByb3BzLmRhdGFTb3VyY2VCdWNrZXQsXG4gICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IHByb3BzLmRhdGFTb3VyY2VQcmVmaXhlcyxcbiAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6IHByb3BzLmtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnMsXG4gICAgICAgICAgICBkYXRhU291cmNlU3luY01pbnV0ZXM6IHByb3BzLmRhdGFTb3VyY2VTeW5jTWludXRlcyB8fCBCRURST0NLX0tOT1dMRURHRV9CQVNFX0RFRkFVTFRTLmRhdGFTb3VyY2VTeW5jTWludXRlcyxcbiAgICAgICAgICAgIGtub3dsZWRnZUJhc2VQcm9wc092ZXJyaWRlOiBwcm9wcy5rbm93bGVkZ2VCYXNlUHJvcHNPdmVycmlkZSB8fCB7fSxcbiAgICAgICAgICAgIGNodW5raW5nU3RyYXRlZ3k6IHtcbiAgICAgICAgICAgICAgICBtYXhUb2tlbnM6IHByb3BzLmNodW5raW5nU3RyYXRlZ3k/Lm1heFRva2VucyA/PyBCRURST0NLX0tOT1dMRURHRV9CQVNFX0RFRkFVTFRTLmNodW5raW5nU3RyYXRlZ3kubWF4VG9rZW5zLFxuICAgICAgICAgICAgICAgIG92ZXJsYXBQZXJjZW50YWdlOiBwcm9wcy5jaHVua2luZ1N0cmF0ZWd5Py5vdmVybGFwUGVyY2VudGFnZSA/PyBCRURST0NLX0tOT1dMRURHRV9CQVNFX0RFRkFVTFRTLmNodW5raW5nU3RyYXRlZ3kub3ZlcmxhcFBlcmNlbnRhZ2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW1iZWRkaW5nTW9kZWw6IHByb3BzLmVtYmVkZGluZ01vZGVsIHx8IGJlZHJvY2suQmVkcm9ja0ZvdW5kYXRpb25Nb2RlbC5USVRBTl9FTUJFRF9URVhUX1YyXzUxMixcbiAgICAgICAgICAgIGVuYWJsZUluZ2VzdGlvbkFsYXJtczogcHJvcHMuZW5hYmxlSW5nZXN0aW9uQWxhcm1zICE9PSB1bmRlZmluZWQgPyBwcm9wcy5lbmFibGVJbmdlc3Rpb25BbGFybXMgOiBlbnZEZWZhdWx0cy5tb25pdG9yaW5nLmVuYWJsZUFsYXJtcyB8fCBmYWxzZSxcbiAgICAgICAgICAgIGluZ2VzdGlvblRpbWVvdXRNaW51dGVzOiBwcm9wcy5pbmdlc3Rpb25UaW1lb3V0TWludXRlcyB8fCA2MCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgdGhlIHZlY3RvciBrbm93bGVkZ2UgYmFzZSB3aXRoIGNvbmZpZ3VyZWQgZW1iZWRkaW5nIG1vZGVsXG4gICAgICogXG4gICAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgVmVjdG9yS25vd2xlZGdlQmFzZVxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlVmVjdG9yS25vd2xlZGdlQmFzZSgpOiBiZWRyb2NrLlZlY3Rvcktub3dsZWRnZUJhc2Uge1xuICAgICAgICBjb25zdCBiYXNlUHJvcHM6IGJlZHJvY2suVmVjdG9yS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgZW1iZWRkaW5nc01vZGVsOiB0aGlzLmNvbmZpZy5lbWJlZGRpbmdNb2RlbCxcbiAgICAgICAgICAgIGluc3RydWN0aW9uOiB0aGlzLmNvbmZpZy5rbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IHRoaXMuY29uZmlnLmRlc2NyaXB0aW9uLFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8gTWVyZ2Ugd2l0aCBvdmVycmlkZXMsIGJ1dCBwcmVzZXJ2ZSB0aGUgZW1iZWRkaW5nIG1vZGVsIGZyb20gY29uZmlnXG4gICAgICAgIGNvbnN0IGtiUHJvcHM6IGJlZHJvY2suVmVjdG9yS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgLi4uYmFzZVByb3BzLFxuICAgICAgICAgICAgLi4udGhpcy5jb25maWcua25vd2xlZGdlQmFzZVByb3BzT3ZlcnJpZGUsXG4gICAgICAgICAgICAvLyBFbnN1cmUgZW1iZWRkaW5nIG1vZGVsIGZyb20gY29uZmlnIHRha2VzIHByZWNlZGVuY2VcbiAgICAgICAgICAgIGVtYmVkZGluZ3NNb2RlbDogdGhpcy5jb25maWcuZW1iZWRkaW5nTW9kZWwsXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3IGJlZHJvY2suVmVjdG9yS25vd2xlZGdlQmFzZSh0aGlzLCB0aGlzLmNvbmZpZy5uYW1lLCBrYlByb3BzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgUzMgZGF0YSBzb3VyY2Ugd2l0aCBjb25maWd1cmVkIGNodW5raW5nIHN0cmF0ZWd5XG4gICAgICogXG4gICAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgUzNEYXRhU291cmNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVTM0RhdGFTb3VyY2UoKTogYmVkcm9jay5TM0RhdGFTb3VyY2Uge1xuICAgICAgICByZXR1cm4gbmV3IGJlZHJvY2suUzNEYXRhU291cmNlKHRoaXMsICdrYlMzRGF0YVNvdXJjZScsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5jb25maWcuZGF0YVNvdXJjZUJ1Y2tldCxcbiAgICAgICAgICAgIGtub3dsZWRnZUJhc2U6IHRoaXMudmVjdG9yS2IsXG4gICAgICAgICAgICBkYXRhU291cmNlTmFtZTogdGhpcy5jb25maWcubmFtZSxcbiAgICAgICAgICAgIGluY2x1c2lvblByZWZpeGVzOiB0aGlzLmNvbmZpZy5kYXRhU291cmNlUHJlZml4ZXMsXG4gICAgICAgICAgICBjaHVua2luZ1N0cmF0ZWd5OiBiZWRyb2NrLkNodW5raW5nU3RyYXRlZ3kuZml4ZWRTaXplKHtcbiAgICAgICAgICAgICAgICBtYXhUb2tlbnM6IHRoaXMuY29uZmlnLmNodW5raW5nU3RyYXRlZ3kubWF4VG9rZW5zISxcbiAgICAgICAgICAgICAgICBvdmVybGFwUGVyY2VudGFnZTogdGhpcy5jb25maWcuY2h1bmtpbmdTdHJhdGVneS5vdmVybGFwUGVyY2VudGFnZSEsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGF1dG9tYXRlZCBpbmdlc3Rpb24gcGlwZWxpbmUgd2l0aCBTdGVwIEZ1bmN0aW9ucyBhbmQgRXZlbnRCcmlkZ2VcbiAgICAgKiBcbiAgICAgKiBTZXRzIHVwIGEgcm9idXN0IGluZ2VzdGlvbiBwaXBlbGluZSB3aXRoOlxuICAgICAqIC0gUmV0cnkgbG9naWMgZm9yIGZhaWxlZCBpbmdlc3Rpb24gam9ic1xuICAgICAqIC0gRXJyb3IgaGFuZGxpbmcgYW5kIGRlYWQgbGV0dGVyIHF1ZXVlc1xuICAgICAqIC0gQ2xvdWRXYXRjaCBhbGFybXMgZm9yIG1vbml0b3JpbmdcbiAgICAgKiAtIFNjaGVkdWxlZCBleGVjdXRpb24gYXQgY29uZmlndXJlZCBpbnRlcnZhbHNcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZUluZ2VzdGlvblBpcGVsaW5lKCk6IHZvaWQge1xuICAgICAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIHRoZSBTdGVwIEZ1bmN0aW9ucyBzdGF0ZSBtYWNoaW5lXG4gICAgICAgIGNvbnN0IGluZ2VzdGlvblJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0luZ2VzdGlvblJvbGUnLCB7XG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnc3RhdGVzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgICAgICAgICAgJ0luZ2VzdGlvblBvbGljeSc6IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYmVkcm9jazpTdGFydEluZ2VzdGlvbkpvYicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdiZWRyb2NrOkdldEluZ2VzdGlvbkpvYicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdiZWRyb2NrOkxpc3RJbmdlc3Rpb25Kb2JzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbdGhpcy52ZWN0b3JLYi5rbm93bGVkZ2VCYXNlQXJuXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogWycqJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgU3RlcCBGdW5jdGlvbnMgc3RhdGUgbWFjaGluZSB3aXRoIGVycm9yIGhhbmRsaW5nIGFuZCByZXRyeSBsb2dpY1xuICAgICAgICBjb25zdCBzdGFydEluZ2VzdGlvblRhc2sgPSBuZXcgdGFza3MuQ2FsbEF3c1NlcnZpY2UodGhpcywgJ1N0YXJ0SW5nZXN0aW9uSm9iJywge1xuICAgICAgICAgICAgYWN0aW9uOiAnc3RhcnRJbmdlc3Rpb25Kb2InLFxuICAgICAgICAgICAgc2VydmljZTogJ2JlZHJvY2thZ2VudCcsXG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJLbm93bGVkZ2VCYXNlSWRcIjogdGhpcy52ZWN0b3JLYi5rbm93bGVkZ2VCYXNlSWQsXG4gICAgICAgICAgICAgICAgXCJEYXRhU291cmNlSWRcIjogdGhpcy5rYlMzRHMuZGF0YVNvdXJjZUlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWFtUmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgdGhpcy52ZWN0b3JLYi5rbm93bGVkZ2VCYXNlQXJuLCBcbiAgICAgICAgICAgICAgICB0aGlzLmtiUzNEcy5idWNrZXQuYnVja2V0QXJuLFxuICAgICAgICAgICAgICAgIHRoaXMua2JTM0RzLmJ1Y2tldC5idWNrZXRBcm4gKyAnLyonLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc3VsdFBhdGg6ICckLmluZ2VzdGlvbkpvYidcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWRkIHJldHJ5IGxvZ2ljIGZvciB0cmFuc2llbnQgZmFpbHVyZXNcbiAgICAgICAgc3RhcnRJbmdlc3Rpb25UYXNrLmFkZFJldHJ5KHtcbiAgICAgICAgICAgIGVycm9yczogWydTdGF0ZXMuVGFza0ZhaWxlZCcsICdTdGF0ZXMuVGltZW91dCddLFxuICAgICAgICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgICAgIG1heEF0dGVtcHRzOiAzLFxuICAgICAgICAgICAgYmFja29mZlJhdGU6IDIuMFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBZGQgZXJyb3IgaGFuZGxpbmcgZm9yIHBlcm1hbmVudCBmYWlsdXJlc1xuICAgICAgICBjb25zdCBmYWlsdXJlU3RhdGUgPSBuZXcgc2ZuLkZhaWwodGhpcywgJ0luZ2VzdGlvbkZhaWxlZCcsIHtcbiAgICAgICAgICAgIGNvbW1lbnQ6ICdLbm93bGVkZ2UgYmFzZSBpbmdlc3Rpb24gam9iIGZhaWxlZCBhZnRlciByZXRyaWVzJ1xuICAgICAgICB9KTtcblxuICAgICAgICBzdGFydEluZ2VzdGlvblRhc2suYWRkQ2F0Y2goZmFpbHVyZVN0YXRlLCB7XG4gICAgICAgICAgICBlcnJvcnM6IFsnU3RhdGVzLkFMTCddLFxuICAgICAgICAgICAgcmVzdWx0UGF0aDogJyQuZXJyb3InXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBzdWNjZXNzIHN0YXRlXG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NTdGF0ZSA9IG5ldyBzZm4uU3VjY2VlZCh0aGlzLCAnSW5nZXN0aW9uU3VjY2VlZGVkJywge1xuICAgICAgICAgICAgY29tbWVudDogJ0tub3dsZWRnZSBiYXNlIGluZ2VzdGlvbiBqb2Igc3RhcnRlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENoYWluIHRoZSBzdGF0ZXMgdG9nZXRoZXJcbiAgICAgICAgY29uc3QgZGVmaW5pdGlvbiA9IHN0YXJ0SW5nZXN0aW9uVGFzay5uZXh0KHN1Y2Nlc3NTdGF0ZSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzdGF0ZSBtYWNoaW5lXG4gICAgICAgIGNvbnN0IHN0YXRlTWFjaGluZSA9IG5ldyBzZm4uU3RhdGVNYWNoaW5lKHRoaXMsICdTdGFydEluZ2VzdGlvbkpvYlN0YXRlTWFjaGluZScsIHtcbiAgICAgICAgICAgIHJvbGU6IGluZ2VzdGlvblJvbGUsXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyh0aGlzLmNvbmZpZy5pbmdlc3Rpb25UaW1lb3V0TWludXRlcyksXG4gICAgICAgICAgICBkZWZpbml0aW9uQm9keTogc2ZuLkRlZmluaXRpb25Cb2R5LmZyb21DaGFpbmFibGUoZGVmaW5pdGlvbiksXG4gICAgICAgICAgICBsb2dzOiB7XG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb246IG5ldyBjZGsuYXdzX2xvZ3MuTG9nR3JvdXAodGhpcywgJ0luZ2VzdGlvblN0YXRlTWFjaGluZUxvZ0dyb3VwJywge1xuICAgICAgICAgICAgICAgICAgICByZXRlbnRpb246IENvbmZpZ0RlZmF1bHRzLmdldExvZ1JldGVudGlvbih0aGlzLmNvbmZpZy5lbnZpcm9ubWVudCksXG4gICAgICAgICAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IENvbmZpZ0RlZmF1bHRzLmdldFJlbW92YWxQb2xpY3kodGhpcy5jb25maWcuZW52aXJvbm1lbnQpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGxldmVsOiBzZm4uTG9nTGV2ZWwuQUxMLFxuICAgICAgICAgICAgICAgIGluY2x1ZGVFeGVjdXRpb25EYXRhOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBFdmVudEJyaWRnZSBydWxlIGZvciBzY2hlZHVsZWQgaW5nZXN0aW9uXG4gICAgICAgIG5ldyBldmVudHMuUnVsZSh0aGlzLCAnUzNEYXRhU291cmNlSW5nZXN0aW9uU3luYycsIHtcbiAgICAgICAgICAgIHNjaGVkdWxlOiBjZGsuYXdzX2V2ZW50cy5TY2hlZHVsZS5yYXRlKGNkay5EdXJhdGlvbi5taW51dGVzKHRoaXMuY29uZmlnLmRhdGFTb3VyY2VTeW5jTWludXRlcykpLFxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIHRhcmdldHM6IFtuZXcgdGFyZ2V0cy5TZm5TdGF0ZU1hY2hpbmUoc3RhdGVNYWNoaW5lKV1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggYWxhcm1zIGlmIGVuYWJsZWRcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZUluZ2VzdGlvbkFsYXJtcykge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVJbmdlc3Rpb25BbGFybXMoc3RhdGVNYWNoaW5lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBDbG91ZFdhdGNoIGFsYXJtcyBmb3IgbW9uaXRvcmluZyBpbmdlc3Rpb24gcGlwZWxpbmUgaGVhbHRoXG4gICAgICogXG4gICAgICogQ3JlYXRlcyB0aHJlZSB0eXBlcyBvZiBhbGFybXM6XG4gICAgICogMS4gRmFpbHVyZSBhbGFybSAtIFRyaWdnZXJzIHdoZW4gaW5nZXN0aW9uIGpvYnMgZmFpbFxuICAgICAqIDIuIFRpbWVvdXQgYWxhcm0gLSBUcmlnZ2VycyB3aGVuIGluZ2VzdGlvbiBqb2JzIHRpbWVvdXRcbiAgICAgKiAzLiBEdXJhdGlvbiBhbGFybSAtIFdhcm5zIHdoZW4gam9icyB0YWtlIGxvbmdlciB0aGFuIGV4cGVjdGVkXG4gICAgICogXG4gICAgICogVGhlc2UgYWxhcm1zIGhlbHAgbW9uaXRvciB0aGUgaGVhbHRoIG9mIHRoZSBrbm93bGVkZ2UgYmFzZSBpbmdlc3Rpb25cbiAgICAgKiBwcm9jZXNzIGFuZCBjYW4gYmUgaW50ZWdyYXRlZCB3aXRoIFNOUyB0b3BpY3MgZm9yIG5vdGlmaWNhdGlvbnMuXG4gICAgICogXG4gICAgICogQHBhcmFtIHN0YXRlTWFjaGluZSAtIFRoZSBTdGVwIEZ1bmN0aW9ucyBzdGF0ZSBtYWNoaW5lIHRvIG1vbml0b3JcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZUluZ2VzdGlvbkFsYXJtcyhzdGF0ZU1hY2hpbmU6IHNmbi5TdGF0ZU1hY2hpbmUpOiB2b2lkIHtcbiAgICAgICAgLy8gQWxhcm0gZm9yIGZhaWxlZCBleGVjdXRpb25zXG4gICAgICAgIG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0luZ2VzdGlvbkZhaWx1cmVBbGFybScsIHtcbiAgICAgICAgICAgIGFsYXJtTmFtZTogYCR7dGhpcy5jb25maWcubmFtZX0taW5nZXN0aW9uLWZhaWx1cmVzYCxcbiAgICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246IGBLbm93bGVkZ2UgYmFzZSAke3RoaXMuY29uZmlnLm5hbWV9IGluZ2VzdGlvbiBqb2IgZmFpbHVyZXNgLFxuICAgICAgICAgICAgbWV0cmljOiBzdGF0ZU1hY2hpbmUubWV0cmljRmFpbGVkKHtcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bSdcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjZGsuYXdzX2Nsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFsYXJtIGZvciBleGVjdXRpb24gdGltZW91dHNcbiAgICAgICAgbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnSW5nZXN0aW9uVGltZW91dEFsYXJtJywge1xuICAgICAgICAgICAgYWxhcm1OYW1lOiBgJHt0aGlzLmNvbmZpZy5uYW1lfS1pbmdlc3Rpb24tdGltZW91dHNgLFxuICAgICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogYEtub3dsZWRnZSBiYXNlICR7dGhpcy5jb25maWcubmFtZX0gaW5nZXN0aW9uIGpvYiB0aW1lb3V0c2AsXG4gICAgICAgICAgICBtZXRyaWM6IHN0YXRlTWFjaGluZS5tZXRyaWNUaW1lZE91dCh7XG4gICAgICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHRocmVzaG9sZDogMSxcbiAgICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICAgICAgdHJlYXRNaXNzaW5nRGF0YTogY2RrLmF3c19jbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElOR1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbGFybSBmb3IgZXhlY3V0aW9uIGR1cmF0aW9uICh3YXJuIGlmIHRha2luZyB0b28gbG9uZylcbiAgICAgICAgbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnSW5nZXN0aW9uRHVyYXRpb25BbGFybScsIHtcbiAgICAgICAgICAgIGFsYXJtTmFtZTogYCR7dGhpcy5jb25maWcubmFtZX0taW5nZXN0aW9uLWR1cmF0aW9uYCxcbiAgICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246IGBLbm93bGVkZ2UgYmFzZSAke3RoaXMuY29uZmlnLm5hbWV9IGluZ2VzdGlvbiBqb2IgZHVyYXRpb24gd2FybmluZ2AsXG4gICAgICAgICAgICBtZXRyaWM6IG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvU3RhdGVzJyxcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXhlY3V0aW9uVGltZScsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZU1hY2hpbmVBcm46IHN0YXRlTWFjaGluZS5zdGF0ZU1hY2hpbmVBcm5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZSdcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdGhyZXNob2xkOiB0aGlzLmNvbmZpZy5pbmdlc3Rpb25UaW1lb3V0TWludXRlcyAqIDYwICogMTAwMCAqIDAuOCwgLy8gODAlIG9mIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNkay5hd3NfY2xvdWR3YXRjaC5UcmVhdE1pc3NpbmdEYXRhLk5PVF9CUkVBQ0hJTkdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIENsb3VkRm9ybWF0aW9uIG91dHB1dHMgZm9yIGVhc3kgcmVmZXJlbmNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRzKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzdGFja05hbWUgPSBjZGsuU3RhY2sub2YodGhpcykuc3RhY2tOYW1lO1xuXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdLbm93bGVkZ2VCYXNlSWQnLCB7XG4gICAgICAgICAgICB2YWx1ZTogdGhpcy52ZWN0b3JLYi5rbm93bGVkZ2VCYXNlSWQsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0lEIG9mIHRoZSBjcmVhdGVkIGtub3dsZWRnZSBiYXNlJyxcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6IGAke3N0YWNrTmFtZX0tJHt0aGlzLmNvbmZpZy5uYW1lfS1Lbm93bGVkZ2VCYXNlSWRgLFxuICAgICAgICB9KTtcblxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnS25vd2xlZGdlQmFzZUFybicsIHtcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnZlY3RvcktiLmtub3dsZWRnZUJhc2VBcm4sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgY3JlYXRlZCBrbm93bGVkZ2UgYmFzZScsXG4gICAgICAgICAgICBleHBvcnROYW1lOiBgJHtzdGFja05hbWV9LSR7dGhpcy5jb25maWcubmFtZX0tS25vd2xlZGdlQmFzZUFybmAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhU291cmNlSWQnLCB7XG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5rYlMzRHMuZGF0YVNvdXJjZUlkLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJRCBvZiB0aGUgUzMgZGF0YSBzb3VyY2UnLFxuICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7c3RhY2tOYW1lfS0ke3RoaXMuY29uZmlnLm5hbWV9LURhdGFTb3VyY2VJZGAsXG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=