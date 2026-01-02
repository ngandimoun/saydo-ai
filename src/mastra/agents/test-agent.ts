import { Agent } from "@mastra/core/agent";

// Simple test agent to verify Mastra setup
export const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "You are a helpful test agent for verifying Mastra setup.",
  model: "openai/gpt-5-nano-2025-08-07", // Using OpenAI model
});




