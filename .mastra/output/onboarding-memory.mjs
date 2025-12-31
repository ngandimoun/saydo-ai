import { g as getMemoryStorage, a as getThreadByResourceId, s as saydoMemory, b as getFullWorkingMemory } from './index.mjs';
import { getFullUserContext } from './tools/92f9a2f3-43c1-4e8a-9f6e-614731881d5c.mjs';
import '@mastra/core/evals/scoreTraces';
import '@mastra/core/mastra';
import '@mastra/core/agent';
import './types.mjs';
import '@mastra/core/tools';
import 'zod';
import '@supabase/supabase-js';
import './tools/0fee52d8-7310-42a4-8a8c-3df3efbb3bd9.mjs';
import 'openai';
import 'xlsx';
import 'mammoth';
import './tools/44a3f886-ffb4-48a3-8cab-68cc5cb6023b.mjs';
import '@/lib/mastra/pattern-learning';
import '@/lib/mastra/pattern-storage';
import '@mastra/core/workflows';
import '@mastra/memory';
import '@mastra/pg';
import '@ai-sdk/openai';
import 'fs/promises';
import 'https';
import 'path';
import 'http';
import 'http2';
import 'stream';
import 'crypto';
import 'fs';
import '@mastra/core/utils/zod-to-json';
import '@mastra/core/error';
import '@mastra/core/utils';
import '@mastra/core/evals';
import '@mastra/core/storage';
import '@mastra/core/a2a';
import 'stream/web';
import 'zod/v4';
import 'zod/v3';
import '@mastra/core/memory';
import 'child_process';
import 'module';
import 'util';
import '@mastra/core/llm';
import 'os';
import '@mastra/core/request-context';
import '@mastra/core/server';
import 'buffer';
import './tools.mjs';

async function initializeOrUpdateUserMemory(userId) {
  const memory = saydoMemory;
  const storage = getMemoryStorage();
  let thread;
  try {
    thread = await getThreadByResourceId(storage, userId);
  } catch (error) {
    thread = null;
  }
  const userContext = await getFullUserContext(userId);
  const fullContext = {
    preferredName: userContext.preferredName,
    language: userContext.language,
    profession: userContext.profession?.name,
    criticalArtifacts: userContext.criticalArtifacts,
    socialPlatforms: userContext.socialIntelligence,
    newsFocus: userContext.newsFocus,
    healthInterests: userContext.healthInterests
  };
  if (!thread || !thread.id) {
    const newThread = await memory.createThread({
      resourceId: userId,
      metadata: {
        userId,
        language: fullContext.language,
        profession: fullContext.profession,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
        messageCount: 0
      }
    });
    const workingMemory = getFullWorkingMemory(fullContext);
    if (newThread.id) {
      await memory.updateWorkingMemory({
        threadId: newThread.id,
        resourceId: userId,
        workingMemory
      });
    }
    return newThread.id;
  } else {
    const workingMemory = getFullWorkingMemory(fullContext);
    await memory.updateWorkingMemory({
      threadId: thread.id,
      resourceId: userId,
      workingMemory
    });
    return thread.id;
  }
}
async function updateMemoryWithVoiceContext(userId, voiceContext) {
  const memory = saydoMemory;
  const storage = getMemoryStorage();
  let thread;
  try {
    thread = await getThreadByResourceId(storage, userId);
  } catch (error) {
    await initializeOrUpdateUserMemory(userId);
    try {
      thread = await getThreadByResourceId(storage, userId);
    } catch (err) {
      thread = null;
    }
  }
  if (!thread || !thread.id) {
    throw new Error(`Failed to get or create memory thread for user ${userId}`);
  }
  await memory.getWorkingMemory({
    threadId: thread.id,
    resourceId: userId
  });
  const userContext = await getFullUserContext(userId);
  const fullContext = {
    preferredName: userContext.preferredName,
    language: userContext.language,
    profession: userContext.profession?.name,
    criticalArtifacts: userContext.criticalArtifacts,
    socialPlatforms: userContext.socialIntelligence,
    newsFocus: userContext.newsFocus,
    healthInterests: userContext.healthInterests
  };
  const workingMemory = getFullWorkingMemory(fullContext, voiceContext);
  await memory.updateWorkingMemory({
    threadId: thread.id,
    resourceId: userId,
    workingMemory
  });
}
async function getUserMemoryThreadId(userId) {
  const storage = getMemoryStorage();
  try {
    const thread = await getThreadByResourceId(storage, userId);
    return thread?.id || null;
  } catch (error) {
    return null;
  }
}

export { getUserMemoryThreadId, initializeOrUpdateUserMemory, updateMemoryWithVoiceContext };
