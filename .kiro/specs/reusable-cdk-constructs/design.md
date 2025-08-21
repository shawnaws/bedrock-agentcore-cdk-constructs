# Design Document

## Overview

This design outlines the architecture for a reusable CDK construct library focused on AWS Bedrock Agent Core constructs. The library provides sophisticated, production-ready implementations for Bedrock Agent Core Runtime and Knowledge Base constructs that can be imported and used by other developers. The library will be published as an npm package and follows AWS CDK best practices.

The library currently includes:
- **BedrockAgentCoreRuntimeAgent**: A comprehensive L3 construct for deploying Bedrock Agent Core Runtime with Docker containers, IAM roles, and S3 integration
- **BedrockKnowledgeBase**: An L3 construct for creating vector knowledge bases with S3 data sources and automated ingestion

Key design principles:
- Production-ready security configurations
- Comprehensive IAM permission management
- Docker container support with ECR integration
- Automated knowledge base ingestion workflows
- Extensive error handling and rollback support

## Architecture

### Package Structure
```
reusable-cdk-constructs/
├── src/
│   ├── constructs/
│   │   └── bedrock-agentcore/    # Bedrock Agent Core constructs
│   │       ├── bedrock-agentcore-runtime-agent.ts
│   │       └── bedrock-knowledge-base-construct.ts
│   ├── common/                   # Shared utilities and interfaces (future)
│   │   ├── interfaces.ts         # Common interfaces and types
│   │   ├── validation.ts         # Configuration validation utilities
│   │   └── defaults.ts           # Default configurations
│   └── index.ts                  # Main export file
├── test/                         # Test files mirroring src structure
├── docs/                         # Documentation and examples
├── examples/                     # Usage examples
└── lib/                          # Compiled JavaScript output
```

### Current Construct Implementations

**BedrockAgentCoreRuntimeAgent (L3 Construct)**
- Deploys Bedrock Agent Core Runtime with Docker container support
- Comprehensive IAM role with least-privilege permissions
- S3 integration for data storage with configurable prefixes
- Knowledge base integration support
- Custom resource implementation for Agent Core Runtime lifecycle
- Environment variable configuration for MCP and storage
- CloudWatch logging and X-Ray tracing support
- ECR integration for container image management

**BedrockKnowledgeBase (L3 Construct)**
- Vector knowledge base creation with OpenSearch Serverless
- S3 data source integration with configurable prefixes
- Automated ingestion workflows using Step Functions and EventBridge
- Configurable chunking strategies and embedding models
- Support for multiple data source prefixes
- Scheduled synchronization with customizable intervals

## Components and Interfaces

### Current Construct Interfaces

**BedrockAgentCoreRuntimeAgentProps**
```typescript
export type BedrockAgentCoreRuntimeAgentProps = {
    agentName: string;                    // Unique identifier for the agent
    instruction: string;                  // Agent instructions/prompt
    projectRoot: string;                  // Path to Docker build context
    s3Bucket: Bucket;                    // S3 bucket for data storage
    s3Prefix: string;                    // S3 prefix for agent data
    knowledgeBases: BedrockKnowledgeBase[] // Associated knowledge bases
    protocol?: string                     // Communication protocol (default: HTTP)
    environmentVars?: { [key: string]: string } // Additional environment variables
}
```

**KnowledgeBaseProps**
```typescript
export type KnowledgeBaseProps = {
  name: string                          // Knowledge base name
  description: string,                  // Knowledge base description
  dataSourceBucket: s3.Bucket         // S3 bucket containing source data
  dataSourcePrefixes: string[]         // S3 prefixes to include in knowledge base
  dataSourceSyncMinutes?: number       // Sync interval in minutes (default: 10)
  knowledgeBaseInstructions: string    // Instructions for knowledge base usage
  knowledgeBasePropsOverride?: bedrock.VectorKnowledgeBaseProps // Override default props
}
```

### Security and IAM Design

**Agent Core Runtime IAM Role**
- Bedrock model invocation permissions
- ECR image access for container deployment
- CloudWatch logging with structured log groups
- X-Ray tracing for observability
- S3 access scoped to specific bucket and prefix
- Knowledge base retrieval permissions
- OpenSearch Serverless access for vector operations
- Workload identity token management

## Data Models

### Agent Core Runtime Architecture

**Container Management**
- Docker image asset creation with ARM64 platform support
- ECR repository integration with automatic image pushing
- Configurable build context and Dockerfile location
- Build optimization with intelligent file exclusions

