import * as vscode from 'vscode';
import * as path from 'path';
import Handlebars from 'handlebars';
import { DerivedArtifact, IGeneratorPlugin, SelectionContext } from '../types/pipeline';

export interface UserTemplate {
  name: string;
  templateContent: string;
  fileName?: string;
}

export class CustomTemplateGenerator implements IGeneratorPlugin {
  public readonly id = 'custom-handlebars';
  public readonly name = 'Custom Handlebars Template';
  public readonly description = 'Renders user-defined Handlebars (.hbs) template from .vscode/snippet-templates';

  private templateOverride?: UserTemplate;

  public setTemplate(template: UserTemplate): void {
    this.templateOverride = template;
  }

  public canHandle(ctx: SelectionContext): boolean {
    return ctx.selectedText.trim().length > 0;
  }

  public async generate(ctx: SelectionContext): Promise<DerivedArtifact> {
    const template = this.templateOverride || (await this.loadWorkspaceTemplate(ctx));
    if (!template) {
      throw new Error('No Handlebars template available in .vscode/snippet-templates');
    }

    // Zero dynamic eval compilation (no string code generation)
    const compiled = Handlebars.compile(template.templateContent, {
      noEscape: true,
      knownHelpersOnly: true,
    });

    const templateData = {
      selection: ctx.selectedText,
      fileBaseName: ctx.fileBaseName,
      filePath: ctx.filePath,
      languageId: ctx.languageId,
      startLine: ctx.startLine + 1,
      endLine: ctx.endLine + 1,
      isLargeSelection: ctx.isLargeSelection,
    };

    const code = compiled(templateData);

    return {
      generatorId: this.id,
      generatorName: `Handlebars: ${template.name}`,
      code,
      suggestedFileName: `${ctx.fileBaseName}.derived.txt`,
      suggestedLanguage: ctx.languageId,
    };
  }

  /**
   * Scans workspace folder `.vscode/snippet-templates` for available `.hbs` files.
   */
  public async loadWorkspaceTemplate(_ctx: SelectionContext): Promise<UserTemplate | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return this.getDefaultTemplate();
    }

    const templateDir = vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'snippet-templates'));
    try {
      const files = await vscode.workspace.fs.readDirectory(templateDir);
      const hbsFiles = files.filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.hbs'));

      if (hbsFiles.length === 0) {
        return this.getDefaultTemplate();
      }

      // Pick first template or prompt selection
      const firstFile = hbsFiles[0][0];
      const fileUri = vscode.Uri.file(path.join(templateDir.fsPath, firstFile));
      const contentBytes = await vscode.workspace.fs.readFile(fileUri);
      const templateContent = Buffer.from(contentBytes).toString('utf8');

      return {
        name: firstFile,
        templateContent,
      };
    } catch {
      return this.getDefaultTemplate();
    }
  }

  private getDefaultTemplate(): UserTemplate {
    return {
      name: 'Default Boilerplate',
      templateContent: [
        `/**`,
        ` * Generated snippet from {{fileBaseName}} (Lines {{startLine}}-{{endLine}})`,
        ` */`,
        `// Source selection:`,
        `{{{selection}}}`,
      ].join('\n'),
    };
  }
}
