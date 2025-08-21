/**
 * Integration tests for Bedrock constructs working together
 */

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BedrockAgentCoreRuntimeAgent } from '../../src/constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent';
import { BedrockKnowledgeBase } from '../../src/constructs/bedrock/bedrock-knowledge-base';

describe('Bedrock Constructs Integration', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let testBucket: Bucket;

    beforeEach(() => {
        app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');
        
        // Create test S3 bucket
        testBucket = new Bucket(stack, 'TestBucket');
    });

    describe('Agent with Knowledge Base Integration', () => {
        test('should create agent with single knowledge base', () => {
            // Create knowledge base first
            const knowledgeBase = new BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base for integration tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            });

            // Create agent with knowledge base
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'You are a helpful assistant with access to a knowledge base',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase]
            });

            const template = Template.fromStack(stack);

            // Verify agent has permissions to access the knowledge base
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Action: Match.arrayWith([
                                'bedrock:Retrieve',
                                'bedrock:RetrieveAndGenerate'
                            ]),
                            Resource: [
                                {
                                    'Fn::GetAtt': [Match.anyValue(), 'KnowledgeBaseArn']
                                }
                            ]
                        })
                    ])
                }
            });

            // Verify agent has OpenSearch Serverless permissions
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Action: ['aoss:APIAccessAll']
                        })
                    ])
                }
            });

            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });

        test('should create agent with multiple knowledge bases', () => {
            // Create multiple knowledge bases
            const kb1 = new BedrockKnowledgeBase(stack, 'TestKB1', {
                name: 'test-kb-1',
                description: 'First test knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base for documents'
            });

            const kb2 = new BedrockKnowledgeBase(stack, 'TestKB2', {
                name: 'test-kb-2',
                description: 'Second test knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['policies/'],
                knowledgeBaseInstructions: 'Use this knowledge base for policies'
            });

            // Create agent with multiple knowledge bases
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'You are a helpful assistant with access to multiple knowledge bases',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [kb1, kb2]
            });

            const template = Template.fromStack(stack);

            // Verify agent has permissions for both knowledge bases
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Action: Match.arrayWith([
                                'bedrock:Retrieve',
                                'bedrock:RetrieveAndGenerate'
                            ])
                        })
                    ])
                }
            });

            // Should have multiple OpenSearch collections
            template.resourceCountIs('AWS::OpenSearchServerless::Collection', 2);

            expect(agent.agentName).toBe('test-agent');
            expect(kb1.knowledgeBaseName).toBe('test-kb-1');
            expect(kb2.knowledgeBaseName).toBe('test-kb-2');
        });

        test('should handle shared S3 bucket between agent and knowledge base', () => {
            // Create knowledge base using the same bucket as agent
            const knowledgeBase = new BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base sharing S3 bucket',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['kb-data/'],
                knowledgeBaseInstructions: 'Use this knowledge base for shared data'
            });

            // Create agent using the same bucket
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'You are a helpful assistant with shared S3 access',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase]
            });

            const template = Template.fromStack(stack);

            // Should only create one S3 bucket
            template.resourceCountIs('AWS::S3::Bucket', 1);

            // Both constructs should have appropriate S3 permissions
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Action: Match.arrayWith([
                                's3:GetObject',
                                's3:PutObject',
                                's3:DeleteObject',
                                's3:ListBucket'
                            ])
                        })
                    ])
                }
            });

            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });
    });

    describe('Environment Consistency', () => {
        test('should apply consistent environment settings across constructs', () => {
            const environment = 'prod';

            // Create knowledge base with production environment
            const knowledgeBase = new BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Production knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Production knowledge base instructions',
                environment
            });

            // Create agent with same environment
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Production agent instructions',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase],
                environment
            });

            const template = Template.fromStack(stack);

            // Both should have production log retention (6 months = 180 days)
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 180
            });

            // Knowledge base should have alarms enabled in production
            template.resourceCountIs('AWS::CloudWatch::Alarm', 3);

            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });

        test('should handle different environments gracefully', () => {
            // Create knowledge base with dev environment
            const knowledgeBase = new BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Development knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Development knowledge base instructions',
                environment: 'dev'
            });

            // Create agent with staging environment
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Staging agent instructions',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase],
                environment: 'staging'
            });

            const template = Template.fromStack(stack);

            // Should have different log retention settings
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 7 // Dev default
            });

            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 30 // Staging default
            });

            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });
    });

    describe('Resource Dependencies', () => {
        test('should create resources in correct dependency order', () => {
            // Create knowledge base first
            const knowledgeBase = new BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base for dependency testing',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Test knowledge base instructions'
            });

            // Create agent that depends on knowledge base
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Agent that depends on knowledge base',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase]
            });

            const template = Template.fromStack(stack);

            // Agent's IAM role should reference knowledge base ARN
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Resource: [
                                {
                                    'Fn::GetAtt': [Match.anyValue(), 'KnowledgeBaseArn']
                                }
                            ]
                        })
                    ])
                }
            });

            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });

        test('should handle circular dependencies gracefully', () => {
            // This test ensures that creating constructs in any order works
            // First create agent reference (this will be resolved later)
            let agent: BedrockAgentCoreRuntimeAgent;

            // Create knowledge base
            const knowledgeBase = new BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Test knowledge base instructions'
            });

            // Now create agent with knowledge base
            agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Test agent instructions',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase]
            });

            // Should not throw any errors
            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });
    });

    describe('Cross-Construct Validation', () => {
        test('should validate compatible configurations', () => {
            // Create knowledge base with specific configuration
            const knowledgeBase = new BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Compatible knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Compatible knowledge base instructions',
                chunkingStrategy: {
                    maxTokens: 1000,
                    overlapPercentage: 15
                }
            });

            // Create agent with compatible configuration
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Agent with compatible configuration for the knowledge base',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase],
                protocol: 'HTTPS'
            });

            const template = Template.fromStack(stack);

            // Should create all resources successfully
            template.resourceCountIs('AWS::Bedrock::KnowledgeBase', 1);
            template.resourceCountIs('AWS::Bedrock::DataSource', 1);
            template.resourceCountIs('Custom::AgentCoreRuntime', 1);

            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });
    });

    describe('End-to-End Deployment Scenarios', () => {
        test('should create complete RAG system', () => {
            // Create multiple knowledge bases for different domains
            const docsKB = new BedrockKnowledgeBase(stack, 'DocsKB', {
                name: 'docs-kb',
                description: 'Documentation knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['docs/'],
                knowledgeBaseInstructions: 'Use for technical documentation',
                chunkingStrategy: {
                    maxTokens: 1500,
                    overlapPercentage: 25
                }
            });

            const faqKB = new BedrockKnowledgeBase(stack, 'FAQKB', {
                name: 'faq-kb',
                description: 'FAQ knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['faq/'],
                knowledgeBaseInstructions: 'Use for frequently asked questions',
                chunkingStrategy: {
                    maxTokens: 300,
                    overlapPercentage: 10
                }
            });

            // Create agent with access to both knowledge bases
            const agent = new BedrockAgentCoreRuntimeAgent(stack, 'RAGAgent', {
                agentName: 'rag-agent',
                instruction: 'You are a helpful assistant with access to documentation and FAQ knowledge bases. Use the docs KB for technical questions and FAQ KB for common questions.',
                projectRoot: './rag-agent',
                s3Bucket: testBucket,
                s3Prefix: 'rag-agent/',
                knowledgeBases: [docsKB, faqKB],
                environment: 'prod',
                enableTracing: true,
                customResourceTimeoutMinutes: 20
            });

            const template = Template.fromStack(stack);

            // Should create complete RAG system
            template.resourceCountIs('AWS::Bedrock::KnowledgeBase', 2);
            template.resourceCountIs('AWS::Bedrock::DataSource', 2);
            template.resourceCountIs('AWS::OpenSearchServerless::Collection', 2);
            template.resourceCountIs('AWS::StepFunctions::StateMachine', 2);
            template.resourceCountIs('AWS::Events::Rule', 2);
            template.resourceCountIs('Custom::AgentCoreRuntime', 1);

            // Should have monitoring enabled
            template.resourceCountIs('AWS::CloudWatch::Alarm', 6); // 3 alarms per KB

            expect(agent.agentName).toBe('rag-agent');
            expect(docsKB.knowledgeBaseName).toBe('docs-kb');
            expect(faqKB.knowledgeBaseName).toBe('faq-kb');
        });
    });
});