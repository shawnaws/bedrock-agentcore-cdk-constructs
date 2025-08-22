import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BedrockKnowledgeBase } from '../src/constructs/bedrock/bedrock-knowledge-base';

/**
 * Example: Multi-Vector Store Comparison
 * 
 * This example demonstrates how to create knowledge bases with different
 * vector store backends (OpenSearch, Pinecone, Redis) for comparison.
 */
export class MultiVectorStoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // OpenSearch Serverless Knowledge Base
    const opensearchKB = new BedrockKnowledgeBase(this, 'OpenSearchKB', {
      knowledgeBaseName: 'opensearch-kb',
      description: 'Knowledge base using OpenSearch Serverless',
      dataSource: {
        bucketName: 'shared-documents-bucket',
        keyPrefix: 'opensearch-docs/',
        inclusionPrefixes: ['*.pdf', '*.txt']
      },
      vectorStore: {
        type: 'opensearch',
        opensearchConfig: {
          collectionArn: 'arn:aws:aoss:us-east-1:123456789012:collection/opensearch-collection',
          vectorIndexName: 'opensearch-index',
          vectorField: 'embedding_vector',
          textField: 'document_text',
          metadataField: 'document_metadata'
        },
        embeddingModelArn: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1',
        embeddingDimensions: 1536
      },
      monitoring: {
        enableCloudWatch: true,
        logRetentionDays: 7
      }
    });

    // Pinecone Knowledge Base
    const pineconeKB = new BedrockKnowledgeBase(this, 'PineconeKB', {
      knowledgeBaseName: 'pinecone-kb',
      description: 'Knowledge base using Pinecone vector database',
      dataSource: {
        bucketName: 'shared-documents-bucket',
        keyPrefix: 'pinecone-docs/',
        inclusionPrefixes: ['*.pdf', '*.txt']
      },
      vectorStore: {
        type: 'pinecone',
        pineconeConfig: {
          connectionString: 'https://my-pinecone-index.pinecone.io',
          credentialsSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:pinecone-api-key',
          namespace: 'documents',
          textField: 'text',
          metadataField: 'metadata'
        },
        embeddingModelArn: 'arn:aws:bedrock:us-east-1::foundation-model/cohere.embed-english-v3',
        embeddingDimensions: 1024
      },
      monitoring: {
        enableCloudWatch: true,
        logRetentionDays: 7
      }
    });

    // Redis Enterprise Cloud Knowledge Base
    const redisKB = new BedrockKnowledgeBase(this, 'RedisKB', {
      knowledgeBaseName: 'redis-kb',
      description: 'Knowledge base using Redis Enterprise Cloud',
      dataSource: {
        bucketName: 'shared-documents-bucket',
        keyPrefix: 'redis-docs/',
        inclusionPrefixes: ['*.pdf', '*.txt']
      },
      vectorStore: {
        type: 'redis',
        redisConfig: {
          endpoint: 'redis-cluster.abc123.cache.amazonaws.com:6379',
          vectorIndexName: 'redis-vector-index',
          credentialsSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:redis-credentials',
          vectorField: 'vector',
          textField: 'content',
          metadataField: 'meta'
        },
        embeddingModelArn: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',
        embeddingDimensions: 1024
      },
      monitoring: {
        enableCloudWatch: true,
        logRetentionDays: 7
      }
    });

    // Output all knowledge base IDs for comparison
    this.exportValue(opensearchKB.knowledgeBaseId, { name: 'OpenSearchKBId' });
    this.exportValue(pineconeKB.knowledgeBaseId, { name: 'PineconeKBId' });
    this.exportValue(redisKB.knowledgeBaseId, { name: 'RedisKBId' });

    // Output ARNs for cross-stack references
    this.exportValue(opensearchKB.knowledgeBaseArn, { name: 'OpenSearchKBArn' });
    this.exportValue(pineconeKB.knowledgeBaseArn, { name: 'PineconeKBArn' });
    this.exportValue(redisKB.knowledgeBaseArn, { name: 'RedisKBArn' });
  }
}

// Example usage
const app = new App();
new MultiVectorStoreStack(app, 'MultiVectorStoreStack');