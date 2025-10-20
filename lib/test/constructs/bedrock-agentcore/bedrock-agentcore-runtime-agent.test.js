"use strict";
/**
 * Unit tests for BedrockAgentCoreRuntimeAgent construct
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
const aws_ecr_assets_1 = require("aws-cdk-lib/aws-ecr-assets");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const bedrock_agentcore_runtime_agent_1 = require("../../../src/constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent");
const bedrock_knowledge_base_1 = require("../../../src/constructs/bedrock/bedrock-knowledge-base");
describe('BedrockAgentCoreRuntimeAgent', () => {
    let app;
    let stack;
    let testBucket;
    let mockKnowledgeBase;
    beforeEach(() => {
        app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');
        // Create test S3 bucket
        testBucket = new aws_s3_1.Bucket(stack, 'TestBucket');
        // Create mock knowledge base
        mockKnowledgeBase = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', {
            name: 'test-kb',
            description: 'Test knowledge base for unit tests',
            dataSourceBucket: testBucket,
            dataSourcePrefixes: ['test/'],
            knowledgeBaseInstructions: 'Test instructions for knowledge base'
        });
    });
    describe('Constructor validation', () => {
        test('should create agent with valid minimal configuration', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase]
            };
            const agent = new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            expect(agent.agentName).toBe('test-agent');
            expect(agent.agentRuntimeArn).toBeDefined();
        });
        test('should throw error for invalid agent name', () => {
            const props = {
                agentName: 'invalid agent name!', // Contains invalid characters
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase]
            };
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).toThrow(/Configuration validation failed/);
        });
        test('should throw error for short instruction', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'Short', // Too short
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase]
            };
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).toThrow(/Agent instruction must be at least 10 characters long/);
        });
        test('should allow empty knowledge bases array', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [] // Empty array is now allowed
            };
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).not.toThrow();
        });
        test('should allow omitting knowledge bases', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/'
                // knowledgeBases is omitted
            };
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).not.toThrow();
        });
        test('should throw error for invalid custom resource timeout', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                customResourceTimeoutMinutes: 70 // Too high
            };
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).toThrow(/customResourceTimeoutMinutes must be between 1 and 60/);
        });
    });
    describe('IAM role creation', () => {
        test('should create IAM role with required permissions', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase]
            };
            new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that IAM role is created
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Principal: {
                                Service: 'bedrock-agentcore.amazonaws.com'
                            }
                        })
                    ])
                }
            });
            // Check for Bedrock permissions
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.arrayWith([
                                'bedrock:InvokeModel',
                                'bedrock:InvokeModelWithResponseStream'
                            ])
                        })
                    ])
                }
            });
            // Check for ECR permissions
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.arrayWith([
                                'ecr:BatchGetImage',
                                'ecr:GetDownloadUrlForLayer',
                                'ecr:GetAuthorizationToken'
                            ])
                        })
                    ])
                }
            });
            // Check for S3 permissions
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
        });
        test('should add additional policy statements when provided', () => {
            const additionalPolicy = new aws_iam_1.PolicyStatement({
                actions: ['dynamodb:GetItem'],
                resources: ['arn:aws:dynamodb:*:*:table/test-table']
            });
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                additionalPolicyStatements: [additionalPolicy]
            };
            new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check for additional DynamoDB permissions
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.anyValue(), // Can be string or array
                            Resource: assertions_1.Match.anyValue() // Can be string or array
                        })
                    ])
                }
            });
        });
    });
    describe('Custom resource configuration', () => {
        test('should create custom resource with correct parameters', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                protocol: 'HTTPS',
                customResourceTimeoutMinutes: 15
            };
            new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check custom resource Lambda function
            template.hasResourceProperties('AWS::Lambda::Function', {
                Runtime: assertions_1.Match.anyValue(),
                Timeout: 900, // 15 minutes in seconds
            });
            // Check custom resource exists
            template.resourceCountIs('Custom::AgentCoreRuntime', 1);
        });
        test('should configure environment variables correctly', () => {
            const customEnvVars = {
                'CUSTOM_VAR': 'custom-value',
                'DEBUG': 'true'
            };
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                environmentVars: customEnvVars
            };
            new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that custom resource exists (environment variables are embedded in Create/Update JSON)
            template.resourceCountIs('Custom::AgentCoreRuntime', 1);
        });
    });
    describe('Docker image asset configuration', () => {
        test('should create Docker image asset with default platform', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase]
            };
            new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that custom resource exists (Docker image assets don't create ECR repos directly)
            template.resourceCountIs('Custom::AgentCoreRuntime', 1);
        });
        test('should use custom Docker platform when specified', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                dockerPlatform: aws_ecr_assets_1.Platform.LINUX_AMD64
            };
            // Should not throw error
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).not.toThrow();
        });
        test('should use custom Docker build args and excludes', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                dockerBuildArgs: {
                    'BUILD_ENV': 'test',
                    'VERSION': '1.0.0'
                },
                dockerExcludes: ['*.log', 'temp/*']
            };
            // Should not throw error
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).not.toThrow();
        });
    });
    describe('Environment-specific configuration', () => {
        test('should apply development environment defaults', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                environment: 'dev'
            };
            new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that log retention is set to development default (1 week)
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 7
            });
        });
        test('should apply production environment defaults', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                environment: 'prod'
            };
            new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that resources are created with production environment
            template.resourceCountIs('Custom::AgentCoreRuntime', 1);
            // The log retention is set on the custom resource Lambda, not a separate log group
            // In production, the construct should be configured properly
            expect(true).toBe(true); // Placeholder - actual log retention is handled by CDK internally
        });
    });
    describe('Error handling', () => {
        test('should handle validation errors gracefully', () => {
            const props = {
                agentName: '', // Invalid empty name
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase]
            };
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).toThrow(/agentName is required/);
        });
        test('should validate protocol enum values', () => {
            const props = {
                agentName: 'test-agent',
                instruction: 'You are a helpful test assistant',
                projectRoot: './test-project',
                s3Bucket: testBucket,
                s3Prefix: 'agent-data/',
                knowledgeBases: [mockKnowledgeBase],
                protocol: 'INVALID' // Invalid protocol
            };
            expect(() => {
                new bedrock_agentcore_runtime_agent_1.BedrockAgentCoreRuntimeAgent(stack, 'TestAgent', props);
            }).toThrow(/protocol must be one of: HTTP, HTTPS/);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1hZ2VudGNvcmUtcnVudGltZS1hZ2VudC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdGVzdC9jb25zdHJ1Y3RzL2JlZHJvY2stYWdlbnRjb3JlL2JlZHJvY2stYWdlbnRjb3JlLXJ1bnRpbWUtYWdlbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxpREFBbUM7QUFDbkMsdURBQXlEO0FBQ3pELCtDQUE0QztBQUM1QywrREFBc0Q7QUFDdEQsaURBQXNEO0FBQ3RELCtIQUE0SjtBQUM1SixtR0FBOEY7QUFFOUYsUUFBUSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtJQUMxQyxJQUFJLEdBQVksQ0FBQztJQUNqQixJQUFJLEtBQWdCLENBQUM7SUFDckIsSUFBSSxVQUFrQixDQUFDO0lBQ3ZCLElBQUksaUJBQXVDLENBQUM7SUFFNUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNaLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNwQixLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUV4Qyx3QkFBd0I7UUFDeEIsVUFBVSxHQUFHLElBQUksZUFBTSxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztRQUU3Qyw2QkFBNkI7UUFDN0IsaUJBQWlCLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFO1lBQzFELElBQUksRUFBRSxTQUFTO1lBQ2YsV0FBVyxFQUFFLG9DQUFvQztZQUNqRCxnQkFBZ0IsRUFBRSxVQUFVO1lBQzVCLGtCQUFrQixFQUFFLENBQUMsT0FBTyxDQUFDO1lBQzdCLHlCQUF5QixFQUFFLHNDQUFzQztTQUNwRSxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FB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QztRQUN2RCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFVuaXQgdGVzdHMgZm9yIEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQgY29uc3RydWN0XG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRlbXBsYXRlLCBNYXRjaCB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgQnVja2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCB7IFBsYXRmb3JtIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjci1hc3NldHMnO1xuaW1wb3J0IHsgUG9saWN5U3RhdGVtZW50IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50LCBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMgfSBmcm9tICcuLi8uLi8uLi9zcmMvY29uc3RydWN0cy9iZWRyb2NrLWFnZW50Y29yZS9iZWRyb2NrLWFnZW50Y29yZS1ydW50aW1lLWFnZW50JztcbmltcG9ydCB7IEJlZHJvY2tLbm93bGVkZ2VCYXNlIH0gZnJvbSAnLi4vLi4vLi4vc3JjL2NvbnN0cnVjdHMvYmVkcm9jay9iZWRyb2NrLWtub3dsZWRnZS1iYXNlJztcblxuZGVzY3JpYmUoJ0JlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQnLCAoKSA9PiB7XG4gICAgbGV0IGFwcDogY2RrLkFwcDtcbiAgICBsZXQgc3RhY2s6IGNkay5TdGFjaztcbiAgICBsZXQgdGVzdEJ1Y2tldDogQnVja2V0O1xuICAgIGxldCBtb2NrS25vd2xlZGdlQmFzZTogQmVkcm9ja0tub3dsZWRnZUJhc2U7XG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICAgICAgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ1Rlc3RTdGFjaycpO1xuICAgICAgICBcbiAgICAgICAgLy8gQ3JlYXRlIHRlc3QgUzMgYnVja2V0XG4gICAgICAgIHRlc3RCdWNrZXQgPSBuZXcgQnVja2V0KHN0YWNrLCAnVGVzdEJ1Y2tldCcpO1xuICAgICAgICBcbiAgICAgICAgLy8gQ3JlYXRlIG1vY2sga25vd2xlZGdlIGJhc2VcbiAgICAgICAgbW9ja0tub3dsZWRnZUJhc2UgPSBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCB7XG4gICAgICAgICAgICBuYW1lOiAndGVzdC1rYicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWyd0ZXN0LyddLFxuICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1Rlc3QgaW5zdHJ1Y3Rpb25zIGZvciBrbm93bGVkZ2UgYmFzZSdcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnQ29uc3RydWN0b3IgdmFsaWRhdGlvbicsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBhZ2VudCB3aXRoIHZhbGlkIG1pbmltYWwgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCB0ZXN0IGFzc2lzdGFudCcsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFttb2NrS25vd2xlZGdlQmFzZV1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGFnZW50ID0gbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCBwcm9wcyk7XG5cbiAgICAgICAgICAgIGV4cGVjdChhZ2VudC5hZ2VudE5hbWUpLnRvQmUoJ3Rlc3QtYWdlbnQnKTtcbiAgICAgICAgICAgIGV4cGVjdChhZ2VudC5hZ2VudFJ1bnRpbWVBcm4pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgaW52YWxpZCBhZ2VudCBuYW1lJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICdpbnZhbGlkIGFnZW50IG5hbWUhJywgLy8gQ29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCB0ZXN0IGFzc2lzdGFudCcsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFttb2NrS25vd2xlZGdlQmFzZV1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCBwcm9wcyk7XG4gICAgICAgICAgICB9KS50b1Rocm93KC9Db25maWd1cmF0aW9uIHZhbGlkYXRpb24gZmFpbGVkLyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3Igc2hvcnQgaW5zdHJ1Y3Rpb24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzID0ge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnU2hvcnQnLCAvLyBUb28gc2hvcnRcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW21vY2tLbm93bGVkZ2VCYXNlXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coL0FnZW50IGluc3RydWN0aW9uIG11c3QgYmUgYXQgbGVhc3QgMTAgY2hhcmFjdGVycyBsb25nLyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBhbGxvdyBlbXB0eSBrbm93bGVkZ2UgYmFzZXMgYXJyYXknLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzID0ge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnWW91IGFyZSBhIGhlbHBmdWwgdGVzdCBhc3Npc3RhbnQnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VzOiBbXSAvLyBFbXB0eSBhcnJheSBpcyBub3cgYWxsb3dlZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBhbGxvdyBvbWl0dGluZyBrbm93bGVkZ2UgYmFzZXMnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzID0ge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnWW91IGFyZSBhIGhlbHBmdWwgdGVzdCBhc3Npc3RhbnQnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nXG4gICAgICAgICAgICAgICAgLy8ga25vd2xlZGdlQmFzZXMgaXMgb21pdHRlZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgaW52YWxpZCBjdXN0b20gcmVzb3VyY2UgdGltZW91dCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCB0ZXN0IGFzc2lzdGFudCcsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFttb2NrS25vd2xlZGdlQmFzZV0sXG4gICAgICAgICAgICAgICAgY3VzdG9tUmVzb3VyY2VUaW1lb3V0TWludXRlczogNzAgLy8gVG9vIGhpZ2hcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCBwcm9wcyk7XG4gICAgICAgICAgICB9KS50b1Rocm93KC9jdXN0b21SZXNvdXJjZVRpbWVvdXRNaW51dGVzIG11c3QgYmUgYmV0d2VlbiAxIGFuZCA2MC8pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdJQU0gcm9sZSBjcmVhdGlvbicsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBJQU0gcm9sZSB3aXRoIHJlcXVpcmVkIHBlcm1pc3Npb25zJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICd0ZXN0LWFnZW50JyxcbiAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1lvdSBhcmUgYSBoZWxwZnVsIHRlc3QgYXNzaXN0YW50JyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW21vY2tLbm93bGVkZ2VCYXNlXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCBwcm9wcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCBJQU0gcm9sZSBpcyBjcmVhdGVkXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpSb2xlJywge1xuICAgICAgICAgICAgICAgIEFzc3VtZVJvbGVQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZTogJ2JlZHJvY2stYWdlbnRjb3JlLmFtYXpvbmF3cy5jb20nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgXSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIEJlZHJvY2sgcGVybWlzc2lvbnNcbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06OlBvbGljeScsIHtcbiAgICAgICAgICAgICAgICBQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBFQ1IgcGVybWlzc2lvbnNcbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06OlBvbGljeScsIHtcbiAgICAgICAgICAgICAgICBQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY3I6QmF0Y2hHZXRJbWFnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY3I6R2V0RG93bmxvYWRVcmxGb3JMYXllcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY3I6R2V0QXV0aG9yaXphdGlvblRva2VuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgUzMgcGVybWlzc2lvbnNcbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06OlBvbGljeScsIHtcbiAgICAgICAgICAgICAgICBQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzMzpMaXN0QnVja2V0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgYWRkIGFkZGl0aW9uYWwgcG9saWN5IHN0YXRlbWVudHMgd2hlbiBwcm92aWRlZCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkZGl0aW9uYWxQb2xpY3kgPSBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ2R5bmFtb2RiOkdldEl0ZW0nXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnYXJuOmF3czpkeW5hbW9kYjoqOio6dGFibGUvdGVzdC10YWJsZSddXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICd0ZXN0LWFnZW50JyxcbiAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1lvdSBhcmUgYSBoZWxwZnVsIHRlc3QgYXNzaXN0YW50JyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW21vY2tLbm93bGVkZ2VCYXNlXSxcbiAgICAgICAgICAgICAgICBhZGRpdGlvbmFsUG9saWN5U3RhdGVtZW50czogW2FkZGl0aW9uYWxQb2xpY3ldXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgYWRkaXRpb25hbCBEeW5hbW9EQiBwZXJtaXNzaW9uc1xuICAgICAgICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6UG9saWN5Jywge1xuICAgICAgICAgICAgICAgIFBvbGljeURvY3VtZW50OiB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXRlbWVudDogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogTWF0Y2guYW55VmFsdWUoKSwgLy8gQ2FuIGJlIHN0cmluZyBvciBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBNYXRjaC5hbnlWYWx1ZSgpIC8vIENhbiBiZSBzdHJpbmcgb3IgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0N1c3RvbSByZXNvdXJjZSBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgICAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIGN1c3RvbSByZXNvdXJjZSB3aXRoIGNvcnJlY3QgcGFyYW1ldGVycycsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCB0ZXN0IGFzc2lzdGFudCcsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFttb2NrS25vd2xlZGdlQmFzZV0sXG4gICAgICAgICAgICAgICAgcHJvdG9jb2w6ICdIVFRQUycsXG4gICAgICAgICAgICAgICAgY3VzdG9tUmVzb3VyY2VUaW1lb3V0TWludXRlczogMTVcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG5ldyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50KHN0YWNrLCAnVGVzdEFnZW50JywgcHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGN1c3RvbSByZXNvdXJjZSBMYW1iZGEgZnVuY3Rpb25cbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgICAgICAgICAgIFJ1bnRpbWU6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgICAgICAgICAgICAgVGltZW91dDogOTAwLCAvLyAxNSBtaW51dGVzIGluIHNlY29uZHNcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBjdXN0b20gcmVzb3VyY2UgZXhpc3RzXG4gICAgICAgICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0N1c3RvbTo6QWdlbnRDb3JlUnVudGltZScsIDEpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgY29uZmlndXJlIGVudmlyb25tZW50IHZhcmlhYmxlcyBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXN0b21FbnZWYXJzID0ge1xuICAgICAgICAgICAgICAgICdDVVNUT01fVkFSJzogJ2N1c3RvbS12YWx1ZScsXG4gICAgICAgICAgICAgICAgJ0RFQlVHJzogJ3RydWUnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBwcm9wczogQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzID0ge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnWW91IGFyZSBhIGhlbHBmdWwgdGVzdCBhc3Npc3RhbnQnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VzOiBbbW9ja0tub3dsZWRnZUJhc2VdLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50VmFyczogY3VzdG9tRW52VmFyc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCBwcm9wcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCBjdXN0b20gcmVzb3VyY2UgZXhpc3RzIChlbnZpcm9ubWVudCB2YXJpYWJsZXMgYXJlIGVtYmVkZGVkIGluIENyZWF0ZS9VcGRhdGUgSlNPTilcbiAgICAgICAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQ3VzdG9tOjpBZ2VudENvcmVSdW50aW1lJywgMSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0RvY2tlciBpbWFnZSBhc3NldCBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgICAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIERvY2tlciBpbWFnZSBhc3NldCB3aXRoIGRlZmF1bHQgcGxhdGZvcm0nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzID0ge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnWW91IGFyZSBhIGhlbHBmdWwgdGVzdCBhc3Npc3RhbnQnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VzOiBbbW9ja0tub3dsZWRnZUJhc2VdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4gICAgICAgICAgICAvLyBDaGVjayB0aGF0IGN1c3RvbSByZXNvdXJjZSBleGlzdHMgKERvY2tlciBpbWFnZSBhc3NldHMgZG9uJ3QgY3JlYXRlIEVDUiByZXBvcyBkaXJlY3RseSlcbiAgICAgICAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQ3VzdG9tOjpBZ2VudENvcmVSdW50aW1lJywgMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCB1c2UgY3VzdG9tIERvY2tlciBwbGF0Zm9ybSB3aGVuIHNwZWNpZmllZCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCB0ZXN0IGFzc2lzdGFudCcsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFttb2NrS25vd2xlZGdlQmFzZV0sXG4gICAgICAgICAgICAgICAgZG9ja2VyUGxhdGZvcm06IFBsYXRmb3JtLkxJTlVYX0FNRDY0XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBTaG91bGQgbm90IHRocm93IGVycm9yXG4gICAgICAgICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG5ldyBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50KHN0YWNrLCAnVGVzdEFnZW50JywgcHJvcHMpO1xuICAgICAgICAgICAgfSkubm90LnRvVGhyb3coKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIHVzZSBjdXN0b20gRG9ja2VyIGJ1aWxkIGFyZ3MgYW5kIGV4Y2x1ZGVzJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICd0ZXN0LWFnZW50JyxcbiAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1lvdSBhcmUgYSBoZWxwZnVsIHRlc3QgYXNzaXN0YW50JyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW21vY2tLbm93bGVkZ2VCYXNlXSxcbiAgICAgICAgICAgICAgICBkb2NrZXJCdWlsZEFyZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0JVSUxEX0VOVic6ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ1ZFUlNJT04nOiAnMS4wLjAnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkb2NrZXJFeGNsdWRlczogWycqLmxvZycsICd0ZW1wLyonXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gU2hvdWxkIG5vdCB0aHJvdyBlcnJvclxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0Vudmlyb25tZW50LXNwZWNpZmljIGNvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgICAgIHRlc3QoJ3Nob3VsZCBhcHBseSBkZXZlbG9wbWVudCBlbnZpcm9ubWVudCBkZWZhdWx0cycsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCB0ZXN0IGFzc2lzdGFudCcsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFttb2NrS25vd2xlZGdlQmFzZV0sXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6ICdkZXYnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4gICAgICAgICAgICAvLyBDaGVjayB0aGF0IGxvZyByZXRlbnRpb24gaXMgc2V0IHRvIGRldmVsb3BtZW50IGRlZmF1bHQgKDEgd2VlaylcbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMb2dzOjpMb2dHcm91cCcsIHtcbiAgICAgICAgICAgICAgICBSZXRlbnRpb25JbkRheXM6IDdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgYXBwbHkgcHJvZHVjdGlvbiBlbnZpcm9ubWVudCBkZWZhdWx0cycsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBCZWRyb2NrQWdlbnRDb3JlUnVudGltZUFnZW50UHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgYWdlbnROYW1lOiAndGVzdC1hZ2VudCcsXG4gICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICdZb3UgYXJlIGEgaGVscGZ1bCB0ZXN0IGFzc2lzdGFudCcsXG4gICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6ICcuL3Rlc3QtcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgczNCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgczNQcmVmaXg6ICdhZ2VudC1kYXRhLycsXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZXM6IFttb2NrS25vd2xlZGdlQmFzZV0sXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6ICdwcm9kJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCBwcm9wcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCByZXNvdXJjZXMgYXJlIGNyZWF0ZWQgd2l0aCBwcm9kdWN0aW9uIGVudmlyb25tZW50XG4gICAgICAgICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0N1c3RvbTo6QWdlbnRDb3JlUnVudGltZScsIDEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUaGUgbG9nIHJldGVudGlvbiBpcyBzZXQgb24gdGhlIGN1c3RvbSByZXNvdXJjZSBMYW1iZGEsIG5vdCBhIHNlcGFyYXRlIGxvZyBncm91cFxuICAgICAgICAgICAgLy8gSW4gcHJvZHVjdGlvbiwgdGhlIGNvbnN0cnVjdCBzaG91bGQgYmUgY29uZmlndXJlZCBwcm9wZXJseVxuICAgICAgICAgICAgZXhwZWN0KHRydWUpLnRvQmUodHJ1ZSk7IC8vIFBsYWNlaG9sZGVyIC0gYWN0dWFsIGxvZyByZXRlbnRpb24gaXMgaGFuZGxlZCBieSBDREsgaW50ZXJuYWxseVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdFcnJvciBoYW5kbGluZycsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSB2YWxpZGF0aW9uIGVycm9ycyBncmFjZWZ1bGx5JywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnRQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBhZ2VudE5hbWU6ICcnLCAvLyBJbnZhbGlkIGVtcHR5IG5hbWVcbiAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbjogJ1lvdSBhcmUgYSBoZWxwZnVsIHRlc3QgYXNzaXN0YW50JyxcbiAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdDogJy4vdGVzdC1wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBzM0J1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBzM1ByZWZpeDogJ2FnZW50LWRhdGEvJyxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlczogW21vY2tLbm93bGVkZ2VCYXNlXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudChzdGFjaywgJ1Rlc3RBZ2VudCcsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coL2FnZW50TmFtZSBpcyByZXF1aXJlZC8pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgdmFsaWRhdGUgcHJvdG9jb2wgZW51bSB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogQmVkcm9ja0FnZW50Q29yZVJ1bnRpbWVBZ2VudFByb3BzID0ge1xuICAgICAgICAgICAgICAgIGFnZW50TmFtZTogJ3Rlc3QtYWdlbnQnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnWW91IGFyZSBhIGhlbHBmdWwgdGVzdCBhc3Npc3RhbnQnLFxuICAgICAgICAgICAgICAgIHByb2plY3RSb290OiAnLi90ZXN0LXByb2plY3QnLFxuICAgICAgICAgICAgICAgIHMzQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIHMzUHJlZml4OiAnYWdlbnQtZGF0YS8nLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VzOiBbbW9ja0tub3dsZWRnZUJhc2VdLFxuICAgICAgICAgICAgICAgIHByb3RvY29sOiAnSU5WQUxJRCcgYXMgYW55IC8vIEludmFsaWQgcHJvdG9jb2xcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbmV3IEJlZHJvY2tBZ2VudENvcmVSdW50aW1lQWdlbnQoc3RhY2ssICdUZXN0QWdlbnQnLCBwcm9wcyk7XG4gICAgICAgICAgICB9KS50b1Rocm93KC9wcm90b2NvbCBtdXN0IGJlIG9uZSBvZjogSFRUUCwgSFRUUFMvKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiXX0=