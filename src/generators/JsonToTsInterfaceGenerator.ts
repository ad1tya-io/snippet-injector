import { SafeJsonParser } from '../parsers/SafeJsonParser';
import { DerivedArtifact, IGeneratorPlugin, SelectionContext } from '../types/pipeline';

export class JsonToTsInterfaceGenerator implements IGeneratorPlugin {
  public readonly id = 'json-to-ts-interface';
  public readonly name = 'JSON -> TS Interface';
  public readonly description = 'Transforms JSON object into TypeScript interface and type definitions';

  public canHandle(ctx: SelectionContext): boolean {
    return SafeJsonParser.isValidJson(ctx.selectedText);
  }

  public generate(ctx: SelectionContext): DerivedArtifact {
    const parseResult = SafeJsonParser.parse(ctx.selectedText);
    if (!parseResult.success || parseResult.data === undefined) {
      throw new Error(`Cannot generate TS interface: ${parseResult.error || 'Invalid JSON'}`);
    }

    const interfaceName = this.toPascalCase(ctx.fileBaseName);
    const interfaceBody = this.valueToType(parseResult.data, 0);

    const code = `export interface ${interfaceName} ${interfaceBody}`;

    return {
      generatorId: this.id,
      generatorName: this.name,
      code,
      suggestedFileName: `${ctx.fileBaseName}.types.ts`,
      suggestedLanguage: 'typescript',
    };
  }

  private valueToType(value: unknown, depth: number): string {
    const indent = '  '.repeat(depth);
    const innerIndent = '  '.repeat(depth + 1);

    if (value === null) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]';
      const elementTypes = Array.from(new Set(value.map((item) => this.valueToType(item, depth + 1))));
      if (elementTypes.length === 1) {
        return `${elementTypes[0]}[]`;
      }
      return `(${elementTypes.join(' | ')})[]`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value as object);
      if (keys.length === 0) return '{}';

      const fields = keys.map((key) => {
        const val = (value as Record<string, unknown>)[key];
        const typeStr = this.valueToType(val, depth + 1);
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        return `${innerIndent}${safeKey}: ${typeStr};`;
      });

      return `{\n${fields.join('\n')}\n${indent}}`;
    }

    return 'unknown';
  }

  private toPascalCase(str: string): string {
    const clean = str.replace(/[^a-zA-Z0-9]/g, '');
    if (!clean) return 'DerivedType';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
}
