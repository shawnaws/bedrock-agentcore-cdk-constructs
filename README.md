# Reusable CDK Constructs for Amazon Bedrock

A comprehensive TypeScript library providing high-level AWS CDK constructs for Amazon Bedrock services, including Knowledge Bases and Agent Core Runtime Agents.

## Features

- **🧠 Bedrock Knowledge Base**: Create and manage knowledge bases with multiple vector store backends
- **🤖 Bedrock Agent Core Runtime**: Deploy and manage intelligent agents with action groups and knowledge base integration
- **🔧 Multiple Vector Stores**: Support for OpenSearch Serverless, Pinecone, and Redis Enterprise Cloud
- **📊 Comprehensive Monitoring**: Built-in CloudWatch logging and X-Ray tracing
- **✅ Input Validation**: Extensive validation with helpful error messages
- **🛡️ Security Best Practices**: Least-privilege IAM roles and secure configurations
- **📚 Rich Documentation**: Complete JSDoc documentation and usage examples

## Installation

```bash
npm install @shawnaws/bedrock-cdk-constructs
```

## Quick Start

### Basic Knowledge Base

```typescript
import { BedrockKnowledgeBase } from '@your-org/bedrock-cdk-constructs';

const knowledgeBase = new BedrockKnowledgeBase(this, 'MyKnowledgeBase', {
  knowledgeBaseName: 'my-knowledge-base',
  description: 'Knowledge base for customer support documents',
  dataSource: {
    bucketName: 'my-documents-bucket',
    keyPrefix: 'support-docs/',
    inclusionPrefixes: ['*.pdf', '*.txt']
  },
  vectorStore: {
    type: 'opensearch',
    opensearchConfig: {
      collectionArn: 'arn:aws:aoss:us-east-1:123456789012:collection/my-collection',
      vectorIndexName: 'knowledge-base-index'
    }
  }
});
```

### Simple Agent

```typescript
import { BedrockAgentCoreRuntimeAgent } from '@your-org/bedrock-cdk-constructs';

const agent = new BedrockAgentCoreRuntimeAgent(this, 'MyAgent', {
  agentName: 'customer-support-agent',
  description: 'AI agent for customer support',
  foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
  instruction: 'You are a helpful customer support agent.',
  knowledgeBaseIds: [knowledgeBase.knowledgeBaseId]
});
```

## Constructs

### BedrockKnowledgeBase

Creates and manages Amazon Bedrock Knowledge Bases with support for multiple vector store backends.

#### Supported Vector Stores

- **OpenSearch Serverless**: Fully managed vector search
- **Pinecone**: High-performance vector database
- **Redis Enterprise Cloud**: In-memory vector operations

#### Key Features

- Automatic IAM role creation with least-privilege permissions
- S3 data source configuration with inclusion/exclusion patterns
- Configurable embedding models and dimensions
- CloudWatch monitoring and logging
- Comprehensive input validation

#### Example with Mfonitoring

```typescript
const knowledgeBase = new BedrockKnowledgeBase(this, 'MonitoredKB', {
  knowledgeBaseName: 'monitored-kb',
  description: 'Knowledge base with comprehensive monitoring',
  dataSource: {
    bucketName: 'documents-bucket',
    keyPrefix: 'docs/',
    inclusionPrefixes: ['*.pdf', '*.docx', '*.txt'],
    exclusionPrefixes: ['temp/', 'draft/']
  },
  vectorStore: {
    type: 'opensearch',
    opensearchConfig: {
      collectionArn: 'arn:aws:aoss:us-east-1:123456789012:collection/kb-collection',
      vectorIndexName: 'documents-index',
      vectorField: 'embedding',
      textField: 'content',
      metadataField: 'metadata'
    },
    embeddingModelArn: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1',
    embeddingDimensions: 1536
  },
  monitoring: {
    enableCloudWatch: true,
    logRetentionDays: 30
  }
});
```

### BedrockAgentCoreRuntimeAgent

Creates and manages Amazon Bedrock Agent Core Runtime Agents with comprehensive capabilities.

#### Key Features

- Foundation model selection and configuration
- Knowledge base integration for RAG capabilities
- CloudWatch and X-Ray monitoring
- Prompt override configurations
- Session management and timeouts

#### Example with Prompt Override

```typescript
const agent = new BedrockAgentCoreRuntimeAgent(this, 'AdvancedAgent', {
  agentName: 'advanced-agent',
  description: 'Agent with custom prompt override',
  foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
  instruction: 'You are an advanced AI agent with access to knowledge bases.',
  
  knowledgeBaseIds: [
    knowledgeBase1.knowledgeBaseId,
    knowledgeBase2.knowledgeBaseId
  ],
  
  monitoring: {
    enableCloudWatch: true,
    enableXRay: true,
    logRetentionDays: 14
  },
  
  promptOverrideConfiguration: {
    promptConfigurations: [{
      promptType: 'PRE_PROCESSING',
      promptCreationMode: 'OVERRIDDEN',
      promptState: 'ENABLED',
      basePromptTemplate: 'Custom preprocessing instructions...',
      inferenceConfiguration: {
        temperature: 0.1,
        topP: 0.9,
        maximumLength: 2048
      }
    }]
  }
});
```

