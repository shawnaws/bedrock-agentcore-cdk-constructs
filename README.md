# Reusable CDK Constructs

A library of production-ready AWS CDK constructs for Bedrock Agent Core and Knowledge Base deployment.

## Features

- **BedrockAgentCoreRuntimeAgent**: Deploy Bedrock Agent Core Runtime with Docker containers, IAM roles, and S3 integration
- **BedrockKnowledgeBase**: Create vector knowledge bases with S3 data sources and automated ingestion workflows

## Installation

```bash
npm install reusable-cdk-constructs
```

## Quick Start

```typescript
import { BedrockAgentCoreRuntimeAgent, BedrockKnowledgeBase } from 'reusable-cdk-constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';

// Create a knowledge base
const knowledgeBase = new BedrockKnowledgeBase(this, 'MyKnowledgeBase', {
  name: 'my-knowledge-base',
  description: 'Example knowledge base',
  dataSourceBucket: myBucket,
  dataSourcePrefixes: ['documents/'],
  knowledgeBaseInstructions: 'Use this knowledge base for document retrieval'
});

// Create an agent runtime
const agent = new BedrockAgentCoreRuntimeAgent(this, 'MyAgent', {
  agentName: 'my-agent',
  instruction: 'You are a helpful assistant',
  projectRoot: './agent-code',
  s3Bucket: myBucket,
  s3Prefix: 'agent-data/',
  knowledgeBases: [knowledgeBase]
});
```

## Documentation

- [API Documentation](./docs/api.md)
- [Usage Examples](./examples/)
- [Troubleshooting Guide](./docs/troubleshooting.md)

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## License

MIT