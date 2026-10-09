import * as parseBabel from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export interface FunctionSignature {
  name: string;
  isAsync: boolean;
  isExported: boolean;
  params: Array<{ name: string; typeAnnotation?: string }>;
  returnType?: string;
  kind: 'function' | 'method' | 'arrow';
}

export interface TypeDeclarationInfo {
  name: string;
  kind: 'interface' | 'typeAlias' | 'class';
  properties: Array<{ name: string; typeAnnotation: string; optional: boolean }>;
}

export class AstParser {
  /**
   * Safely parses code into Babel AST File node or returns null if invalid syntax.
   */
  public static parseCode(code: string): t.File | null {
    try {
      return parseBabel.parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'classProperties',
          'decorators-legacy',
          'asyncGenerators',
        ],
      });
    } catch {
      return null;
    }
  }

  /**
   * Extracts function signatures (functions, methods, arrow functions) from code snippet.
   */
  public static extractFunctionSignatures(code: string): FunctionSignature[] {
    const ast = this.parseCode(code);
    if (!ast) return [];

    const signatures: FunctionSignature[] = [];

    // Helper to traverse Babel AST safely
    const visitor = typeof traverse === 'function' ? traverse : (traverse as any).default;

    visitor(ast, {
      FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
        const node = path.node;
        const name = node.id ? node.id.name : 'anonymous';
        const isExported = t.isExportNamedDeclaration(path.parent) || t.isExportDefaultDeclaration(path.parent);
        const returnType = AstParser.extractTypeAnnotation(node.returnType);
        
        signatures.push({
          name,
          isAsync: Boolean(node.async),
          isExported,
          params: AstParser.extractParams(node.params as any),
          kind: 'function',
          ...(returnType ? { returnType } : {}),
        });
      },
      VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
        const node = path.node;
        if (t.isIdentifier(node.id) && (t.isArrowFunctionExpression(node.init) || t.isFunctionExpression(node.init))) {
          const fn = node.init;
          const isExported = t.isExportNamedDeclaration(path.parentPath?.parent);
          const returnType = AstParser.extractTypeAnnotation(fn.returnType);
          signatures.push({
            name: node.id.name,
            isAsync: Boolean(fn.async),
            isExported,
            params: AstParser.extractParams(fn.params as any),
            kind: 'arrow',
            ...(returnType ? { returnType } : {}),
          });
        }
      },
      ClassMethod(path: NodePath<t.ClassMethod>) {
        const node = path.node;
        if (t.isIdentifier(node.key)) {
          const returnType = AstParser.extractTypeAnnotation(node.returnType);
          signatures.push({
            name: node.key.name,
            isAsync: Boolean(node.async),
            isExported: false,
            params: AstParser.extractParams(node.params as any),
            kind: 'method',
            ...(returnType ? { returnType } : {}),
          });
        }
      },
    });

    return signatures;
  }

  /**
   * Helper to format parameter nodes into clean name & type pairs.
   */
  private static extractParams(params: Array<any>): Array<{ name: string; typeAnnotation?: string }> {
    return params.map((param, index) => {
      if (t.isIdentifier(param)) {
        const typeAnnotation = AstParser.extractTypeAnnotation(param.typeAnnotation);
        return {
          name: param.name,
          ...(typeAnnotation ? { typeAnnotation } : {}),
        };
      } else if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
        const typeAnnotation = AstParser.extractTypeAnnotation(param.left.typeAnnotation);
        return {
          name: param.left.name,
          ...(typeAnnotation ? { typeAnnotation } : {}),
        };
      } else if (t.isRestElement(param) && t.isIdentifier(param.argument)) {
        const typeAnnotation = AstParser.extractTypeAnnotation(param.typeAnnotation);
        return {
          name: `...${param.argument.name}`,
          ...(typeAnnotation ? { typeAnnotation } : {}),
        };
      }
      return { name: `arg${index}` };
    });
  }

  /**
   * Helper to serialize Babel type annotation nodes to readable string representations.
   */
  private static extractTypeAnnotation(typeAnno: t.TypeAnnotation | t.TSTypeAnnotation | t.Noop | null | undefined): string | undefined {
    if (!typeAnno || !('typeAnnotation' in typeAnno)) return undefined;
    const tsType = typeAnno.typeAnnotation;

    if (t.isTSStringKeyword(tsType)) return 'string';
    if (t.isTSNumberKeyword(tsType)) return 'number';
    if (t.isTSBooleanKeyword(tsType)) return 'boolean';
    if (t.isTSAnyKeyword(tsType)) return 'any';
    if (t.isTSUnknownKeyword(tsType)) return 'unknown';
    if (t.isTSVoidKeyword(tsType)) return 'void';
    if (t.isTSTypeReference(tsType) && t.isIdentifier(tsType.typeName)) {
      return tsType.typeName.name;
    }
    if (t.isTSArrayType(tsType)) {
      const elemType = AstParser.extractTypeAnnotation({ typeAnnotation: tsType.elementType } as any);
      return `${elemType || 'any'}[]`;
    }
    return 'any';
  }
}
