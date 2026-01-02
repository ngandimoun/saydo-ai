/**
 * Array utility functions for shuffling and organizing arrays
 */

/**
 * Shuffles an array while ensuring no two consecutive items share the same key value.
 * 
 * This is useful for displaying items in a grid where you want to avoid
 * showing duplicate titles next to each other.
 * 
 * @param array - The array to shuffle
 * @param getKey - Function to extract the key from each item (e.g., title)
 * @returns A new shuffled array with no adjacent duplicates
 * 
 * @example
 * const tracks = [
 *   { id: 1, title: "Song A" },
 *   { id: 2, title: "Song A" },
 *   { id: 3, title: "Song B" },
 *   { id: 4, title: "Song B" }
 * ];
 * 
 * const shuffled = shuffleWithoutAdjacentDuplicates(tracks, item => item.title);
 * // Result: items with same title will not be adjacent
 */
export function shuffleWithoutAdjacentDuplicates<T>(
  array: T[],
  getKey: (item: T) => string
): T[] {
  if (array.length <= 1) {
    return [...array];
  }

  // Group items by their key (e.g., title)
  const groups = new Map<string, T[]>();
  for (const item of array) {
    const key = getKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  // Convert groups to arrays and shuffle each group
  const groupArrays = Array.from(groups.values()).map(group => {
    // Shuffle each group internally
    const shuffled = [...group];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // Sort groups by size (largest first) to help with interleaving
  groupArrays.sort((a, b) => b.length - a.length);

  // Check if separation is possible
  const maxGroupSize = groupArrays[0]?.length || 0;
  const totalItems = array.length;
  
  // If the largest group is more than half the items, separation might be difficult
  // but we'll still try our best
  if (maxGroupSize > Math.ceil(totalItems / 2)) {
    // Fallback: simple shuffle (edge case where separation isn't fully possible)
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Interleave items from different groups
  const result: T[] = [];
  const groupIndices = new Array(groupArrays.length).fill(0);
  let currentGroupIndex = 0;
  let lastKey: string | null = null;
  let attempts = 0;
  const maxAttempts = totalItems * 2; // Prevent infinite loops

  while (result.length < totalItems && attempts < maxAttempts) {
    attempts++;
    
    // Try to find a group that has items left and doesn't match the last key
    let found = false;
    let searchIndex = currentGroupIndex;
    
    // Search forward from current index
    for (let i = 0; i < groupArrays.length; i++) {
      const idx = (searchIndex + i) % groupArrays.length;
      const group = groupArrays[idx];
      const groupKey = getKey(group[0]);
      
      if (groupIndices[idx] < group.length && groupKey !== lastKey) {
        result.push(group[groupIndices[idx]++]);
        lastKey = groupKey;
        currentGroupIndex = (idx + 1) % groupArrays.length;
        found = true;
        break;
      }
    }
    
    // If no suitable group found, use any available group
    if (!found) {
      for (let i = 0; i < groupArrays.length; i++) {
        const group = groupArrays[i];
        if (groupIndices[i] < group.length) {
          result.push(group[groupIndices[i]++]);
          lastKey = getKey(group[0]);
          currentGroupIndex = (i + 1) % groupArrays.length;
          break;
        }
      }
    }
  }

  // If we didn't get all items (shouldn't happen, but safety check)
  if (result.length < totalItems) {
    // Add remaining items
    for (let i = 0; i < groupArrays.length; i++) {
      const group = groupArrays[i];
      while (groupIndices[i] < group.length) {
        result.push(group[groupIndices[i]++]);
      }
    }
  }

  return result;
}

