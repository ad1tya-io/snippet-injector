/**
 * Core type definitions for the Snippet Injector pipeline.
 */

export interface SelectionContext {
  /** The raw text highlighted by the user */
  selectedText: string;
  /** 0-indexed start line number */
  startLine: number;
  /** 0-indexed start character column */
  startColumn: number;
  /** 0-indexed end line number */
  endLine: number;
  /** 0-indexed end character column */
  endColumn: number;
  /** Language ID of the active document (e.g., 'typescript', 'json', 'javascript') */
  languageId: string;
  /** Absolute file path or URI string of active text document */
  filePath: string;
  /** File basename without extension (e.g. 'UserService' from 'UserService.ts') */
  fileBaseName: string;
  /** Indicates if selection length exceeds performance threshold (10,000 characters) */
  isLargeSelection: boolean;
}

export interface DerivedArtifact {
  /** Identifier of the generator that produced this snippet */
  generatorId: string;
  /** Human readable name of the generator */
  generatorName: string;
  /** The generated snippet string */
  code: string;
  /** Default filename suggested when outputting to companion file (e.g. 'user.spec.ts') */
  suggestedFileName?: string;
  /** Language ID for formatting */
  suggestedLanguage?: string;
}

export type DeliveryMethod = 'inline-below' | 'companion-file' | 'clipboard';

export interface IGeneratorPlugin {
  /** Unique ID of generator plugin */
  readonly id: string;
  /** Display title for UX QuickPick */
  readonly name: string;
  /** Short description explaining what this generator outputs */
  readonly description: string;

  /**
   * Fast sync or async check if this generator can process the given selection context
   */
  canHandle(ctx: SelectionContext): boolean | Promise<boolean>;

  /**
   * Generates derived artifact from selection context
   */
  generate(ctx: SelectionContext): Promise<DerivedArtifact> | DerivedArtifact;
}
