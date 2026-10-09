import { describe, expect, it } from 'vitest';
import { JsonToTsInterfaceGenerator } from '../../src/generators/JsonToTsInterfaceGenerator';
import { SelectionContext } from '../../src/types/pipeline';

describe('JsonToTsInterfaceGenerator', () => {
  const generator = new JsonToTsInterfaceGenerator();

  const createContext = (json: string, fileName = 'UserProfile'): SelectionContext => ({
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

  it('should transform JSON object to TS Interface', () => {
    const json = JSON.stringify({
      id: 101,
      username: 'johndoe',
      roles: ['admin', 'editor'],
      details: {
        lastLogin: '2026-02-01',
      },
    });

    const ctx = createContext(json, 'UserProfile');
    const artifact = generator.generate(ctx);

    expect(artifact.code).toContain('export interface UserProfile {');
    expect(artifact.code).toContain('id: number;');
    expect(artifact.code).toContain('username: string;');
    expect(artifact.code).toContain('roles: string[];');
    expect(artifact.code).toContain('details: {');
    expect(artifact.code).toContain('lastLogin: string;');
  });
});
