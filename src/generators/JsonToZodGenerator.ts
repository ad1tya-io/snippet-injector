import { SafeJsonParser } from '../parsers/SafeJsonParser';
import { DerivedArtifact, IGeneratorPlugin, SelectionContext } from '../types/pipeline';

export class JsonToZodGenerator implements IGeneratorPlugin {
  public readonly id = 'json-to-zod';
  public readonly name = 'JSON -> Zod Schema';
  public readonly description = 'Transforms JSON object into a strongly-typed Zod schema validation tree';

  public canHandle(ctx: SelectionContext): boolean {
    return SafeJsonParser.isValidJson(ctx.selectedText);
  }

  public generate(ctx: SelectionContext): DerivedArtifact {
    const parseResult = SafeJsonParser.parse(ctx.selectedText);
    if (!parseResult.success || parseResult.data === undefined) {
      throw new Error(`Cannot generate Zod schema: ${parseResult.error || 'Invalid JSON'}`);
    }

    const schemaName = `${this.toCamelCase(ctx.fileBaseName)}Schema`;
    const zodCode = this.valueToZod(parseResult.data, 0);

    const fullCode = [
      `import { z } from 'zod';`,
      ``,
      `export const ${schemaName} = ${zodCode};`,
      `export type ${this.toPascalCase(ctx.fileBaseName)} = z.infer<typeof ${schemaName}>;`,
    ].join('\n');

    return {
      generatorId: this.id,
      generatorName: this.name,
      code: fullCode,
      suggestedFileName: `${ctx.fileBaseName}.schema.ts`,
      suggestedLanguage: 'typescript',
    };
  }

  private valueToZod(value: unknown, depth: number): string {
    const indent = '  '.repeat(depth);
    const innerIndent = '  '.repeat(depth + 1);

    if (value === null) {
      return 'z.null()';
    }

    if (typeof value === 'boolean') {
      return 'z.boolean()';
    }

    if (typeof value === 'number') {
      return 'z.number()';
    }

    if (typeof value === 'string') {
      return this.inferStringZod(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'z.array(z.unknown())';
      }
      const elementSchemas = Array.from(
        new Set(value.map((item) => this.valueToZod(item, depth + 1)))
      );
      if (elementSchemas.length === 1) {
        return `z.array(${elementSchemas[0]})`;
      }
      return `z.array(z.union([${elementSchemas.join(', ')}]))`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value as object);
      if (keys.length === 0) {
        return 'z.object({})';
      }

      const fields = keys.map((key) => {
        const val = (value as Record<string, unknown>)[key];
        const keyZod = this.valueToZod(val, depth + 1);
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        return `${innerIndent}${safeKey}: ${keyZod},`;
      });

      return `z.object({\n${fields.join('\n')}\n${indent}})`;
    }

    return 'z.unknown()';
  }

  private inferStringZod(val: string): string {
    // ISO Date regex check
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      return 'z.string().datetime()';
    }
    // Simple Email check
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return 'z.string().email()';
    }
    // UUID check
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
      return 'z.string().uuid()';
    }
    return 'z.string()';
  }

  private toPascalCase(str: string): string {
    const clean = str.replace(/[^a-zA-Z0-9]/g, '');
    if (!clean) return 'Snippet';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}
