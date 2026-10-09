import { AstParser } from '../parsers/AstParser';
import { DerivedArtifact, IGeneratorPlugin, SelectionContext } from '../types/pipeline';

export class TsToVitestGenerator implements IGeneratorPlugin {
  public readonly id = 'ts-to-vitest';
  public readonly name = 'TypeScript -> Vitest Suite';
  public readonly description = 'Emits describe/it Vitest unit test stubs with parameter mocks for TypeScript code';

  public canHandle(ctx: SelectionContext): boolean {
    if (!['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(ctx.languageId)) {
      return false;
    }
    const signatures = AstParser.extractFunctionSignatures(ctx.selectedText);
    return signatures.length > 0;
  }

  public generate(ctx: SelectionContext): DerivedArtifact {
    const signatures = AstParser.extractFunctionSignatures(ctx.selectedText);
    if (signatures.length === 0) {
      throw new Error('No valid function or method signatures found in selection.');
    }

    const targetName = ctx.fileBaseName;
    const testBlocks: string[] = [];

    for (const sig of signatures) {
      const isAsync = sig.isAsync;

      const testCase = [
        `  it('should execute ${sig.name} successfully', ${isAsync ? 'async ' : ''}() => {`,
        `    // Arrange`,
        ...sig.params.map((p) => `    const ${p.name} = ${this.generateMockValue(p.name, p.typeAnnotation)};`),
        ``,
        `    // Act`,
        `    ${isAsync ? 'const result = await ' : 'const result = '}${sig.name}(${sig.params.map((p) => p.name).join(', ')});`,
        ``,
        `    // Assert`,
        `    expect(result).toBeDefined();`,
        `  });`,
      ].join('\n');

      testBlocks.push(testCase);
    }

    const code = [
      `import { describe, it, expect } from 'vitest';`,
      `// import { ${signatures.map((s) => s.name).join(', ')} } from './${targetName}';`,
      ``,
      `describe('${targetName}', () => {`,
      testBlocks.join('\n\n'),
      `});`,
    ].join('\n');

    return {
      generatorId: this.id,
      generatorName: this.name,
      code,
      suggestedFileName: `${targetName}.spec.ts`,
      suggestedLanguage: 'typescript',
    };
  }

  private generateMockValue(paramName: string, typeAnno?: string): string {
    if (!typeAnno) return "'mockValue'";
    const lower = typeAnno.toLowerCase();

    if (lower === 'string') return `'mock_${paramName}'`;
    if (lower === 'number') return '42';
    if (lower === 'boolean') return 'true';
    if (lower.endsWith('[]')) return '[]';
    if (lower === 'any' || lower === 'unknown') return '{}';
    return `{/* mock ${typeAnno} */}`;
  }
}
