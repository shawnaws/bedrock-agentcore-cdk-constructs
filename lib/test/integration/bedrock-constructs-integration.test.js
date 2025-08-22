"use strict";
/**
 * Integration tests for Bedrock constructs working together
 */
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
const cdk = __importStar(require("aws-cdk-lib"));
const assertions_1 = require("aws-cdk-lib/assertions");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const bedrock_agentcore_runtime_agent_1 = require("../../src/constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent");
const bedrock_knowledge_base_1 = require("../../src/constructs/bedrock/bedrock-knowledge-base");
describe('Bedrock Constructs Integration', () => {
    let app;
    let stack;
    let testBucket;
    beforeEach(() => {
        app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');
        // Create test S3 bucket
        testBucket = new aws_s3_1.Bucket(stack, 'TestBucket');
    });
    describe('Agent with Knowledge Base Integration', () => {
        test('should create agent with single knowledge base', () => {
            // Create knowledge base first
            const knowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base for integration tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            });
            // Create agent with knowledge base
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'You are a helpful assistant with access to a knowledge base',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase]
            });
            const template = assertions_1.Template.fromStack(stack);
            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });
        test('should create agent with multiple knowledge bases', () => {
            // Create multiple knowledge bases
            const kb1 = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB1', {
                name: 'test-kb-1',
                description: 'First test knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base for documents'
            });
            const kb2 = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB2', {
                name: 'test-kb-2',
                description: 'Second test knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['policies/'],
                knowledgeBaseInstructions: 'Use this knowledge base for policies'
            });
            // Create agent with multiple knowledge bases
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'You are a helpful assistant with access to multiple knowledge bases',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [kb1, kb2]
            });
            const template = assertions_1.Template.fromStack(stack);
            // Verify agent has permissions for both knowledge bases
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.arrayWith([
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
            const knowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base sharing S3 bucket',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['kb-data/'],
                knowledgeBaseInstructions: 'Use this knowledge base for shared data'
            });
            // Create agent using the same bucket
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'You are a helpful assistant with shared S3 access',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase]
            });
            const template = assertions_1.Template.fromStack(stack);
            // Should only create one S3 bucket
            template.resourceCountIs('AWS::S3::Bucket', 1);
            // Both constructs should have appropriate S3 permissions
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.arrayWith([
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
            const knowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Production knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Production knowledge base instructions',
                environment
            });
            // Create agent with same environment
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Production agent instructions',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase],
                environment
            });
            const template = assertions_1.Template.fromStack(stack);
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
            const knowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Development knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Development knowledge base instructions',
                environment: 'dev'
            });
            // Create agent with staging environment
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Staging agent instructions',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase],
                environment: 'staging'
            });
            const template = assertions_1.Template.fromStack(stack);
            // Should have different log retention settings
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 7 // Dev default
            });
            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });
    });
    describe('Resource Dependencies', () => {
        test('should create resources in correct dependency order', () => {
            // Create knowledge base first
            const knowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base for dependency testing',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Test knowledge base instructions'
            });
            // Create agent that depends on knowledge base
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Agent that depends on knowledge base',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase]
            });
            const template = assertions_1.Template.fromStack(stack);
            // Verify the TestAgent role is created with proper trust policy for bedrock-agentcore
            const allRoles = template.findResources('AWS::IAM::Role');
            const testAgentRoleKey = Object.keys(allRoles).find(key => key.startsWith('TestAgentAgentRole'));
            expect(testAgentRoleKey).toBeDefined();
            if (testAgentRoleKey) {
                const testAgentRole = allRoles[testAgentRoleKey];
                // Verify it has the correct trust policy for bedrock-agentcore service
                expect(testAgentRole.Properties.AssumeRolePolicyDocument.Statement).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'bedrock-agentcore.amazonaws.com'
                        },
                        Condition: expect.objectContaining({
                            StringEquals: expect.objectContaining({
                                'aws:SourceAccount': expect.any(Object)
                            }),
                            ArnLike: expect.objectContaining({
                                'aws:SourceArn': expect.any(Object)
                            })
                        })
                    })
                ]));
            }
            // Verify that the agent has an associated IAM policy (permissions are tested in unit tests)
            template.hasResourceProperties('AWS::IAM::Policy', {
                Roles: assertions_1.Match.arrayWith([
                    { Ref: testAgentRoleKey }
                ])
            });
            expect(agent.agentName).toBe('test-agent');
            expect(knowledgeBase.knowledgeBaseName).toBe('test-kb');
        });
        test('should handle circular dependencies gracefully', () => {
            // This test ensures that creating constructs in any order works
            // Create knowledge base
            const knowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
                name: 'test-kb',
                description: 'Test knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Test knowledge base instructions'
            });
            // Now create agent with knowledge base
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
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
            const knowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
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
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', {
                agentName: 'test-agent',
                instruction: 'Agent with compatible configuration for the knowledge base',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [knowledgeBase],
                protocol: 'HTTPS'
            });
            const template = assertions_1.Template.fromStack(stack);
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
            const docsKB = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'DocsKB', {
                name: 'docs-kb',
                description: 'Documentation knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['docs/'],
                knowledgeBaseInstructions: 'Use for technical documentation',
                chunkingStrategy: {
                    maxTokens: 1500,
                    overlapPercentage: 25
                },
                enableIngestionAlarms: true
            });
            const faqKB = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'FAQKB', {
                name: 'faq-kb',
                description: 'FAQ knowledge base',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['faq/'],
                knowledgeBaseInstructions: 'Use for frequently asked questions',
                chunkingStrategy: {
                    maxTokens: 300,
                    overlapPercentage: 10
                },
                enableIngestionAlarms: true
            });
            // Create agent with access to both knowledge bases
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'RAGAgent', {
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
            const template = assertions_1.Template.fromStack(stack);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1jb25zdHJ1Y3RzLWludGVncmF0aW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2ludGVncmF0aW9uL2JlZHJvY2stY29uc3RydWN0cy1pbnRlZ3JhdGlvbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQyx1REFBeUQ7QUFDekQsK0NBQTRDO0FBQzVDLDRIQUFzSDtBQUN0SCxnR0FBMkY7QUFFM0YsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtJQUM1QyxJQUFJLEdBQVksQ0FBQztJQUNqQixJQUFJLEtBQWdCLENBQUM7SUFDckIsSUFBSSxVQUFrQixDQUFDO0lBRXZCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDWixHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDcEIsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFeEMsd0JBQXdCO1FBQ3hCLFVBQVUsR0FBRyxJQUFJLGVBQU0sQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1FBQ25ELElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7WUFDeEQsOEJBQThCO1lBQzlCLE1BQU0sYUFBYSxHQUFHLElBQUksNkNBQW9CLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRTtnQkFDNUQsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLDJDQUEyQztnQkFDeEQsZ0JBQWdCLEVBQUUsVUFBVTtnQkFDNUIsa0JBQWtCLEVBQUUsQ0FBQyxZQUFZLENBQUM7Z0JBQ2xDLHlCQUF5QixFQUFFLGtFQUFrRTthQUNoRyxDQUFDLENBQUM7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O2FBQ25DLENBQUMsQ0FBQztZQUVILE1BQU0sUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTNDLG9DQUFvQztZQUNwQyxRQUFRLENBQUMsZUFBZSxDQUFDLDZCQUE2QixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNELFFBQVEsQ0FBQyxlQUFlLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEQsUUFBUSxDQUFDLGVBQWUsQ0FBQyx1Q0FBdUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxRQUFRLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLFFBQVEsQ0FBQyxlQUFlLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakQsUUFBUSxDQUFDLGVBQWUsQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV4RCxpQ0FBaUM7WUFDakMsUUFBUSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQjtZQUV6RSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBJbnRlZ3JhdGlvbiB0ZXN0cyBmb3IgQmVkcm9jayBjb25zdHJ1Y3RzIHdvcmtpbmcgdG9nZXRoZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGVtcGxhdGUsIE1hdGNoIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgeyBCdWNrZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudCB9IGZyb20gJy4uLy4uL3NyYy9jb25zdHJ1Y3RzL2JlZHJvY2stYWdlbnRjb3JlL2JlZHJvY2stYWdlbnRjb3JlLXJ1bnRpbWUtYWdlbnQnO1xuaW1wb3J0IHsgQmVkcm9ja0tub3dsZWRnZUJhc2UgfSBmcm9tICcuLi8uLi9zcmMvY29uc3RydWN0cy9iZWRyb2NrL2JlZHJvY2sta25vd2xlZGdlLWJhc2UnO1xuXG5kZXNjcmliZSgnQmVkcm9jayBDb25zdHJ1Y3RzIEludGVncmF0aW9uJywgKCkgPT4ge1xuICAgIGxldCBhcHA6IGNkay5BcHA7XG4gICAgbGV0IHN0YWNrOiBjZGsuU3RhY2s7XG4gICAgbGV0IHRlc3RCdWNrZXQ6IEJ1Y2tldDtcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgICBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgICAgICBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnVGVzdFN0YWNrJyk7XG4gICAgICAgIFxuICAgICAgICAvLyBDcmVhdGUgdGVzdCBTMyBidWNrZXRcbiAgICAgICAgdGVzdEJ1Y2tldCA9IG5ldyBCdWNrZXQoc3RhY2ssICdUZXN0QnVja2V0Jyk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnQWdlbnQgd2l0aCBLbm93bGVkZ2UgQmFzZSBJbnRlZ3JhdGlvbicsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBhZ2VudCB3aXRoIHNpbmdsZSBrbm93bGVkZ2UgYmFzZScsICgpID0+IHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBrbm93bGVkZ2UgYmFzZSBmaXJzdFxuICAgICAgICAgICAgY29uc3Qga25vd2xlZGdlQmFzZSA9IG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndGVzdC1rYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlIGZvciBpbnRlZ3JhdGlvbiB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhZ2VudCB3aXRoIGtub3dsZWRnZSBiYXNlXG4gICAgICAgICAgICBjb25zdCBhZ2VudCA9IG5ldyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50KHN0YWNrLCAnVGVzdEFnZW50Jywge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnWW91IGFyZSBhIGhlbHBmdWwgYXNzaXN0YW50IHdpdGggYWNjZXNzIHRvIGEga25vd2xlZGdlIGJhc2UnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VzOiBba25vd2xlZGdlQmFzZV1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIGV4cGVjdChhZ2VudC5hZ2VudE5hbWUpLnRvQmUoJ3Rlc3QtYWdlbnQnKTtcbiAgICAgICAgICAgIGV4cGVjdChrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VOYW1lKS50b0JlKCd0ZXN0LWtiJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgYWdlbnQgd2l0aCBtdWx0aXBsZSBrbm93bGVkZ2UgYmFzZXMnLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgbXVsdGlwbGUga25vd2xlZGdlIGJhc2VzXG4gICAgICAgICAgICBjb25zdCBrYjEgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0IxJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiLTEnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmlyc3QgdGVzdCBrbm93bGVkZ2UgYmFzZScsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSBmb3IgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGtiMiA9IG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQjInLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2ItMicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTZWNvbmQgdGVzdCBrbm93bGVkZ2UgYmFzZScsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsncG9saWNpZXMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIGZvciBwb2xpY2llcydcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYWdlbnQgd2l0aCBtdWx0aXBsZSBrbm93bGVkZ2UgYmFzZXNcbiAgICAgICAgICAgIGNvbnN0IGFnZW50ID0gbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCBhc3Npc3RhbnQgd2l0aCBhY2Nlc3MgdG8gbXVsdGlwbGUga25vd2xlZGdlIGJhc2VzJyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW2tiMSwga2IyXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gVmVyaWZ5IGFnZW50IGhhcyBwZXJtaXNzaW9ucyBmb3IgYm90aCBrbm93bGVkZ2UgYmFzZXNcbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06OlBvbGljeScsIHtcbiAgICAgICAgICAgICAgICBQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdiZWRyb2NrOlJldHJpZXZlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2s6UmV0cmlldmVBbmRHZW5lcmF0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgXSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gU2hvdWxkIGhhdmUgbXVsdGlwbGUgT3BlblNlYXJjaCBjb2xsZWN0aW9uc1xuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6Ok9wZW5TZWFyY2hTZXJ2ZXJsZXNzOjpDb2xsZWN0aW9uJywgMik7XG5cbiAgICAgICAgICAgIGV4cGVjdChhZ2VudC5hZ2VudE5hbWUpLnRvQmUoJ3Rlc3QtYWdlbnQnKTtcbiAgICAgICAgICAgIGV4cGVjdChrYjEua25vd2xlZGdlQmFzZU5hbWUpLnRvQmUoJ3Rlc3Qta2ItMScpO1xuICAgICAgICAgICAgZXhwZWN0KGtiMi5rbm93bGVkZ2VCYXNlTmFtZSkudG9CZSgndGVzdC1rYi0yJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgc2hhcmVkIFMzIGJ1Y2tldCBiZXR3ZWVuIGFnZW50IGFuZCBrbm93bGVkZ2UgYmFzZScsICgpID0+IHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBrbm93bGVkZ2UgYmFzZSB1c2luZyB0aGUgc2FtZSBidWNrZXQgYXMgYWdlbnRcbiAgICAgICAgICAgIGNvbnN0IGtub3dsZWRnZUJhc2UgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBzaGFyaW5nIFMzIGJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsna2ItZGF0YS8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIHRoaXMga25vd2xlZGdlIGJhc2UgZm9yIHNoYXJlZCBkYXRhJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhZ2VudCB1c2luZyB0aGUgc2FtZSBidWNrZXRcbiAgICAgICAgICAgIGNvbnN0IGFnZW50ID0gbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCBhc3Npc3RhbnQgd2l0aCBzaGFyZWQgUzMgYWNjZXNzJyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW2tub3dsZWRnZUJhc2VdXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4gICAgICAgICAgICAvLyBTaG91bGQgb25seSBjcmVhdGUgb25lIFMzIGJ1Y2tldFxuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OlMzOjpCdWNrZXQnLCAxKTtcblxuICAgICAgICAgICAgLy8gQm90aCBjb25zdHJ1Y3RzIHNob3VsZCBoYXZlIGFwcHJvcHJpYXRlIFMzIHBlcm1pc3Npb25zXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpQb2xpY3knLCB7XG4gICAgICAgICAgICAgICAgUG9saWN5RG9jdW1lbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgU3RhdGVtZW50OiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAgICAgICAgICAgICAgTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnczM6TGlzdEJ1Y2tldCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgXSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZXhwZWN0KGFnZW50LmFnZW50TmFtZSkudG9CZSgndGVzdC1hZ2VudCcpO1xuICAgICAgICAgICAgZXhwZWN0KGtub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZU5hbWUpLnRvQmUoJ3Rlc3Qta2InKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnRW52aXJvbm1lbnQgQ29uc2lzdGVuY3knLCAoKSA9PiB7XG4gICAgICAgIHRlc3QoJ3Nob3VsZCBhcHBseSBjb25zaXN0ZW50IGVudmlyb25tZW50IHNldHRpbmdzIGFjcm9zcyBjb25zdHJ1Y3RzJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZW52aXJvbm1lbnQgPSAncHJvZCc7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBrbm93bGVkZ2UgYmFzZSB3aXRoIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRcbiAgICAgICAgICAgIGNvbnN0IGtub3dsZWRnZUJhc2UgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvZHVjdGlvbiBrbm93bGVkZ2UgYmFzZScsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdQcm9kdWN0aW9uIGtub3dsZWRnZSBiYXNlIGluc3RydWN0aW9ucycsXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYWdlbnQgd2l0aCBzYW1lIGVudmlyb25tZW50XG4gICAgICAgICAgICBjb25zdCBhZ2VudCA9IG5ldyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50KHN0YWNrLCAnVGVzdEFnZW50Jywge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnUHJvZHVjdGlvbiBhZ2VudCBpbnN0cnVjdGlvbnMnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VzOiBba25vd2xlZGdlQmFzZV0sXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIEJvdGggc2hvdWxkIGhhdmUgcHJvZHVjdGlvbiBsb2cgcmV0ZW50aW9uICg2IG1vbnRocyA9IDE4MCBkYXlzKVxuICAgICAgICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxvZ3M6OkxvZ0dyb3VwJywge1xuICAgICAgICAgICAgICAgIFJldGVudGlvbkluRGF5czogMTgwXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gS25vd2xlZGdlIGJhc2Ugc2hvdWxkIGhhdmUgYWxhcm1zIGVuYWJsZWQgaW4gcHJvZHVjdGlvblxuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkNsb3VkV2F0Y2g6OkFsYXJtJywgMyk7XG5cbiAgICAgICAgICAgIGV4cGVjdChhZ2VudC5hZ2VudE5hbWUpLnRvQmUoJ3Rlc3QtYWdlbnQnKTtcbiAgICAgICAgICAgIGV4cGVjdChrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VOYW1lKS50b0JlKCd0ZXN0LWtiJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgZGlmZmVyZW50IGVudmlyb25tZW50cyBncmFjZWZ1bGx5JywgKCkgPT4ge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGtub3dsZWRnZSBiYXNlIHdpdGggZGV2IGVudmlyb25tZW50XG4gICAgICAgICAgICBjb25zdCBrbm93bGVkZ2VCYXNlID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RldmVsb3BtZW50IGtub3dsZWRnZSBiYXNlJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ0RldmVsb3BtZW50IGtub3dsZWRnZSBiYXNlIGluc3RydWN0aW9ucycsXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6ICdkZXYnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGFnZW50IHdpdGggc3RhZ2luZyBlbnZpcm9ubWVudFxuICAgICAgICAgICAgY29uc3QgYWdlbnQgPSBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICd0ZXN0LWFnZW50JyxcbiAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1N0YWdpbmcgYWdlbnQgaW5zdHJ1Y3Rpb25zJyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW2tub3dsZWRnZUJhc2VdLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiAnc3RhZ2luZydcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIFNob3VsZCBoYXZlIGRpZmZlcmVudCBsb2cgcmV0ZW50aW9uIHNldHRpbmdzXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TG9nczo6TG9nR3JvdXAnLCB7XG4gICAgICAgICAgICAgICAgUmV0ZW50aW9uSW5EYXlzOiA3IC8vIERldiBkZWZhdWx0XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZXhwZWN0KGFnZW50LmFnZW50TmFtZSkudG9CZSgndGVzdC1hZ2VudCcpO1xuICAgICAgICAgICAgZXhwZWN0KGtub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZU5hbWUpLnRvQmUoJ3Rlc3Qta2InKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUmVzb3VyY2UgRGVwZW5kZW5jaWVzJywgKCkgPT4ge1xuICAgICAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIHJlc291cmNlcyBpbiBjb3JyZWN0IGRlcGVuZGVuY3kgb3JkZXInLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDcmVhdGUga25vd2xlZGdlIGJhc2UgZmlyc3RcbiAgICAgICAgICAgIGNvbnN0IGtub3dsZWRnZUJhc2UgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgZGVwZW5kZW5jeSB0ZXN0aW5nJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgaW5zdHJ1Y3Rpb25zJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhZ2VudCB0aGF0IGRlcGVuZHMgb24ga25vd2xlZGdlIGJhc2VcbiAgICAgICAgICAgIGNvbnN0IGFnZW50ID0gbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdBZ2VudCB0aGF0IGRlcGVuZHMgb24ga25vd2xlZGdlIGJhc2UnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VzOiBba25vd2xlZGdlQmFzZV1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIFZlcmlmeSB0aGUgVGVzdEFnZW50IHJvbGUgaXMgY3JlYXRlZCB3aXRoIHByb3BlciB0cnVzdCBwb2xpY3kgZm9yIGJlZHJvY2stYWdlbnRjb3JlXG4gICAgICAgICAgICBjb25zdCBhbGxSb2xlcyA9IHRlbXBsYXRlLmZpbmRSZXNvdXJjZXMoJ0FXUzo6SUFNOjpSb2xlJyk7XG4gICAgICAgICAgICBjb25zdCB0ZXN0QWdlbnRSb2xlS2V5ID0gT2JqZWN0LmtleXMoYWxsUm9sZXMpLmZpbmQoa2V5ID0+IGtleS5zdGFydHNXaXRoKCdUZXN0QWdlbnRBZ2VudFJvbGUnKSk7XG4gICAgICAgICAgICBleHBlY3QodGVzdEFnZW50Um9sZUtleSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRlc3RBZ2VudFJvbGVLZXkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXN0QWdlbnRSb2xlID0gYWxsUm9sZXNbdGVzdEFnZW50Um9sZUtleV07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gVmVyaWZ5IGl0IGhhcyB0aGUgY29ycmVjdCB0cnVzdCBwb2xpY3kgZm9yIGJlZHJvY2stYWdlbnRjb3JlIHNlcnZpY2VcbiAgICAgICAgICAgICAgICBleHBlY3QodGVzdEFnZW50Um9sZS5Qcm9wZXJ0aWVzLkFzc3VtZVJvbGVQb2xpY3lEb2N1bWVudC5TdGF0ZW1lbnQpLnRvRXF1YWwoXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdC5hcnJheUNvbnRhaW5pbmcoW1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdiZWRyb2NrLWFnZW50Y29yZS5hbWF6b25hd3MuY29tJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29uZGl0aW9uOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczogZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2F3czpTb3VyY2VBY2NvdW50JzogZXhwZWN0LmFueShPYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcm5MaWtlOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXdzOlNvdXJjZUFybic6IGV4cGVjdC5hbnkoT2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFZlcmlmeSB0aGF0IHRoZSBhZ2VudCBoYXMgYW4gYXNzb2NpYXRlZCBJQU0gcG9saWN5IChwZXJtaXNzaW9ucyBhcmUgdGVzdGVkIGluIHVuaXQgdGVzdHMpXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpQb2xpY3knLCB7XG4gICAgICAgICAgICAgICAgUm9sZXM6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgIHsgUmVmOiB0ZXN0QWdlbnRSb2xlS2V5IH1cbiAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGV4cGVjdChhZ2VudC5hZ2VudE5hbWUpLnRvQmUoJ3Rlc3QtYWdlbnQnKTtcbiAgICAgICAgICAgIGV4cGVjdChrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VOYW1lKS50b0JlKCd0ZXN0LWtiJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgY2lyY3VsYXIgZGVwZW5kZW5jaWVzIGdyYWNlZnVsbHknLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBUaGlzIHRlc3QgZW5zdXJlcyB0aGF0IGNyZWF0aW5nIGNvbnN0cnVjdHMgaW4gYW55IG9yZGVyIHdvcmtzXG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBrbm93bGVkZ2UgYmFzZVxuICAgICAgICAgICAgY29uc3Qga25vd2xlZGdlQmFzZSA9IG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndGVzdC1rYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgaW5zdHJ1Y3Rpb25zJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIE5vdyBjcmVhdGUgYWdlbnQgd2l0aCBrbm93bGVkZ2UgYmFzZVxuICAgICAgICAgICAgY29uc3QgYWdlbnQgPSBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICd0ZXN0LWFnZW50JyxcbiAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1Rlc3QgYWdlbnQgaW5zdHJ1Y3Rpb25zJyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW2tub3dsZWRnZUJhc2VdXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gU2hvdWxkIG5vdCB0aHJvdyBhbnkgZXJyb3JzXG4gICAgICAgICAgICBleHBlY3QoYWdlbnQuYWdlbnROYW1lKS50b0JlKCd0ZXN0LWFnZW50Jyk7XG4gICAgICAgICAgICBleHBlY3Qoa25vd2xlZGdlQmFzZS5rbm93bGVkZ2VCYXNlTmFtZSkudG9CZSgndGVzdC1rYicpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdDcm9zcy1Db25zdHJ1Y3QgVmFsaWRhdGlvbicsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIHZhbGlkYXRlIGNvbXBhdGlibGUgY29uZmlndXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDcmVhdGUga25vd2xlZGdlIGJhc2Ugd2l0aCBzcGVjaWZpYyBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICBjb25zdCBrbm93bGVkZ2VCYXNlID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbXBhdGlibGUga25vd2xlZGdlIGJhc2UnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnQ29tcGF0aWJsZSBrbm93bGVkZ2UgYmFzZSBpbnN0cnVjdGlvbnMnLFxuICAgICAgICAgICAgICAgIGNodW5raW5nU3RyYXRlZ3k6IHtcbiAgICAgICAgICAgICAgICAgICAgbWF4VG9rZW5zOiAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwUGVyY2VudGFnZTogMTVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGFnZW50IHdpdGggY29tcGF0aWJsZSBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICBjb25zdCBhZ2VudCA9IG5ldyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50KHN0YWNrLCAnVGVzdEFnZW50Jywge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnQWdlbnQgd2l0aCBjb21wYXRpYmxlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBrbm93bGVkZ2UgYmFzZScsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFtrbm93bGVkZ2VCYXNlXSxcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogJ0hUVFBTJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gU2hvdWxkIGNyZWF0ZSBhbGwgcmVzb3VyY2VzIHN1Y2Nlc3NmdWxseVxuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkJlZHJvY2s6Oktub3dsZWRnZUJhc2UnLCAxKTtcbiAgICAgICAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpCZWRyb2NrOjpEYXRhU291cmNlJywgMSk7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0N1c3RvbTo6QWdlbnRDb3JlUnVudGltZScsIDEpO1xuXG4gICAgICAgICAgICBleHBlY3QoYWdlbnQuYWdlbnROYW1lKS50b0JlKCd0ZXN0LWFnZW50Jyk7XG4gICAgICAgICAgICBleHBlY3Qoa25vd2xlZGdlQmFzZS5rbm93bGVkZ2VCYXNlTmFtZSkudG9CZSgndGVzdC1rYicpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdFbmQtdG8tRW5kIERlcGxveW1lbnQgU2NlbmFyaW9zJywgKCkgPT4ge1xuICAgICAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIGNvbXBsZXRlIFJBRyBzeXN0ZW0nLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgbXVsdGlwbGUga25vd2xlZGdlIGJhc2VzIGZvciBkaWZmZXJlbnQgZG9tYWluc1xuICAgICAgICAgICAgY29uc3QgZG9jc0tCID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnRG9jc0tCJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdkb2NzLWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RvY3VtZW50YXRpb24ga25vd2xlZGdlIGJhc2UnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3MvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSBmb3IgdGVjaG5pY2FsIGRvY3VtZW50YXRpb24nLFxuICAgICAgICAgICAgICAgIGNodW5raW5nU3RyYXRlZ3k6IHtcbiAgICAgICAgICAgICAgICAgICAgbWF4VG9rZW5zOiAxNTAwLFxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwUGVyY2VudGFnZTogMjVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVuYWJsZUluZ2VzdGlvbkFsYXJtczogdHJ1ZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGZhcUtCID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnRkFRS0InLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2ZhcS1rYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGQVEga25vd2xlZGdlIGJhc2UnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2ZhcS8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIGZvciBmcmVxdWVudGx5IGFza2VkIHF1ZXN0aW9ucycsXG4gICAgICAgICAgICAgICAgY2h1bmtpbmdTdHJhdGVneToge1xuICAgICAgICAgICAgICAgICAgICBtYXhUb2tlbnM6IDMwMCxcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcFBlcmNlbnRhZ2U6IDEwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbmFibGVJbmdlc3Rpb25BbGFybXM6IHRydWVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYWdlbnQgd2l0aCBhY2Nlc3MgdG8gYm90aCBrbm93bGVkZ2UgYmFzZXNcbiAgICAgICAgICAgIGNvbnN0IGFnZW50ID0gbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdSQUdBZ2VudCcsIHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICdyYWctYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnWW91IGFyZSBhIGhlbHBmdWwgYXNzaXN0YW50IHdpdGggYWNjZXNzIHRvIGRvY3VtZW50YXRpb24gYW5kIEZBUSBrbm93bGVkZ2UgYmFzZXMuIFVzZSB0aGUgZG9jcyBLQiBmb3IgdGVjaG5pY2FsIHF1ZXN0aW9ucyBhbmQgRkFRIEtCIGZvciBjb21tb24gcXVlc3Rpb25zLicsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3JhZy1hZ2VudCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdyYWctYWdlbnQvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW2RvY3NLQiwgZmFxS0JdLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiAncHJvZCcsXG4gICAgICAgICAgICAgICAgZW5hYmxlVHJhY2luZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjdXN0b21SZXNvdXJjZVRpbWVvdXRNaW51dGVzOiAyMFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gU2hvdWxkIGNyZWF0ZSBjb21wbGV0ZSBSQUcgc3lzdGVtXG4gICAgICAgICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6QmVkcm9jazo6S25vd2xlZGdlQmFzZScsIDIpO1xuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkJlZHJvY2s6OkRhdGFTb3VyY2UnLCAyKTtcbiAgICAgICAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpPcGVuU2VhcmNoU2VydmVybGVzczo6Q29sbGVjdGlvbicsIDIpO1xuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OlN0ZXBGdW5jdGlvbnM6OlN0YXRlTWFjaGluZScsIDIpO1xuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkV2ZW50czo6UnVsZScsIDIpO1xuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdDdXN0b206OkFnZW50Q29yZVJ1bnRpbWUnLCAxKTtcblxuICAgICAgICAgICAgLy8gU2hvdWxkIGhhdmUgbW9uaXRvcmluZyBlbmFibGVkXG4gICAgICAgICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6Q2xvdWRXYXRjaDo6QWxhcm0nLCA2KTsgLy8gMyBhbGFybXMgcGVyIEtCXG5cbiAgICAgICAgICAgIGV4cGVjdChhZ2VudC5hZ2VudE5hbWUpLnRvQmUoJ3JhZy1hZ2VudCcpO1xuICAgICAgICAgICAgZXhwZWN0KGRvY3NLQi5rbm93bGVkZ2VCYXNlTmFtZSkudG9CZSgnZG9jcy1rYicpO1xuICAgICAgICAgICAgZXhwZWN0KGZhcUtCLmtub3dsZWRnZUJhc2VOYW1lKS50b0JlKCdmYXEta2InKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiXX0=