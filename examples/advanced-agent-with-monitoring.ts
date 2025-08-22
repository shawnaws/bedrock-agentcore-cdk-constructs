import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BedrockKnowledgeBase } from '../src/constructs/bedrock/bedrock-knowledge-base';
import { BedrockAgentCoreRuntimeAgent } from '../src/constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent';

/**
 * Example: Advanced Agent with Knowledge Base Integration and Monitoring
 * 
 * This example demonstrates how to create a comprehensive Bedrock agent
 * with multiple knowledge bases, action groups, and full monitoring.
 */
export class AdvancedAgentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create S3 bucket for agent data
    const agentDataBucket = new Bucket(this, 'AgentDataBucket', {
      bucketName: 'my-agent-data-bucket'
    });

    // Create knowledge bases for different domains
    const customerSupportKB = new BedrockKnowledgeBase(this, 'CustomerSupportKB', {
      knowledgeBaseName: 'customer-support-kb',
      description: 'Knowledge base for customer support documentation',
      dataSource: {
        bucketName: 'customer-support-docs',
        keyPrefix: 'support/',
        inclusionPrefixes: ['*.pdf', '*.docx', '*.txt']
      },
      vectorStore: {
        type: 'opensearch',
        opensearchConfig: {
          collectionArn: 'arn:aws:aoss:us-east-1:123456789012:collection/support-collection',
          vectorIndexName: 'support-index'
        }
      },
      monitoring: {
        enableCloudWatch: true,
        logRetentionDays: 30
      }
    });

    const productKB = new BedrockKnowledgeBase(this, 'ProductKB', {
      knowledgeBaseName: 'product-kb',
      description: 'Knowledge base for product information',
      dataSource: {
        bucketName: 'product-documentation',
        keyPrefix: 'products/',
        inclusionPrefixes: ['*.json', '*.yaml', '*.md']
      },
      vectorStore: {
        type: 'pinecone',
        pineconeConfig: {
          connectionString: 'https://my-index.pinecone.io',
          credentialsSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:pinecone-creds',
          namespace: 'products',
          textField: 'content',
          metadataField: 'metadata'
        }
      },
      monitoring: {
        enableCloudWatch: true,
        logRetentionDays: 14
      }
    });

    // Create Lambda function for custom actions
    const customerActionsFunction = new Function(this, 'CustomerActionsFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline(`
        exports.handler = async (event) => {
          // Handle customer-specific actions
          const action = event.actionGroup;
          const parameters = event.parameters;
          
          switch (action) {
            case 'get_customer_info':
              return { customerId: parameters.customerId, status: 'active' };
            case 'create_ticket':
              return { ticketId: 'TICKET-12345', status: 'created' };
            default:
              throw new Error('Unknown action: ' + action);
          }
        };
      `)
    });

    // Create the advanced agent with comprehensive configuration
    const agent = new BedrockAgentCoreRuntimeAgent(this, 'AdvancedAgent', {
      agentName: 'advanced-customer-agent',
      description: 'Advanced customer service agent with multiple capabilities',
      foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
      instruction: `You are an advanced customer service agent with access to multiple knowledge bases and action capabilities.

Use the customer support knowledge base to answer general support questions.
Use the product knowledge base to provide detailed product information.
Use the available actions to retrieve customer information and create support tickets when needed.

Always be helpful, professional, and accurate in your responses.`,
      
      knowledgeBaseIds: [
        customerSupportKB.knowledgeBaseId,
        productKB.knowledgeBaseId
      ],
      
      actionGroups: [{
        actionGroupName: 'customer-management',
        description: 'Actions for managing customer information and support tickets',
        actionGroupExecutor: {
          lambda: {
            functionArn: customerActionsFunction.functionArn
          }
        },
        apiSchema: {
          s3: {
            s3BucketName: 'my-api-schemas-bucket',
            s3ObjectKey: 'customer-actions-schema.json'
          }
        }
      }],
      
      monitoring: {
        enableCloudWatch: true,
        enableXRay: true,
        logRetentionDays: 30
      },
      
      idleSessionTtlInSeconds: 1800, // 30 minutes
      
      promptOverrideConfiguration: {
        promptConfigurations: [{
          promptType: 'PRE_PROCESSING',
          promptCreationMode: 'OVERRIDDEN',
          promptState: 'ENABLED',
          basePromptTemplate: 'You are processing a customer request. Analyze the input carefully and determine the best approach.',
          inferenceConfiguration: {
            temperature: 0.1,
            topP: 0.9,
            topK: 250,
            maximumLength: 2048,
            stopSequences: ['Human:', 'Assistant:']
          }
        }]
      }
    });

    // Grant the Lambda function permission to be invoked by the agent
    customerActionsFunction.grantInvoke(agent.serviceRole);

    // Output important values
    this.exportValue(agent.agentId, { name: 'AdvancedAgentId' });
    this.exportValue(agent.agentArn, { name: 'AdvancedAgentArn' });
    this.exportValue(customerSupportKB.knowledgeBaseId, { name: 'CustomerSupportKBId' });
    this.exportValue(productKB.knowledgeBaseId, { name: 'ProductKBId' });
  }
}

// Example usage
const app = new App();
new AdvancedAgentStack(app, 'AdvancedAgentStack');