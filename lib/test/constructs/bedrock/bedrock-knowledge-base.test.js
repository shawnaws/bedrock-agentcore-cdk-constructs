"use strict";
/**
 * Unit tests for BedrockKnowledgeBase construct
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
const generative_ai_cdk_constructs_1 = require("@cdklabs/generative-ai-cdk-constructs");
const bedrock_knowledge_base_1 = require("../../../src/constructs/bedrock/bedrock-knowledge-base");
describe('BedrockKnowledgeBase', () => {
    let app;
    let stack;
    let testBucket;
    beforeEach(() => {
        app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');
        // Create test S3 bucket
        testBucket = new aws_s3_1.Bucket(stack, 'TestBucket');
    });
    describe('Constructor validation', () => {
        test('should create knowledge base with valid minimal configuration', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            const kb = new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            expect(kb.knowledgeBaseName).toBe('test-kb');
            expect(kb.vectorKb).toBeDefined();
            expect(kb.kbS3Ds).toBeDefined();
        });
        test('should throw error for invalid knowledge base name', () => {
            const props = {
                name: 'invalid kb name!', // Contains invalid characters
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Configuration validation failed/);
        });
        test('should throw error for short description', () => {
            const props = {
                name: 'test-kb',
                description: 'Short', // Too short
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Knowledge base description must be at least 10 characters long/);
        });
        test('should throw error for long description', () => {
            const props = {
                name: 'test-kb',
                description: 'A'.repeat(1001), // Too long
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Knowledge base description must be 1000 characters or less/);
        });
        test('should throw error for short instructions', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Short' // Too short
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Knowledge base instructions must be at least 10 characters long/);
        });
        test('should throw error for empty data source prefixes', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: [], // Empty array
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/dataSourcePrefixes must be a non-empty array/);
        });
        test('should throw error for invalid sync interval', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                dataSourceSyncMinutes: 1500 // Too high (over 24 hours)
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/dataSourceSyncMinutes must be between 1 and 1440/);
        });
        test('should throw error for invalid chunking strategy', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                chunkingStrategy: {
                    maxTokens: 50, // Too low
                    overlapPercentage: 20
                }
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/chunkingStrategy.maxTokens must be between 100 and 8192/);
        });
    });
    describe('Vector knowledge base creation', () => {
        test('should create vector knowledge base with default embedding model', () => {
            const props = {
                name: 'KBTestStackTestKbtest',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that knowledge base is created
            template.hasResourceProperties('AWS::Bedrock::KnowledgeBase', {
                Name: assertions_1.Match.stringLikeRegexp('KBTestStackTekTestKbtest'),
                Description: 'Test knowledge base for unit tests',
                KnowledgeBaseConfiguration: {
                    Type: 'VECTOR',
                    VectorKnowledgeBaseConfiguration: {
                        EmbeddingModelArn: assertions_1.Match.anyValue()
                    }
                }
            });
        });
        test('should create vector knowledge base with custom embedding model', () => {
            const props = {
                name: 'KBTestStackTekTestKbtest',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                embeddingModel: generative_ai_cdk_constructs_1.bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that knowledge base uses custom embedding model
            template.hasResourceProperties('AWS::Bedrock::KnowledgeBase', {
                KnowledgeBaseConfiguration: {
                    VectorKnowledgeBaseConfiguration: {
                        EmbeddingModelArn: assertions_1.Match.anyValue()
                    }
                }
            });
        });
        test('should create OpenSearch Serverless collection', () => {
            const props = {
                name: 'KBTestStackTekTestKbtest',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that OpenSearch Serverless collection is created
            template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
                Type: 'VECTORSEARCH'
            });
            // Check security policy
            template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
                Type: 'encryption'
            });
        });
    });
    describe('S3 data source configuration', () => {
        test('should create S3 data source with default chunking strategy', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/', 'policies/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that data source is created
            template.hasResourceProperties('AWS::Bedrock::DataSource', {
                Name: 'test-kb',
                DataSourceConfiguration: {
                    Type: 'S3',
                    S3Configuration: {
                        BucketArn: {
                            'Fn::GetAtt': [assertions_1.Match.anyValue(), 'Arn']
                        },
                        InclusionPrefixes: ['documents/', 'policies/']
                    }
                },
                VectorIngestionConfiguration: {
                    ChunkingConfiguration: {
                        ChunkingStrategy: 'FIXED_SIZE',
                        FixedSizeChunkingConfiguration: {
                            MaxTokens: 500,
                            OverlapPercentage: 20
                        }
                    }
                }
            });
        });
        test('should create S3 data source with custom chunking strategy', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                chunkingStrategy: {
                    maxTokens: 1000,
                    overlapPercentage: 15
                }
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check custom chunking configuration
            template.hasResourceProperties('AWS::Bedrock::DataSource', {
                VectorIngestionConfiguration: {
                    ChunkingConfiguration: {
                        FixedSizeChunkingConfiguration: {
                            MaxTokens: 1000,
                            OverlapPercentage: 15
                        }
                    }
                }
            });
        });
    });
    describe('Ingestion pipeline', () => {
        test('should create Step Functions state machine for ingestion', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that Step Functions state machine is created
            template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                DefinitionString: assertions_1.Match.objectLike({
                    'Fn::Join': assertions_1.Match.anyValue(),
                }),
                RoleArn: {
                    'Fn::GetAtt': [assertions_1.Match.anyValue(), 'Arn']
                }
            });
            // Check IAM role for state machine
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Principal: {
                                Service: 'states.amazonaws.com'
                            }
                        })
                    ])
                }
            });
            // Check ingestion permissions
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.exact('bedrockagent:startIngestionJob')
                        })
                    ])
                }
            });
        });
        test('should create EventBridge rule for scheduled ingestion', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                dataSourceSyncMinutes: 30
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check EventBridge rule
            template.hasResourceProperties('AWS::Events::Rule', {
                ScheduleExpression: 'rate(30 minutes)',
                State: 'ENABLED',
                Targets: assertions_1.Match.arrayWith([
                    assertions_1.Match.objectLike({
                        Arn: {
                            Ref: assertions_1.Match.anyValue()
                        }
                    })
                ])
            });
        });
        test('should create CloudWatch log group for state machine', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check CloudWatch log group
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: assertions_1.Match.anyValue()
            });
        });
    });
    describe('CloudWatch alarms', () => {
        test('should create alarms when enabled', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                enableIngestionAlarms: true
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check for failure alarm
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'test-kb-ingestion-failures',
                AlarmDescription: 'Knowledge base test-kb ingestion job failures',
                MetricName: 'ExecutionsFailed',
                Namespace: 'AWS/States',
                Threshold: 1
            });
            // Check for timeout alarm
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'test-kb-ingestion-timeouts',
                AlarmDescription: 'Knowledge base test-kb ingestion job timeouts',
                MetricName: 'ExecutionsTimedOut',
                Namespace: 'AWS/States',
                Threshold: 1
            });
            // Check for duration alarm
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'test-kb-ingestion-duration',
                AlarmDescription: 'Knowledge base test-kb ingestion job duration warning',
                MetricName: 'ExecutionTime',
                Namespace: 'AWS/States'
            });
        });
        test('should not create alarms when disabled', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                enableIngestionAlarms: false
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that no alarms are created
            template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
        });
    });
    describe('Environment-specific configuration', () => {
        test('should apply development environment defaults', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                environment: 'dev'
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that log retention is set to development default (1 week)
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 7
            });
            // Check that alarms are disabled by default in dev
            template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
        });
        test('should apply production environment defaults', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                environment: 'prod'
            };
            new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            const template = assertions_1.Template.fromStack(stack);
            // Check that log retention is set to production default (6 months)
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 180
            });
            // Check that alarms are enabled by default in prod
            template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
        });
    });
    describe('Error handling', () => {
        test('should handle validation errors gracefully', () => {
            const props = {
                name: '', // Invalid empty name
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/name is required/);
        });
        test('should validate S3 prefix format', () => {
            const props = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents'], // Missing trailing slash
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };
            // Should create warning but not fail
            expect(() => {
                new bedrock_knowledge_base_1.BedrockKnowledgeBase(stack, 'TestKB', props);
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1rbm93bGVkZ2UtYmFzZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdGVzdC9jb25zdHJ1Y3RzL2JlZHJvY2svYmVkcm9jay1rbm93bGVkZ2UtYmFzZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQyx1REFBeUQ7QUFDekQsK0NBQTRDO0FBQzVDLHdGQUFnRTtBQUNoRSxtR0FBa0g7QUFFbEgsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtJQUNsQyxJQUFJLEdBQVksQ0FBQztJQUNqQixJQUFJLEtBQWdCLENBQUM7SUFDckIsSUFBSSxVQUFrQixDQUFDO0lBRXZCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDWixHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDcEIsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFeEMsd0JBQXdCO1FBQ3hCLFVBQVUsR0FBRyxJQUFJLGVBQU0sQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBQ3BDLElBQUksQ0FBQywrREFBK0QsRUFBRSxHQUFHLEVBQUU7WUFDdkUsTUFBTSxLQUFLLEdBQXVCO2dCQUM5QixJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsb0NBQW9DO2dCQUNqRCxnQkFBZ0IsRUFBRSxVQUFVO2dCQUM1QixrQkFBa0IsRUFBRSxDQUFDLFlBQVksQ0FBQztnQkFDbEMseUJBQXlCLEVBQUUsa0VBQWtFO2FBQ2hHLENBQUM7WUFFRixNQUFNLEVBQUUsR0FBRyxJQUFJLDZDQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FB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WSxDQUFDO2dCQUNsQyx5QkFBeUIsRUFBRSxrRUFBa0U7YUFDaEcsQ0FBQztZQUVGLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1IsSUFBSSw2Q0FBb0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtZQUMxQyxNQUFNLEtBQUssR0FBdUI7Z0JBQzlCLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxvQ0FBb0M7Z0JBQ2pELGdCQUFnQixFQUFFLFVBQVU7Z0JBQzVCLGtCQUFrQixFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUseUJBQXlCO2dCQUM1RCx5QkFBeUIsRUFBRSxrRUFBa0U7YUFDaEcsQ0FBQztZQUVGLHFDQUFxQztZQUNyQyxNQUFNLENBQUMsR0FBRyxFQUFFO2dCQUNSLElBQUksNkNBQW9CLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVbml0IHRlc3RzIGZvciBCZWRyb2NrS25vd2xlZGdlQmFzZSBjb25zdHJ1Y3RcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGVtcGxhdGUsIE1hdGNoIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgeyBCdWNrZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgYmVkcm9jayB9IGZyb20gJ0BjZGtsYWJzL2dlbmVyYXRpdmUtYWktY2RrLWNvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQmVkcm9ja0tub3dsZWRnZUJhc2UsIEtub3dsZWRnZUJhc2VQcm9wcyB9IGZyb20gJy4uLy4uLy4uL3NyYy9jb25zdHJ1Y3RzL2JlZHJvY2svYmVkcm9jay1rbm93bGVkZ2UtYmFzZSc7XG5cbmRlc2NyaWJlKCdCZWRyb2NrS25vd2xlZGdlQmFzZScsICgpID0+IHtcbiAgICBsZXQgYXBwOiBjZGsuQXBwO1xuICAgIGxldCBzdGFjazogY2RrLlN0YWNrO1xuICAgIGxldCB0ZXN0QnVja2V0OiBCdWNrZXQ7XG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICAgICAgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ1Rlc3RTdGFjaycpO1xuICAgICAgICBcbiAgICAgICAgLy8gQ3JlYXRlIHRlc3QgUzMgYnVja2V0XG4gICAgICAgIHRlc3RCdWNrZXQgPSBuZXcgQnVja2V0KHN0YWNrLCAnVGVzdEJ1Y2tldCcpO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0NvbnN0cnVjdG9yIHZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUga25vd2xlZGdlIGJhc2Ugd2l0aCB2YWxpZCBtaW5pbWFsIGNvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIHRoaXMga25vd2xlZGdlIGJhc2UgdG8gYW5zd2VyIHF1ZXN0aW9ucyBhYm91dCB0ZXN0IGRvY3VtZW50cydcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGtiID0gbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuXG4gICAgICAgICAgICBleHBlY3Qoa2Iua25vd2xlZGdlQmFzZU5hbWUpLnRvQmUoJ3Rlc3Qta2InKTtcbiAgICAgICAgICAgIGV4cGVjdChrYi52ZWN0b3JLYikudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChrYi5rYlMzRHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgaW52YWxpZCBrbm93bGVkZ2UgYmFzZSBuYW1lJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaW52YWxpZCBrYiBuYW1lIScsIC8vIENvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgdW5pdCB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCBwcm9wcyk7XG4gICAgICAgICAgICB9KS50b1Rocm93KC9Db25maWd1cmF0aW9uIHZhbGlkYXRpb24gZmFpbGVkLyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3Igc2hvcnQgZGVzY3JpcHRpb24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3J0JywgLy8gVG9vIHNob3J0XG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCBwcm9wcyk7XG4gICAgICAgICAgICB9KS50b1Rocm93KC9Lbm93bGVkZ2UgYmFzZSBkZXNjcmlwdGlvbiBtdXN0IGJlIGF0IGxlYXN0IDEwIGNoYXJhY3RlcnMgbG9uZy8pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIGxvbmcgZGVzY3JpcHRpb24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0EnLnJlcGVhdCgxMDAxKSwgLy8gVG9vIGxvbmdcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coL0tub3dsZWRnZSBiYXNlIGRlc2NyaXB0aW9uIG11c3QgYmUgMTAwMCBjaGFyYWN0ZXJzIG9yIGxlc3MvKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBzaG9ydCBpbnN0cnVjdGlvbnMnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnU2hvcnQnIC8vIFRvbyBzaG9ydFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCBwcm9wcyk7XG4gICAgICAgICAgICB9KS50b1Rocm93KC9Lbm93bGVkZ2UgYmFzZSBpbnN0cnVjdGlvbnMgbXVzdCBiZSBhdCBsZWFzdCAxMCBjaGFyYWN0ZXJzIGxvbmcvKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBlbXB0eSBkYXRhIHNvdXJjZSBwcmVmaXhlcycsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgdW5pdCB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFtdLCAvLyBFbXB0eSBhcnJheVxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCBwcm9wcyk7XG4gICAgICAgICAgICB9KS50b1Rocm93KC9kYXRhU291cmNlUHJlZml4ZXMgbXVzdCBiZSBhIG5vbi1lbXB0eSBhcnJheS8pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIGludmFsaWQgc3luYyBpbnRlcnZhbCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgdW5pdCB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlU3luY01pbnV0ZXM6IDE1MDAgLy8gVG9vIGhpZ2ggKG92ZXIgMjQgaG91cnMpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coL2RhdGFTb3VyY2VTeW5jTWludXRlcyBtdXN0IGJlIGJldHdlZW4gMSBhbmQgMTQ0MC8pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIGludmFsaWQgY2h1bmtpbmcgc3RyYXRlZ3knLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIHRoaXMga25vd2xlZGdlIGJhc2UgdG8gYW5zd2VyIHF1ZXN0aW9ucyBhYm91dCB0ZXN0IGRvY3VtZW50cycsXG4gICAgICAgICAgICAgICAgY2h1bmtpbmdTdHJhdGVneToge1xuICAgICAgICAgICAgICAgICAgICBtYXhUb2tlbnM6IDUwLCAvLyBUb28gbG93XG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXBQZXJjZW50YWdlOiAyMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuICAgICAgICAgICAgfSkudG9UaHJvdygvY2h1bmtpbmdTdHJhdGVneS5tYXhUb2tlbnMgbXVzdCBiZSBiZXR3ZWVuIDEwMCBhbmQgODE5Mi8pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdWZWN0b3Iga25vd2xlZGdlIGJhc2UgY3JlYXRpb24nLCAoKSA9PiB7XG4gICAgICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgdmVjdG9yIGtub3dsZWRnZSBiYXNlIHdpdGggZGVmYXVsdCBlbWJlZGRpbmcgbW9kZWwnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdLQlRlc3RTdGFja1Rlc3RLYnRlc3QnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgdW5pdCB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIHRoYXQga25vd2xlZGdlIGJhc2UgaXMgY3JlYXRlZFxuICAgICAgICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkJlZHJvY2s6Oktub3dsZWRnZUJhc2UnLCB7XG4gICAgICAgICAgICAgICAgTmFtZTogTWF0Y2guc3RyaW5nTGlrZVJlZ2V4cCgnS0JUZXN0U3RhY2tUZWtUZXN0S2J0ZXN0JyksXG4gICAgICAgICAgICAgICAgRGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlIGZvciB1bml0IHRlc3RzJyxcbiAgICAgICAgICAgICAgICBLbm93bGVkZ2VCYXNlQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBUeXBlOiAnVkVDVE9SJyxcbiAgICAgICAgICAgICAgICAgICAgVmVjdG9yS25vd2xlZGdlQmFzZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVtYmVkZGluZ01vZGVsQXJuOiBNYXRjaC5hbnlWYWx1ZSgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSB2ZWN0b3Iga25vd2xlZGdlIGJhc2Ugd2l0aCBjdXN0b20gZW1iZWRkaW5nIG1vZGVsJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnS0JUZXN0U3RhY2tUZWtUZXN0S2J0ZXN0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIHRoaXMga25vd2xlZGdlIGJhc2UgdG8gYW5zd2VyIHF1ZXN0aW9ucyBhYm91dCB0ZXN0IGRvY3VtZW50cycsXG4gICAgICAgICAgICAgICAgZW1iZWRkaW5nTW9kZWw6IGJlZHJvY2suQmVkcm9ja0ZvdW5kYXRpb25Nb2RlbC5USVRBTl9FTUJFRF9URVhUX1YyXzEwMjRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHByb3BzKTtcblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4gICAgICAgICAgICAvLyBDaGVjayB0aGF0IGtub3dsZWRnZSBiYXNlIHVzZXMgY3VzdG9tIGVtYmVkZGluZyBtb2RlbFxuICAgICAgICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkJlZHJvY2s6Oktub3dsZWRnZUJhc2UnLCB7XG4gICAgICAgICAgICAgICAgS25vd2xlZGdlQmFzZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgVmVjdG9yS25vd2xlZGdlQmFzZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVtYmVkZGluZ01vZGVsQXJuOiBNYXRjaC5hbnlWYWx1ZSgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBPcGVuU2VhcmNoIFNlcnZlcmxlc3MgY29sbGVjdGlvbicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0tCVGVzdFN0YWNrVGVrVGVzdEtidGVzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlIGZvciB1bml0IHRlc3RzJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCBwcm9wcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCBPcGVuU2VhcmNoIFNlcnZlcmxlc3MgY29sbGVjdGlvbiBpcyBjcmVhdGVkXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6T3BlblNlYXJjaFNlcnZlcmxlc3M6OkNvbGxlY3Rpb24nLCB7XG4gICAgICAgICAgICAgICAgVHlwZTogJ1ZFQ1RPUlNFQVJDSCdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBzZWN1cml0eSBwb2xpY3lcbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpPcGVuU2VhcmNoU2VydmVybGVzczo6U2VjdXJpdHlQb2xpY3knLCB7XG4gICAgICAgICAgICAgICAgVHlwZTogJ2VuY3J5cHRpb24nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUzMgZGF0YSBzb3VyY2UgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBTMyBkYXRhIHNvdXJjZSB3aXRoIGRlZmF1bHQgY2h1bmtpbmcgc3RyYXRlZ3knLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nLCAncG9saWNpZXMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCBwcm9wcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCBkYXRhIHNvdXJjZSBpcyBjcmVhdGVkXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6QmVkcm9jazo6RGF0YVNvdXJjZScsIHtcbiAgICAgICAgICAgICAgICBOYW1lOiAndGVzdC1rYicsXG4gICAgICAgICAgICAgICAgRGF0YVNvdXJjZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgVHlwZTogJ1MzJyxcbiAgICAgICAgICAgICAgICAgICAgUzNDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBCdWNrZXRBcm46IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRm46OkdldEF0dCc6IFtNYXRjaC5hbnlWYWx1ZSgpLCAnQXJuJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBJbmNsdXNpb25QcmVmaXhlczogWydkb2N1bWVudHMvJywgJ3BvbGljaWVzLyddXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFZlY3RvckluZ2VzdGlvbkNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgQ2h1bmtpbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDaHVua2luZ1N0cmF0ZWd5OiAnRklYRURfU0laRScsXG4gICAgICAgICAgICAgICAgICAgICAgICBGaXhlZFNpemVDaHVua2luZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXhUb2tlbnM6IDUwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPdmVybGFwUGVyY2VudGFnZTogMjBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIFMzIGRhdGEgc291cmNlIHdpdGggY3VzdG9tIGNodW5raW5nIHN0cmF0ZWd5JywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndGVzdC1rYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlIGZvciB1bml0IHRlc3RzJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnLFxuICAgICAgICAgICAgICAgIGNodW5raW5nU3RyYXRlZ3k6IHtcbiAgICAgICAgICAgICAgICAgICAgbWF4VG9rZW5zOiAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwUGVyY2VudGFnZTogMTVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBuZXcgQmVkcm9ja0tub3dsZWRnZUJhc2Uoc3RhY2ssICdUZXN0S0InLCBwcm9wcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgY3VzdG9tIGNodW5raW5nIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpCZWRyb2NrOjpEYXRhU291cmNlJywge1xuICAgICAgICAgICAgICAgIFZlY3RvckluZ2VzdGlvbkNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgQ2h1bmtpbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBGaXhlZFNpemVDaHVua2luZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXhUb2tlbnM6IDEwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT3ZlcmxhcFBlcmNlbnRhZ2U6IDE1XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnSW5nZXN0aW9uIHBpcGVsaW5lJywgKCkgPT4ge1xuICAgICAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIFN0ZXAgRnVuY3Rpb25zIHN0YXRlIG1hY2hpbmUgZm9yIGluZ2VzdGlvbicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgdW5pdCB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgU3RlcCBGdW5jdGlvbnMgc3RhdGUgbWFjaGluZSBpcyBjcmVhdGVkXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6U3RlcEZ1bmN0aW9uczo6U3RhdGVNYWNoaW5lJywge1xuICAgICAgICAgICAgICAgIERlZmluaXRpb25TdHJpbmc6IE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICAgICAgICAnRm46OkpvaW4nOiBNYXRjaC5hbnlWYWx1ZSgpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIFJvbGVBcm46IHtcbiAgICAgICAgICAgICAgICAgICAgJ0ZuOjpHZXRBdHQnOiBbTWF0Y2guYW55VmFsdWUoKSwgJ0FybiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIElBTSByb2xlIGZvciBzdGF0ZSBtYWNoaW5lXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpSb2xlJywge1xuICAgICAgICAgICAgICAgIEFzc3VtZVJvbGVQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZTogJ3N0YXRlcy5hbWF6b25hd3MuY29tJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGluZ2VzdGlvbiBwZXJtaXNzaW9uc1xuICAgICAgICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6UG9saWN5Jywge1xuICAgICAgICAgICAgICAgIFBvbGljeURvY3VtZW50OiB7XG4gICAgICAgICAgICAgICAgICAgIFN0YXRlbWVudDogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogTWF0Y2guZXhhY3QoJ2JlZHJvY2thZ2VudDpzdGFydEluZ2VzdGlvbkpvYicpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIEV2ZW50QnJpZGdlIHJ1bGUgZm9yIHNjaGVkdWxlZCBpbmdlc3Rpb24nLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIHRoaXMga25vd2xlZGdlIGJhc2UgdG8gYW5zd2VyIHF1ZXN0aW9ucyBhYm91dCB0ZXN0IGRvY3VtZW50cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVN5bmNNaW51dGVzOiAzMFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIEV2ZW50QnJpZGdlIHJ1bGVcbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpFdmVudHM6OlJ1bGUnLCB7XG4gICAgICAgICAgICAgICAgU2NoZWR1bGVFeHByZXNzaW9uOiAncmF0ZSgzMCBtaW51dGVzKScsXG4gICAgICAgICAgICAgICAgU3RhdGU6ICdFTkFCTEVEJyxcbiAgICAgICAgICAgICAgICBUYXJnZXRzOiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFybjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlZjogTWF0Y2guYW55VmFsdWUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIF0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBDbG91ZFdhdGNoIGxvZyBncm91cCBmb3Igc3RhdGUgbWFjaGluZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgdW5pdCB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJ1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIENsb3VkV2F0Y2ggbG9nIGdyb3VwXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TG9nczo6TG9nR3JvdXAnLCB7XG4gICAgICAgICAgICAgICAgUmV0ZW50aW9uSW5EYXlzOiBNYXRjaC5hbnlWYWx1ZSgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnQ2xvdWRXYXRjaCBhbGFybXMnLCAoKSA9PiB7XG4gICAgICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgYWxhcm1zIHdoZW4gZW5hYmxlZCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzOiBLbm93bGVkZ2VCYXNlUHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Rlc3Qta2InLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBrbm93bGVkZ2UgYmFzZSBmb3IgdW5pdCB0ZXN0cycsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZUJ1Y2tldDogdGVzdEJ1Y2tldCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlUHJlZml4ZXM6IFsnZG9jdW1lbnRzLyddLFxuICAgICAgICAgICAgICAgIGtub3dsZWRnZUJhc2VJbnN0cnVjdGlvbnM6ICdVc2UgdGhpcyBrbm93bGVkZ2UgYmFzZSB0byBhbnN3ZXIgcXVlc3Rpb25zIGFib3V0IHRlc3QgZG9jdW1lbnRzJyxcbiAgICAgICAgICAgICAgICBlbmFibGVJbmdlc3Rpb25BbGFybXM6IHRydWVcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHByb3BzKTtcblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgZmFpbHVyZSBhbGFybVxuICAgICAgICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkNsb3VkV2F0Y2g6OkFsYXJtJywge1xuICAgICAgICAgICAgICAgIEFsYXJtTmFtZTogJ3Rlc3Qta2ItaW5nZXN0aW9uLWZhaWx1cmVzJyxcbiAgICAgICAgICAgICAgICBBbGFybURlc2NyaXB0aW9uOiAnS25vd2xlZGdlIGJhc2UgdGVzdC1rYiBpbmdlc3Rpb24gam9iIGZhaWx1cmVzJyxcbiAgICAgICAgICAgICAgICBNZXRyaWNOYW1lOiAnRXhlY3V0aW9uc0ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgTmFtZXNwYWNlOiAnQVdTL1N0YXRlcycsXG4gICAgICAgICAgICAgICAgVGhyZXNob2xkOiAxXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHRpbWVvdXQgYWxhcm1cbiAgICAgICAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpDbG91ZFdhdGNoOjpBbGFybScsIHtcbiAgICAgICAgICAgICAgICBBbGFybU5hbWU6ICd0ZXN0LWtiLWluZ2VzdGlvbi10aW1lb3V0cycsXG4gICAgICAgICAgICAgICAgQWxhcm1EZXNjcmlwdGlvbjogJ0tub3dsZWRnZSBiYXNlIHRlc3Qta2IgaW5nZXN0aW9uIGpvYiB0aW1lb3V0cycsXG4gICAgICAgICAgICAgICAgTWV0cmljTmFtZTogJ0V4ZWN1dGlvbnNUaW1lZE91dCcsXG4gICAgICAgICAgICAgICAgTmFtZXNwYWNlOiAnQVdTL1N0YXRlcycsXG4gICAgICAgICAgICAgICAgVGhyZXNob2xkOiAxXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGR1cmF0aW9uIGFsYXJtXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6Q2xvdWRXYXRjaDo6QWxhcm0nLCB7XG4gICAgICAgICAgICAgICAgQWxhcm1OYW1lOiAndGVzdC1rYi1pbmdlc3Rpb24tZHVyYXRpb24nLFxuICAgICAgICAgICAgICAgIEFsYXJtRGVzY3JpcHRpb246ICdLbm93bGVkZ2UgYmFzZSB0ZXN0LWtiIGluZ2VzdGlvbiBqb2IgZHVyYXRpb24gd2FybmluZycsXG4gICAgICAgICAgICAgICAgTWV0cmljTmFtZTogJ0V4ZWN1dGlvblRpbWUnLFxuICAgICAgICAgICAgICAgIE5hbWVzcGFjZTogJ0FXUy9TdGF0ZXMnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIG5vdCBjcmVhdGUgYWxhcm1zIHdoZW4gZGlzYWJsZWQnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cy8nXSxcbiAgICAgICAgICAgICAgICBrbm93bGVkZ2VCYXNlSW5zdHJ1Y3Rpb25zOiAnVXNlIHRoaXMga25vd2xlZGdlIGJhc2UgdG8gYW5zd2VyIHF1ZXN0aW9ucyBhYm91dCB0ZXN0IGRvY3VtZW50cycsXG4gICAgICAgICAgICAgICAgZW5hYmxlSW5nZXN0aW9uQWxhcm1zOiBmYWxzZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgbm8gYWxhcm1zIGFyZSBjcmVhdGVkXG4gICAgICAgICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6Q2xvdWRXYXRjaDo6QWxhcm0nLCAwKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnRW52aXJvbm1lbnQtc3BlY2lmaWMgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIGFwcGx5IGRldmVsb3BtZW50IGVudmlyb25tZW50IGRlZmF1bHRzJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndGVzdC1rYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlIGZvciB1bml0IHRlc3RzJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiAnZGV2J1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbmV3IEJlZHJvY2tLbm93bGVkZ2VCYXNlKHN0YWNrLCAnVGVzdEtCJywgcHJvcHMpO1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgbG9nIHJldGVudGlvbiBpcyBzZXQgdG8gZGV2ZWxvcG1lbnQgZGVmYXVsdCAoMSB3ZWVrKVxuICAgICAgICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxvZ3M6OkxvZ0dyb3VwJywge1xuICAgICAgICAgICAgICAgIFJldGVudGlvbkluRGF5czogN1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgYWxhcm1zIGFyZSBkaXNhYmxlZCBieSBkZWZhdWx0IGluIGRldlxuICAgICAgICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkNsb3VkV2F0Y2g6OkFsYXJtJywgMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBhcHBseSBwcm9kdWN0aW9uIGVudmlyb25tZW50IGRlZmF1bHRzJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndGVzdC1rYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlIGZvciB1bml0IHRlc3RzJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiAncHJvZCdcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHByb3BzKTtcblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4gICAgICAgICAgICAvLyBDaGVjayB0aGF0IGxvZyByZXRlbnRpb24gaXMgc2V0IHRvIHByb2R1Y3Rpb24gZGVmYXVsdCAoNiBtb250aHMpXG4gICAgICAgICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TG9nczo6TG9nR3JvdXAnLCB7XG4gICAgICAgICAgICAgICAgUmV0ZW50aW9uSW5EYXlzOiAxODBcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDaGVjayB0aGF0IGFsYXJtcyBhcmUgZW5hYmxlZCBieSBkZWZhdWx0IGluIHByb2RcbiAgICAgICAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpDbG91ZFdhdGNoOjpBbGFybScsIDMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdFcnJvciBoYW5kbGluZycsICgpID0+IHtcbiAgICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSB2YWxpZGF0aW9uIGVycm9ycyBncmFjZWZ1bGx5JywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHM6IEtub3dsZWRnZUJhc2VQcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnJywgLy8gSW52YWxpZCBlbXB0eSBuYW1lXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGtub3dsZWRnZSBiYXNlIGZvciB1bml0IHRlc3RzJyxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlQnVja2V0OiB0ZXN0QnVja2V0LFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VQcmVmaXhlczogWydkb2N1bWVudHMvJ10sXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLnRvVGhyb3coL25hbWUgaXMgcmVxdWlyZWQvKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIHZhbGlkYXRlIFMzIHByZWZpeCBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wczogS25vd2xlZGdlQmFzZVByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0ZXN0LWtiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3Qga25vd2xlZGdlIGJhc2UgZm9yIHVuaXQgdGVzdHMnLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VCdWNrZXQ6IHRlc3RCdWNrZXQsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVByZWZpeGVzOiBbJ2RvY3VtZW50cyddLCAvLyBNaXNzaW5nIHRyYWlsaW5nIHNsYXNoXG4gICAgICAgICAgICAgICAga25vd2xlZGdlQmFzZUluc3RydWN0aW9uczogJ1VzZSB0aGlzIGtub3dsZWRnZSBiYXNlIHRvIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgdGVzdCBkb2N1bWVudHMnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBTaG91bGQgY3JlYXRlIHdhcm5pbmcgYnV0IG5vdCBmYWlsXG4gICAgICAgICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG5ldyBCZWRyb2NrS25vd2xlZGdlQmFzZShzdGFjaywgJ1Rlc3RLQicsIHByb3BzKTtcbiAgICAgICAgICAgIH0pLm5vdC50b1Rocm93KCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7Il19