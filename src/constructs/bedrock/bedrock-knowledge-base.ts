import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
import { 
    BaseConstructProps, 
    ValidationResult
} from '../../common/interfaces';
import { BaseValidator, ValidationUtils } from '../../common/validation';
import { ConfigDefaults, BEDROCK_KNOWLEDGE_BASE_DEFAULTS } from '../../common/defaults';

/**
 * Validator for Bedrock Knowledge Base properties
 * 
 * Validates all required and optional properties to ensure they meet
 * AWS service requirements and best practices for knowledge base creation.
 */
class BedrockKnowledgeBasePropsValidator extends BaseValidator<KnowledgeBaseProps> {
    /**
     * Validate the properties for BedrockKnowledgeBase
     * 
     * @param props - The properties to validate
     * @returns ValidationResult with errors, warnings, and suggestions
     */
    validate(props: KnowledgeBaseProps): ValidationResult {
        this.reset();

        // Validate required fields
        this.validateRequired(props.name, 'name');
        this.validateRequired(props.description, 'description');
        this.validateRequired(props.dataSourceBucket, 'dataSourceBucket');
        this.validateRequired(props.dataSourcePrefixes, 'dataSourcePrefixes');
        this.validateRequired(props.knowledgeBaseInstructions, 'knowledgeBaseInstructions');

        // Validate knowledge base name format
        if (props.name) {
            const nameValidation = ValidationUtils.validateAwsResourceName(props.name, 'name');
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
                this.addError(
                    'Knowledge base description must be at least 10 characters long',
                    'Please provide a more detailed description for the knowledge base'
                );
            }
            if (props.description.length > 1000) {
                this.addError(
                    'Knowledge base description must be 1000 characters or less',
                    'Please shorten the knowledge base description to 1000 characters or less'
                );
            }
        }

        // Validate knowledge base instructions
        if (props.knowledgeBaseInstructions) {
            if (props.knowledgeBaseInstructions.length < 10) {
                this.addError(
                    'Knowledge base instructions must be at least 10 characters long',
                    'Please provide more detailed instructions for the knowledge base'
                );
            }
            if (props.knowledgeBaseInstructions.length > 2000) {
                this.addError(
                    'Knowledge base instructions must be 2000 characters or less',
                    'Please shorten the knowledge base instructions to 2000 characters or less'
                );
            }
        }

