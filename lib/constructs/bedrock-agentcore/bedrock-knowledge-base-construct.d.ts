import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
import { BaseConstructProps } from '../../common/interfaces';
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
export declare class BedrockKnowledgeBase extends Construct {
    /** The underlying vector knowledge base */
    readonly vectorKb: bedrock.VectorKnowledgeBase;
    /** The S3 data source for the knowledge base */
    readonly kbS3Ds: bedrock.S3DataSource;
    /** The knowledge base name used for resource identification */
    readonly knowledgeBaseName: string;
    /** Applied configuration with defaults */
    private readonly config;
    /**
     * Create a new Bedrock Knowledge Base
     *
     * @param scope - The scope in which to define this construct
     * @param id - The scoped construct ID. Must be unique amongst siblings in the same scope
     * @param props - Configuration properties for the knowledge base
     *
     * @throws {ConstructError} When validation fails or required resources cannot be created
     */
    constructor(scope: Construct, id: string, props: KnowledgeBaseProps);
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
     * Create the vector knowledge base with configured embedding model
     *
     * @returns The created VectorKnowledgeBase
     */
    private createVectorKnowledgeBase;
    /**
     * Create S3 data source with configured chunking strategy
     *
     * @returns The created S3DataSource
     */
    private createS3DataSource;
    /**
     * Create automated ingestion pipeline with Step Functions and EventBridge
     *
     * Sets up a robust ingestion pipeline with:
     * - Retry logic for failed ingestion jobs
     * - Error handling and dead letter queues
     * - CloudWatch alarms for monitoring
     * - Scheduled execution at configured intervals
     */
    private createIngestionPipeline;
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
    private createIngestionAlarms;
    /**
     * Create CloudFormation outputs for easy reference
     */
    private createOutputs;
}
//# sourceMappingURL=bedrock-knowledge-base-construct.d.ts.map