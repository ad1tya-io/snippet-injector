import { describe, expect, it } from 'vitest';
import { TsToVitestGenerator } from '../../src/generators/TsToVitestGenerator';
import { SelectionContext } from '../../src/types/pipeline';

describe('TsToVitestGenerator', () => {
  const generator = new TsToVitestGenerator();

  const createContext = (code: string, fileName = 'UserService'): SelectionContext => ({
    selectedText: code,
    startLine: 0,
    startColumn: 0,
    endLine: 10,
    endColumn: 1,
    languageId: 'typescript',
    filePath: `/src/${fileName}.ts`,
    fileBaseName: fileName,
    isLargeSelection: false,
  });

  it('should detect function signatures in canHandle', () => {
    const code = `export async function getUserById(id: string, options?: any): Promise<User> { return {} as any; }`;
    const ctx = createContext(code);
    expect(generator.canHandle(ctx)).toBe(true);
  });

  it('should generate Vitest test suite for exported function', () => {
    const code = `export async function createUser(name: string, age: number): Promise<void> {}`;
    const ctx = createContext(code, 'UserService');
    const artifact = generator.generate(ctx);

    expect(artifact.code).toContain("import { describe, it, expect } from 'vitest';");
    expect(artifact.code).toContain("describe('UserService', () => {");
    expect(artifact.code).toContain("it('should execute createUser successfully', async () => {");
    expect(artifact.code).toContain("const name = 'mock_name';");
    expect(artifact.code).toContain("const age = 42;");
    expect(artifact.code).toContain("const result = await createUser(name, age);");
    expect(artifact.code).toContain("expect(result).toBeDefined();");
  });

  it('should handle arrow functions and synchronous calls', () => {
    const code = `export const calculateTax = (amount: number): number => amount * 0.2;`;
    const ctx = createContext(code, 'TaxCalculator');
    const artifact = generator.generate(ctx);

    expect(artifact.code).toContain("describe('TaxCalculator', () => {");
    expect(artifact.code).toContain("it('should execute calculateTax successfully', () => {");
    expect(artifact.code).toContain("const result = calculateTax(amount);");
  });
});
