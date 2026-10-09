import { describe, expect, it } from 'vitest';
import { JsonToZodGenerator } from '../../src/generators/JsonToZodGenerator';
import { SelectionContext } from '../../src/types/pipeline';

describe('JsonToZodGenerator', () => {
  const generator = new JsonToZodGenerator();

  const createContext = (json: string, fileName = 'User'): SelectionContext => ({
    selectedText: json,
    startLine: 0,
    startColumn: 0,
    endLine: 5,
    endColumn: 1,
    languageId: 'json',
    filePath: `/workspace/${fileName}.json`,
    fileBaseName: fileName,
    isLargeSelection: false,
  });

  it('should detect valid JSON input in canHandle', () => {
    const ctx = createContext('{"id": 1, "title": "Test"}');
    expect(generator.canHandle(ctx)).toBe(true);
  });

  it('should return false in canHandle for non-JSON text', () => {
    const ctx = createContext('function foo() { return 42; }');
    expect(generator.canHandle(ctx)).toBe(false);
  });

  it('should transform primitive types into Zod schema', () => {
    const json = JSON.stringify({
      str: 'hello',
      num: 123,
      bool: true,
      nullable: null,
    });
    const ctx = createContext(json, 'Config');
    const artifact = generator.generate(ctx);

    expect(artifact.code).toContain('import { z } from \'zod\';');
    expect(artifact.code).toContain('export const configSchema = z.object({');
    expect(artifact.code).toContain('str: z.string(),');
    expect(artifact.code).toContain('num: z.number(),');
    expect(artifact.code).toContain('bool: z.boolean(),');
    expect(artifact.code).toContain('nullable: z.null(),');
    expect(artifact.code).toContain('export type Config = z.infer<typeof configSchema>;');
  });

  it('should infer special string types (ISO date, email, uuid)', () => {
    const json = JSON.stringify({
      email: 'test@example.com',
      createdAt: '2026-01-15T12:00:00Z',
      id: '123e4567-e89b-12d3-a456-426614174000',
    });
    const ctx = createContext(json, 'Account');
    const artifact = generator.generate(ctx);

    expect(artifact.code).toContain('email: z.string().email(),');
    expect(artifact.code).toContain('createdAt: z.string().datetime(),');
    expect(artifact.code).toContain('id: z.string().uuid(),');
  });

  it('should handle arrays and nested objects', () => {
    const json = JSON.stringify({
      tags: ['ts', 'js'],
      user: {
        name: 'Alice',
      },
    });
    const ctx = createContext(json, 'Post');
    const artifact = generator.generate(ctx);

    expect(artifact.code).toContain('tags: z.array(z.string()),');
    expect(artifact.code).toContain('user: z.object({');
    expect(artifact.code).toContain('name: z.string(),');
  });
});
