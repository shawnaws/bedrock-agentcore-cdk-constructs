/**
 * Reusable AWS CDK Constructs Library
 * 
 * This library provides production-ready CDK constructs for AWS Bedrock Agent Core
 * and Knowledge Base deployment with best-practice security configurations.
 */

// Bedrock Agent Core constructs
export { BedrockAgentCoreRuntimeAgent } from './constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent';
export { BedrockKnowledgeBase } from './constructs/bedrock/bedrock-knowledge-base';

// Export types for construct properties
export type { BedrockAgentCoreRuntimeAgentProps } from './constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent';
export type { KnowledgeBaseProps } from './constructs/bedrock/bedrock-knowledge-base';

// Common interfaces and utilities
export * from './common/interfaces';
export * from './common/validation';
export * from './common/defaults';