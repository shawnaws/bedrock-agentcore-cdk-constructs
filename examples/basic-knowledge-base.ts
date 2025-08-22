import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BedrockKnowledgeBase } from '../src/constructs/bedrock/bedrock-knowledge-base';

/**
 * Example: Basic Knowledge Base with OpenSearch Serverless
 * 
 * This example demonstrates how to create a simple knowledge base
 * with an S3 data source and OpenSearch Serverless vector store.
 */
export class BasicKnowledgeBaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a basic knowledge base with minimal configuration
    const knowledgeBase = new BedrockKnowledgeBase(this, 'BasicKnowledgeBase', {
      knowledgeBaseName: 'basic-kb',
      description: 'A basic knowledge base for document retrieval',
      dataSource: {
        bucketName: 'my-documents-bucket',
        keyPrefix: 'documents/',
        inclusionPrefixes: ['*.pdf', '*.txt', '*.md']
      },
      vectorStore: {
        type: 'opensearch',
        opensearchConfig: {
          collectionArn: 'arn:aws:aoss:us-east-1:123456789012:collection/my-collection',
          vectorIndexName: 'document-index',
          vectorField: 'vector',
          textField: 'text',
          metadataField: 'metadata'
        }
      }
    });

    // Output the knowledge base ID for use in other stacks
    this.exportValue(knowledgeBase.knowledgeBaseId, {
      name: 'BasicKnowledgeBaseId'
    });
  }
}

// Example usage
const app = new App();
new BasicKnowledgeBaseStack(app, 'BasicKnowledgeBaseStack');