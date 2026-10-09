import * as vscode from 'vscode';
import * as path from 'path';
import { SelectionContext } from '../types/pipeline';

export class ContextManager {
  public static readonly LARGE_SELECTION_THRESHOLD = 10000;

  /**
   * Captures selection context from an active VS Code TextEditor.
   */
  public static captureContext(editor?: vscode.TextEditor): SelectionContext | null {
    const activeEditor = editor || vscode.window.activeTextEditor;
    if (!activeEditor) {
      return null;
    }

    const selection = activeEditor.selection;
    const document = activeEditor.document;

    if (selection.isEmpty) {
      return null;
    }

    const selectedText = document.getText(selection);
    const filePath = document.uri.fsPath || document.fileName || 'untitled';
    const parsedPath = path.parse(filePath);
    const fileBaseName = parsedPath.name || 'Snippet';

    return {
      selectedText,
      startLine: selection.start.line,
      startColumn: selection.start.character,
      endLine: selection.end.line,
      endColumn: selection.end.character,
      languageId: document.languageId,
      filePath,
      fileBaseName,
      isLargeSelection: selectedText.length > this.LARGE_SELECTION_THRESHOLD,
    };
  }

  /**
   * Validates if context is suitable for processing.
   */
  public static validateContext(ctx: SelectionContext | null): { valid: boolean; message?: string } {
    if (!ctx) {
      return { valid: false, message: 'No active selection found in editor.' };
    }
    if (!ctx.selectedText.trim()) {
      return { valid: false, message: 'Selection contains only whitespace.' };
    }
    return { valid: true };
  }
}
