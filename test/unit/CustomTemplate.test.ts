import { describe, expect, it } from 'vitest';
import { CustomTemplateGenerator } from '../../src/generators/CustomTemplateGenerator';
import { SelectionContext } from '../../src/types/pipeline';

describe('CustomTemplateGenerator', () => {
  const generator = new CustomTemplateGenerator();

  const createContext = (text: string): SelectionContext => ({
    selectedText: text,
    startLine: 10,
    startColumn: 0,
    endLine: 12,
    endColumn: 20,
    languageId: 'typescript',
    filePath: '/src/OrderService.ts',
    fileBaseName: 'OrderService',
    isLargeSelection: false,
  });

  it('should accept non-empty selections in canHandle', () => {
    expect(generator.canHandle(createContext('const x = 10;'))).toBe(true);
    expect(generator.canHandle(createContext('  '))).toBe(false);
  });

  it('should safely render Handlebars template with context parameters without eval', async () => {
    generator.setTemplate({
      name: 'Custom Doc',
      templateContent: '// File: {{fileBaseName}} (Lines {{startLine}}-{{endLine}})\n// Code:\n{{{selection}}}',
    });

    const ctx = createContext('export function processOrder() {}');
    const artifact = await generator.generate(ctx);

    expect(artifact.code).toContain('// File: OrderService (Lines 11-13)');
    expect(artifact.code).toContain('export function processOrder() {}');
  });
});
