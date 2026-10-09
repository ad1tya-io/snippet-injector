import * as vscode from 'vscode';
import { ContextManager } from './core/ContextManager';
import { GeneratorRegistry } from './core/GeneratorRegistry';
import { Inserter } from './core/Inserter';
import { DeliveryMethod } from './types/pipeline';

export function activate(context: vscode.ExtensionContext) {
  const registry = new GeneratorRegistry();

  const disposable = vscode.commands.registerCommand(
    'snippetInjector.generateFromSelection',
    async () => {
      try {
        // 1. Capture Selection Context
        const ctx = ContextManager.captureContext();
        const validation = ContextManager.validateContext(ctx);

        if (!validation.valid || !ctx) {
          vscode.window.showWarningMessage(validation.message || 'No valid code selection active.');
          return;
        }

        // Handle large selection warning / progress
        if (ctx.isLargeSelection) {
          vscode.window.setStatusBarMessage('$(sync~spin) Snippet Injector: Processing large selection...', 2000);
        }

        // 2. Query Applicable Generators
        const applicableGenerators = await registry.getApplicableGenerators(ctx);

        if (applicableGenerators.length === 0) {
          vscode.window.showWarningMessage('No matching snippet generators found for the selected code.');
          return;
        }

        // 3. Show QuickPick for Generator Selection
        interface GeneratorQuickPickItem extends vscode.QuickPickItem {
          generatorId: string;
        }

        const generatorItems: GeneratorQuickPickItem[] = applicableGenerators.map((gen) => ({
          label: `$(symbol-snippet) ${gen.name}`,
          description: gen.description,
          generatorId: gen.id,
        }));

        const selectedGenItem = await vscode.window.showQuickPick(generatorItems, {
          placeHolder: 'Select a transformation generator for your snippet',
          matchOnDescription: true,
        });

        if (!selectedGenItem) {
          return; // User cancelled
        }

        const targetGenerator = registry.getGeneratorById(selectedGenItem.generatorId);
        if (!targetGenerator) {
          vscode.window.showErrorMessage('Selected generator plugin could not be loaded.');
          return;
        }

        // 4. Show QuickPick for Delivery Target
        interface DeliveryQuickPickItem extends vscode.QuickPickItem {
          method: DeliveryMethod;
        }

        const deliveryItems: DeliveryQuickPickItem[] = [
          {
            label: '$(insert) Inline Below',
            description: 'Injects derived snippet directly below active selection',
            method: 'inline-below',
          },
          {
            label: '$(file-code) Companion File',
            description: 'Creates/opens companion file (e.g. .spec.ts or .schema.ts) and appends snippet',
            method: 'companion-file',
          },
          {
            label: '$(clippy) Copy to Clipboard',
            description: 'Copies generated snippet code to system clipboard',
            method: 'clipboard',
          },
        ];

        const selectedDelivery = await vscode.window.showQuickPick(deliveryItems, {
          placeHolder: 'Select delivery target location',
        });

        if (!selectedDelivery) {
          return; // User cancelled
        }

        // 5. Generate Artifact & Deliver
        const artifact = await targetGenerator.generate(ctx);
        const success = await Inserter.deliver(artifact, selectedDelivery.method, ctx);

        if (success && selectedDelivery.method !== 'clipboard') {
          vscode.window.showInformationMessage(`Successfully injected snippet using ${targetGenerator.name}!`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showWarningMessage(`Snippet Injector: ${message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