**Custom Resource Implementation**
- AWS Custom Resource for Agent Core Runtime lifecycle management
- Comprehensive error handling with rollback protection
- Support for create, update, and delete operations
- Timeout configuration and retry logic
- Latest AWS SDK integration for new service support

**Environment Configuration**
- MCP (Model Context Protocol) server configuration
- S3 storage integration with presigned URL support
- Configurable logging levels and AWS region settings
- Extensible environment variable system

### Knowledge Base Architecture

**Vector Store Integration**
- OpenSearch Serverless collection management
- Titan embedding model integration (v2-512)
- Configurable chunking strategies with overlap support
- Multiple data source prefix support

**Automated Ingestion Pipeline**
- EventBridge scheduled rules for periodic sync
- Step Functions state machine for ingestion orchestration
- IAM roles with least-privilege access
- Configurable sync intervals (default: 10 minutes)

## Error Handling

### Agent Core Runtime Error Handling
- **Custom Resource Rollback Protection**: Comprehensive error code matching to prevent rollback failures
- **Container Image Validation**: ECR permissions and image existence checks
- **IAM Role Validation**: Service principal and trust policy verification
- **Timeout Management**: 10-minute timeout for complex operations
- **Logging Integration**: CloudWatch log retention and structured error reporting

### Knowledge Base Error Handling
- **Data Source Validation**: S3 bucket and prefix existence checks
- **Embedding Model Availability**: Bedrock model access verification
- **Ingestion Job Monitoring**: Step Functions error handling and retry logic
- **Collection Management**: OpenSearch Serverless collection lifecycle management

### Error Recovery Strategies
```typescript
// Custom Resource Error Handling Example
ignoreErrorCodesMatching: 'ValidationException|InvalidParameterException|ResourceNotFoundException|BadRequestException|ConflictException|InternalServerException|.*agentRuntimeId.*|.*not.*found.*|.*does.*not.*exist.*'
```

This comprehensive error matching prevents deployment failures during rollback scenarios and handles various AWS service error conditions gracefully.

## Testing Strategy

### Unit Testing Strategy
- **Construct Instantiation**: Test both constructs with various configuration combinations
- **IAM Policy Generation**: Verify correct permissions are created for different scenarios
- **Custom Resource Configuration**: Test custom resource parameters and error handling
- **CloudFormation Template Validation**: Ensure generated templates are valid and secure

### Integration Testing
- **End-to-End Workflows**: Test complete agent deployment with knowledge base integration
- **Cross-Service Dependencies**: Verify S3, ECR, OpenSearch Serverless, and Bedrock integration
- **Container Image Building**: Test Docker asset creation and ECR pushing
- **Knowledge Base Ingestion**: Test automated data source synchronization

### Testing Focus Areas
```typescript
// Example test structure for Bedrock constructs
describe('BedrockAgentCoreRuntimeAgent', () => {
  test('creates agent with required IAM permissions', () => {
    // Test IAM role creation with Bedrock, ECR, S3, and logging permissions
  });
  
  test('configures custom resource with proper error handling', () => {
    // Test custom resource configuration and rollback protection
  });
  
  test('integrates with knowledge bases correctly', () => {
    // Test knowledge base permissions and OpenSearch access
  });
});

describe('BedrockKnowledgeBase', () => {
  test('creates vector knowledge base with S3 data source', () => {
    // Test knowledge base creation and data source configuration
  });
  
  test('sets up automated ingestion pipeline', () => {
    // Test EventBridge rule and Step Functions state machine
  });
});
```

### Documentation Requirements
- **Construct API Documentation**: Comprehensive JSDoc comments for all public interfaces
- **Usage Examples**: Real-world examples showing agent and knowledge base deployment
- **Security Best Practices**: Document IAM permissions and security considerations
- **Troubleshooting Guide**: Common issues with Bedrock Agent Core and solutions
- **Migration Guide**: Version compatibility and upgrade paths

### Build and Release Process
- **TypeScript Compilation**: Compile to JavaScript with type definitions
- **CDK Compatibility**: Ensure compatibility with CDK v2 and latest versions
- **NPM Package Structure**: Proper package.json with dependencies and peer dependencies
- **Semantic Versioning**: Version management for breaking changes in Bedrock services
- **Multi-Language Support**: Consider jsii for Python/Java bindings in future versions