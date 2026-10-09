import JSON5 from 'json5';

export interface ParseJsonResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * SafeJsonParser utilizes relaxed JSON5 parsing to process raw JSON,
 * unquoted object literals, trailing commas, and single-quoted strings
 * while returning clean error diagnostics.
 */
export class SafeJsonParser {
  /**
   * Attempts to parse raw string input into a JS data structure.
   */
  public static parse(input: string): ParseJsonResult {
    const trimmed = input.trim();
    if (!trimmed) {
      return { success: false, error: 'Selection is empty' };
    }

    try {
      // First try standard JSON parsing for max speed
      const data = JSON.parse(trimmed);
      return { success: true, data };
    } catch {
      // Fallback to JSON5 for relaxed parsing (unquoted keys, trailing commas, single quotes)
      try {
        const data = JSON5.parse(trimmed);
        return { success: true, data };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          error: `Invalid JSON syntax: ${errorMessage}`,
        };
      }
    }
  }

  /**
   * Checks if a given input string can be parsed as valid JSON/JSON5 object or array.
   */
  public static isValidJson(input: string): boolean {
    const res = this.parse(input);
    return res.success && typeof res.data === 'object' && res.data !== null;
  }
}
