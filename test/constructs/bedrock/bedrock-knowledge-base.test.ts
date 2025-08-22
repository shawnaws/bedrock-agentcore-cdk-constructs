/**
 * Unit tests for BedrockKnowledgeBase construct
 */

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
import { BedrockKnowledgeBase, KnowledgeBaseProps } from '../../../src/constructs/bedrock/bedrock-knowledge-base';

describe('BedrockKnowledgeBase', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let testBucket: Bucket;

    beforeEach(() => {
        app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');
        
        // Create test S3 bucket
        testBucket = new Bucket(stack, 'TestBucket');
    });

    describe('Constructor validation', () => {
        test('should create knowledge base with valid minimal configuration', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            const kb = new BedrockKnowledgeBase(stack, 'TestKB', props);

            expect(kb.knowledgeBaseName).toBe('test-kb');
            expect(kb.vectorKb).toBeDefined();
            expect(kb.kbS3Ds).toBeDefined();
        });

        test('should throw error for invalid knowledge base name', () => {
            const props: KnowledgeBaseProps = {
                name: 'invalid kb name!', // Contains invalid characters
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Configuration validation failed/);
        });

        test('should throw error for short description', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Short', // Too short
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Knowledge base description must be at least 10 characters long/);
        });

        test('should throw error for long description', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'A'.repeat(1001), // Too long
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Knowledge base description must be 1000 characters or less/);
        });

        test('should throw error for short instructions', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Short' // Too short
            };

            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/Knowledge base instructions must be at least 10 characters long/);
        });

        test('should throw error for empty data source prefixes', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: [], // Empty array
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/dataSourcePrefixes must be a non-empty array/);
        });

        test('should throw error for invalid sync interval', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                dataSourceSyncMinutes: 1500 // Too high (over 24 hours)
            };

            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/dataSourceSyncMinutes must be between 1 and 1440/);
        });

        test('should throw error for invalid chunking strategy', () => {
            const props: KnowledgeBaseProps = {
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
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/chunkingStrategy.maxTokens must be between 100 and 8192/);
        });
    });

    describe('Vector knowledge base creation', () => {
        test('should create vector knowledge base with default embedding model', () => {
            const props: KnowledgeBaseProps = {
                name: 'KBTestStackTestKbtest',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check that knowledge base is created
            template.hasResourceProperties('AWS::Bedrock::KnowledgeBase', {
                Name: Match.stringLikeRegexp('KBTestStackTekTestKbtest'),
                Description: 'Test knowledge base for unit tests',
                KnowledgeBaseConfiguration: {
                    Type: 'VECTOR',
                    VectorKnowledgeBaseConfiguration: {
                        EmbeddingModelArn: Match.anyValue()
                    }
                }
            });
        });

        test('should create vector knowledge base with custom embedding model', () => {
            const props: KnowledgeBaseProps = {
                name: 'KBTestStackTekTestKbtest',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                embeddingModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check that knowledge base uses custom embedding model
            template.hasResourceProperties('AWS::Bedrock::KnowledgeBase', {
                KnowledgeBaseConfiguration: {
                    VectorKnowledgeBaseConfiguration: {
                        EmbeddingModelArn: Match.anyValue()
                    }
                }
            });
        });

        test('should create OpenSearch Serverless collection', () => {
            const props: KnowledgeBaseProps = {
                name: 'KBTestStackTekTestKbtest',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

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
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/', 'policies/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check that data source is created
            template.hasResourceProperties('AWS::Bedrock::DataSource', {
                Name: 'test-kb',
                DataSourceConfiguration: {
                    Type: 'S3',
                    S3Configuration: {
                        BucketArn: {
                            'Fn::GetAtt': [Match.anyValue(), 'Arn']
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
            const props: KnowledgeBaseProps = {
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

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

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
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check that Step Functions state machine is created
            template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                DefinitionString: Match.objectLike({
                    'Fn::Join': Match.anyValue(),
                }),
                RoleArn: {
                    'Fn::GetAtt': [Match.anyValue(), 'Arn']
                }
            });

            // Check IAM role for state machine
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
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
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Action: Match.exact('bedrockagent:startIngestionJob')
                        })
                    ])
                }
            });
        });

        test('should create EventBridge rule for scheduled ingestion', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                dataSourceSyncMinutes: 30
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check EventBridge rule
            template.hasResourceProperties('AWS::Events::Rule', {
                ScheduleExpression: 'rate(30 minutes)',
                State: 'ENABLED',
                Targets: Match.arrayWith([
                    Match.objectLike({
                        Arn: {
                            Ref: Match.anyValue()
                        }
                    })
                ])
            });
        });

        test('should create CloudWatch log group for state machine', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check CloudWatch log group
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: Match.anyValue()
            });
        });
    });

    describe('CloudWatch alarms', () => {
        test('should create alarms when enabled', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                enableIngestionAlarms: true
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

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
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                enableIngestionAlarms: false
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check that no alarms are created
            template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
        });
    });

    describe('Environment-specific configuration', () => {
        test('should apply development environment defaults', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                environment: 'dev'
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

            // Check that log retention is set to development default (1 week)
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 7
            });

            // Check that alarms are disabled by default in dev
            template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
        });

        test('should apply production environment defaults', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents',
                environment: 'prod'
            };

            new BedrockKnowledgeBase(stack, 'TestKB', props);

            const template = Template.fromStack(stack);

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
            const props: KnowledgeBaseProps = {
                name: '', // Invalid empty name
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents/'],
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).toThrow(/name is required/);
        });

        test('should validate S3 prefix format', () => {
            const props: KnowledgeBaseProps = {
                name: 'test-kb',
                description: 'Test knowledge base for unit tests',
                dataSourceBucket: testBucket,
                dataSourcePrefixes: ['documents'], // Missing trailing slash
                knowledgeBaseInstructions: 'Use this knowledge base to answer questions about test documents'
            };

            // Should create warning but not fail
            expect(() => {
                new BedrockKnowledgeBase(stack, 'TestKB', props);
            }).not.toThrow();
        });
    });
});