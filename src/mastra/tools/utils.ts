/**
 * UUID Validation and Context Utilities
 * 
 * Helper functions for validating UUIDs and extracting userId from tool execution context.
 */

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Extracts and validates userId from tool parameters or context.
 * Throws an error if userId is not provided or is not a valid UUID.
 * 
 * @param userId - userId from tool input parameters
 * @param context - Optional execution context (Mastra may provide resourceId)
 * @returns Validated userId as UUID string
 * @throws Error if userId is invalid or missing
 */
export function getUserIdFromContext(
  userId?: string,
  context?: { resourceId?: string; userId?: string }
): string {
  // Try to get userId from various sources
  const actualUserId = userId || context?.resourceId || context?.userId;
  
  if (!actualUserId) {
    throw new Error('userId is required. Please provide a valid user ID (UUID format).');
  }
  
  if (!isValidUUID(actualUserId)) {
    throw new Error(
      `Invalid userId format: "${actualUserId}". Expected a valid UUID. ` +
      `The user's name or other identifier cannot be used as userId.`
    );
  }
  
  return actualUserId;
}

/**
 * Wraps a tool to automatically inject userId from bound context.
 * This prevents the agent from needing to pass userId and avoids errors
 * when the agent tries to use the user's name instead of UUID.
 * 
 * @param tool - The tool to wrap
 * @param userId - The userId to automatically inject
 * @returns A new tool instance with userId automatically injected
 */
export function bindUserIdToTool<T extends { execute: (...args: any[]) => any; id?: string; description?: string; inputSchema?: any; outputSchema?: any }>(
  tool: T,
  userId: string
): T {
  const originalExecute = tool.execute;
  
  if (!originalExecute) {
    throw new Error(`Tool ${tool.id || 'unknown'} does not have an execute function`);
  }
  
  return {
    ...tool,
    execute: async (input: any, context?: any) => {
      // Inject userId if not provided or if it's invalid
      const inputUserId = input?.userId;
      if (!inputUserId || !isValidUUID(inputUserId)) {
        // Use bound userId - merge it into input
        const inputWithUserId = { ...input, userId };
        return originalExecute.call(tool, inputWithUserId, context);
      }
      // UserId is valid, use as is
      return originalExecute.call(tool, input, context);
    },
  } as T;
}

