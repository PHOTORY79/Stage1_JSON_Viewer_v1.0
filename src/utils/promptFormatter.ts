/**
 * Formats a block object into a specific string format for prompt generation.
 * Format: KEY:VALUE; (keys are uppercase, numerical prefixes removed)
 */
export function formatBlocksToPrompt(blocks: Record<string, string>): string {
    if (!blocks) return '';

    return Object.entries(blocks)
        .filter(([_, value]) => value && value.trim() !== '') // Remove empty values
        .map(([key, value]) => {
            // Remove numerical prefix (e.g., "1_STYLE" -> "STYLE")
            const cleanKey = key.replace(/^\d+_/, '').toUpperCase();
            return `${cleanKey}:${value.trim()}`;
        })
        .join('; ') + ';'; // Join with semicolon and space, add trailing semicolon
}
