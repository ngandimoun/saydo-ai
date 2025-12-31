import { Agent } from "@mastra/core/agent";

// Simple test agent to verify Mastra setup
export const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "You are a helpful test agent for verifying Mastra setup.",
  model: "openai/gpt-4o-mini", // Using OpenAI model
});