## Vector Store Configuration

### OpenSearch Serverless

```typescript
vectorStore: {
  type: 'opensearch',
  opensearchConfig: {
    collectionArn: 'arn:aws:aoss:us-east-1:123456789012:collection/my-collection',
    vectorIndexName: 'documents-index',
    vectorField: 'vector',      // Optional, defaults to 'vector'
    textField: 'text',          // Optional, defaults to 'text'
    metadataField: 'metadata'   // Optional, defaults to 'metadata'
  }
}
```

### Pinecone

```typescript
vectorStore: {
  type: 'pinecone',
  pineconeConfig: {
    connectionString: 'https://my-index.pinecone.io',
    credentialsSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:pinecone-key',
    namespace: 'documents',     // Optional
    textField: 'text',          // Optional, defaults to 'text'
    metadataField: 'metadata'   // Optional, defaults to 'metadata'
  }
}
```

### Redis Enterprise Cloud

```typescript
vectorStore: {
  type: 'redis',
  redisConfig: {
    endpoint: 'redis-cluster.abc123.cache.amazonaws.com:6379',
    vectorIndexName: 'vector-index',
    credentialsSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:redis-creds',
    vectorField: 'vector',      // Optional, defaults to 'vector'
    textField: 'text',          // Optional, defaults to 'text'
    metadataField: 'metadata'   // Optional, defaults to 'metadata'
  }
}
```

## Monitoring and Observability

Both constructs support comprehensive monitoring:

```typescript
monitoring: {
  enableCloudWatch: true,     // Enable CloudWatch logging
  enableXRay: true,          // Enable X-Ray tracing (agents only)
  logRetentionDays: 30       // Log retention period
}
```

### Available Log Retention Periods

- 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180 days
- 1, 2, 5, 10 years (365, 731, 1827, 3653 days)

## Foundation Models

Supported foundation models for agents:

- `anthropic.claude-3-sonnet-20240229-v1:0`
- `anthropic.claude-3-haiku-20240307-v1:0`
- `anthropic.claude-instant-v1`
- `amazon.titan-text-premier-v1:0`
- `cohere.command-text-v14`
- `meta.llama2-13b-chat-v1`

## Examples

The `examples/` directory contains comprehensive usage examples:

- **basic-knowledge-base.ts**: Simple knowledge base setup
- **simple-agent.ts**: Basic agent without knowledge bases
- **advanced-agent-with-monitoring.ts**: Full-featured agent with monitoring
- **multi-vector-store-comparison.ts**: Comparing different vector stores

## API Reference

### BedrockKnowledgeBaseProps

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `knowledgeBaseName` | string | Yes | Name of the knowledge base |
| `description` | string | No | Description of the knowledge base |
| `dataSource` | DataSourceConfig | Yes | S3 data source configuration |
| `vectorStore` | VectorStoreConfig | No | Vector store configuration (defaults to OpenSearch) |
| `monitoring` | MonitoringConfig | No | Monitoring and logging configuration |

### BedrockAgentCoreRuntimeProps

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `agentName` | string | Yes | Name of the agent |
| `description` | string | No | Description of the agent |
| `foundationModel` | string | Yes | Foundation model identifier |
| `instruction` | string | Yes | Agent instructions |
| `knowledgeBaseIds` | string[] | No | Knowledge base IDs to associate |
| `actionGroups` | ActionGroupConfig[] | No | Action group configurations |
| `monitoring` | MonitoringConfig | No | Monitoring configuration |
| `idleSessionTtlInSeconds` | number | No | Session timeout (default: 1800) |
| `promptOverrideConfiguration` | object | No | Custom prompt configurations |

## Security

### IAM Permissions

The constructs create IAM roles with least-privilege permissions:

**Knowledge Base Role**:
- S3 read access to specified bucket/prefix
- Vector store specific permissions (OpenSearch, Secrets Manager)
- CloudWatch logging permissions

**Agent Role**:
- Bedrock model invocation permissions
- Knowledge base retrieval permissions
- Lambda invocation for action groups
- CloudWatch and X-Ray permissions

### Best Practices

1. **Scope S3 permissions**: Use specific bucket names and prefixes
2. **Use Secrets Manager**: Store vector store credentials securely
3. **Enable monitoring**: Use CloudWatch and X-Ray for observability
4. **Validate inputs**: The constructs include comprehensive validation
5. **Regular updates**: Keep foundation models and configurations current

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

1. Check the [examples](./examples/) directory
2. Review the [API documentation](#api-reference)
3. Open an issue on GitHub
4. Consult the AWS Bedrock documentation

## Changelog

### v1.0.0

- Initial release
- BedrockKnowledgeBase construct with multi-vector store support
- BedrockAgentCoreRuntimeAgent construct with action groups
- Comprehensive monitoring and validation
- Complete documentation and examples