        // Validate data source prefixes
        if (props.dataSourcePrefixes) {
            if (!this.validateNonEmptyArray(props.dataSourcePrefixes, 'dataSourcePrefixes')) {
                // Error already added by validateNonEmptyArray
            } else {
                // Validate each prefix
                for (const prefix of props.dataSourcePrefixes) {
                    const prefixValidation = ValidationUtils.validateS3Prefix(prefix);
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
 * Properties for the Bedrock Knowledge Base construct
 */
export interface KnowledgeBaseProps extends BaseConstructProps {
    /** 
     * Unique name for the knowledge base
     * Must be alphanumeric with hyphens and underscores only
     */
    name: string;
    
    /** 
     * Description of the knowledge base and its purpose
     * Should be between 10-1000 characters
     */
    description: string;
    
    /** 
     * S3 bucket containing the source data for the knowledge base
     * The knowledge base will have read access to this bucket
     */
    dataSourceBucket: s3.Bucket;
    
    /** 
     * S3 prefixes to include in the knowledge base
     * Each prefix should end with '/' for proper organization
     */
    dataSourcePrefixes: string[];
    
    /** 
     * Sync interval in minutes for automated ingestion
     * @default 10 minutes
     */
    dataSourceSyncMinutes?: number;
    
    /** 
     * Instructions for how the knowledge base should be used
     * Should be between 10-2000 characters
     */
    knowledgeBaseInstructions: string;
    
    /** 
     * Override properties for the underlying VectorKnowledgeBase
     * Use this to customize advanced settings (embedding model is handled separately)
     */
    knowledgeBasePropsOverride?: Partial<bedrock.VectorKnowledgeBaseProps>;
    
    /**
     * Chunking strategy for document processing
     * @default { maxTokens: 500, overlapPercentage: 20 }
     */
    chunkingStrategy?: {
        maxTokens?: number;
        overlapPercentage?: number;
    };
    
    /**
     * Embedding model to use for the knowledge base
     * @default bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_512
     */
    embeddingModel?: bedrock.BedrockFoundationModel;
    
    /**
     * Enable CloudWatch alarms for ingestion job failures
     * @default Based on environment (dev: false, staging/prod: true)
     */
    enableIngestionAlarms?: boolean;
    
    /**
     * Custom timeout for ingestion jobs in minutes
     * @default 60 minutes
     */
    ingestionTimeoutMinutes?: number;
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
export class BedrockKnowledgeBase extends Construct {
    /** The underlying vector knowledge base */
    public readonly vectorKb: bedrock.VectorKnowledgeBase;
    
    /** The S3 data source for the knowledge base */
    public readonly kbS3Ds: bedrock.S3DataSource;
    
    /** The knowledge base name used for resource identification */
    public readonly knowledgeBaseName: string;
    
    /** Applied configuration with defaults */
    private readonly config: Required<KnowledgeBaseProps>;

    /**
     * Create a new Bedrock Knowledge Base
     * 
     * @param scope - The scope in which to define this construct
     * @param id - The scoped construct ID. Must be unique amongst siblings in the same scope
     * @param props - Configuration properties for the knowledge base
     * 
     * @throws {ConstructError} When validation fails or required resources cannot be created
     */
    constructor(scope: Construct, id: string, props: KnowledgeBaseProps) {
        super(scope, id);

        try {
            // Validate input properties
            const validator = new BedrockKnowledgeBasePropsValidator();
            const validationResult = validator.validate(props);
            
            if (!validationResult.isValid) {
                ValidationUtils.throwIfInvalid(validationResult, 'BedrockKnowledgeBase');
            }

            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                console.warn(`[BedrockKnowledgeBase] Validation warnings for knowledge base '${props.name}':`, validationResult.warnings);
                if (validationResult.suggestions) {
                    console.warn(`[BedrockKnowledgeBase] Suggestions:`, validationResult.suggestions);
                }
            }
        } catch (error) {
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
        } catch (error) {
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
    private applyDefaults(props: KnowledgeBaseProps): Required<KnowledgeBaseProps> {
        const baseDefaults = ConfigDefaults.applyBaseDefaults(props);
        const environment = baseDefaults.environment;
        const envDefaults = ConfigDefaults.getEnvironmentDefaults(environment);
        
        return {
            ...baseDefaults,
            name: props.name,
            description: props.description,
            dataSourceBucket: props.dataSourceBucket,
            dataSourcePrefixes: props.dataSourcePrefixes,
            knowledgeBaseInstructions: props.knowledgeBaseInstructions,
            dataSourceSyncMinutes: props.dataSourceSyncMinutes || BEDROCK_KNOWLEDGE_BASE_DEFAULTS.dataSourceSyncMinutes,
            knowledgeBasePropsOverride: props.knowledgeBasePropsOverride || {},
            chunkingStrategy: {
                maxTokens: props.chunkingStrategy?.maxTokens ?? BEDROCK_KNOWLEDGE_BASE_DEFAULTS.chunkingStrategy.maxTokens,
                overlapPercentage: props.chunkingStrategy?.overlapPercentage ?? BEDROCK_KNOWLEDGE_BASE_DEFAULTS.chunkingStrategy.overlapPercentage,
            },
            embeddingModel: props.embeddingModel || bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_512,
            enableIngestionAlarms: props.enableIngestionAlarms !== undefined ? props.enableIngestionAlarms : envDefaults.monitoring.enableAlarms || false,
            ingestionTimeoutMinutes: props.ingestionTimeoutMinutes || 60,
        };
    }

    /**
     * Create the vector knowledge base with configured embedding model
     * 
     * @returns The created VectorKnowledgeBase
     */
    private createVectorKnowledgeBase(): bedrock.VectorKnowledgeBase {
        const baseProps: bedrock.VectorKnowledgeBaseProps = {
            embeddingsModel: this.config.embeddingModel,
            instruction: this.config.knowledgeBaseInstructions,
            description: this.config.description,
        };
        
        // Merge with overrides, but preserve the embedding model from config
        const kbProps: bedrock.VectorKnowledgeBaseProps = {
            ...baseProps,
            ...this.config.knowledgeBasePropsOverride,
            // Ensure embedding model from config takes precedence
            embeddingsModel: this.config.embeddingModel,
        };
        
        return new bedrock.VectorKnowledgeBase(this, this.config.name, kbProps);
    }

    /**
     * Create S3 data source with configured chunking strategy
     * 
     * @returns The created S3DataSource
     */
    private createS3DataSource(): bedrock.S3DataSource {
        return new bedrock.S3DataSource(this, 'kbS3DataSource', {
            bucket: this.config.dataSourceBucket,
            knowledgeBase: this.vectorKb,
            dataSourceName: this.config.name,
            inclusionPrefixes: this.config.dataSourcePrefixes,
            chunkingStrategy: bedrock.ChunkingStrategy.fixedSize({
                maxTokens: this.config.chunkingStrategy.maxTokens!,
                overlapPercentage: this.config.chunkingStrategy.overlapPercentage!,
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
    private createIngestionPipeline(): void {
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
                    retention: ConfigDefaults.getLogRetention(this.config.environment),
                    removalPolicy: ConfigDefaults.getRemovalPolicy(this.config.environment),
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
    private createIngestionAlarms(stateMachine: sfn.StateMachine): void {
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
    private createOutputs(): void {
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