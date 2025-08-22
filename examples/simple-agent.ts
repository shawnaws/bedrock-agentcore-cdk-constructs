import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BedrockAgentCoreRuntimeAgent } from '../src/constructs/bedrock-agentcore/bedrock-agentcore-runtime-agent';

/**
 * Example: Simple Agent without Knowledge Base
 * 
 * This example demonstrates how to create a basic Bedrock agent
 * without knowledge bases or action groups - just pure LLM interaction.
 */
export class SimpleAgentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a simple agent with minimal configuration
    const agent = new BedrockAgentCoreRuntimeAgent(this, 'SimpleAgent', {
      agentName: 'simple-chat-agent',
      description: 'A simple conversational agent',
      foundationModel: 'anthropic.claude-3-haiku-20240307-v1:0',
      instruction: `You are a helpful and friendly AI assistant. 
      
Provide clear, concise, and accurate responses to user questions.
Be conversational but professional in your tone.
If you don't know something, admit it rather than guessing.`,
      
      // Optional: Add basic monitoring
      monitoring: {
        enableCloudWatch: true,
        logRetentionDays: 7
      }
    });

    // Output the agent details
    this.exportValue(agent.agentId, { name: 'SimpleAgentId' });
    this.exportValue(agent.agentArn, { name: 'SimpleAgentArn' });
    this.exportValue(agent.agentAliasId, { name: 'SimpleAgentAliasId' });
  }
}

// Example usage
const app = new App();
new SimpleAgentStack(app, 'SimpleAgentStack');