import { describe, expect, it } from 'vitest';
import { SafeJsonParser } from '../../src/parsers/SafeJsonParser';

describe('SafeJsonParser', () => {
  it('should parse valid strict JSON strings', () => {
    const json = '{"name": "Alice", "age": 30, "active": true}';
    const res = SafeJsonParser.parse(json);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ name: 'Alice', age: 30, active: true });
  });

  it('should parse relaxed JSON5 with unquoted keys and trailing commas', () => {
    const json5 = `{
      name: 'Bob',
      roles: ['admin', 'user',],
      count: 42,
    }`;
    const res = SafeJsonParser.parse(json5);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      name: 'Bob',
      roles: ['admin', 'user'],
      count: 42,
    });
  });

  it('should fail gracefully on invalid syntax without throwing', () => {
    const invalid = '{ name: "Charlie", age: }';
    const res = SafeJsonParser.parse(invalid);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid JSON syntax');
  });

  it('should correctly identify valid JSON via isValidJson', () => {
    expect(SafeJsonParser.isValidJson('{ a: 1 }')).toBe(true);
    expect(SafeJsonParser.isValidJson('not json')).toBe(false);
    expect(SafeJsonParser.isValidJson('')).toBe(false);
  });
});
