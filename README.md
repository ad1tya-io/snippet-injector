# Snippet Injector - VS Code Extension

**Snippet Injector** is a production-grade VS Code extension that converts code selections (JSON objects, TypeScript types, interfaces, function signatures) into derived boilerplate structures (Zod schemas, Vitest/Jest unit test stubs, TypeScript interfaces, and custom Handlebars templates) and injects them directly into your active editor or companion files.

---

## Features

- ⚡ **JSON $\rightarrow$ Zod Schema Transformer**: Parses raw or relaxed JSON/JSON5 and outputs formatted `z.object()` trees, auto-detecting ISO datetimes, emails, UUIDs, arrays, and nested structures.
- 🧪 **TypeScript $\rightarrow$ Vitest Test Suite Generator**: Parses TypeScript functions, arrow functions, and class methods using `@babel/parser` to emit structured `describe()` and `it()` unit test stubs with realistic parameter mocks.
- 📐 **JSON $\rightarrow$ TypeScript Interface**: Converts JSON models directly into TypeScript `interface` or `type` definitions.
- 🎨 **Custom Handlebars Engine**: Compiles and renders custom `.hbs` user templates from `.vscode/snippet-templates` safely without dynamic code evaluation (`eval`).
- 🚀 **Flexible Delivery Targets**:
  - `inline-below`: Inserts generated boilerplate directly under your active selection using `vscode.WorkspaceEdit`.
  - `companion-file`: Automatically creates or updates companion files (e.g. `UserService.spec.ts` or `UserService.schema.ts`).
  - `clipboard`: Copies the formatted snippet to system clipboard.

---

## Extension Commands & Shortcuts

| Action | Shortcut | Context Menu / Command |
| :--- | :--- | :--- |
| **Generate Snippet** | `Ctrl+Alt+G` / `Cmd+Alt+G` | Right-click editor selection $\rightarrow$ **Snippet Injector: Generate Snippet from Selection** |

---

## Custom Templates (.hbs)

Create `.hbs` files inside your workspace at `.vscode/snippet-templates/my-template.hbs` to define dynamic code generators.

### Available Template Context Variables

| Variable | Type | Description |
| :--- | :--- | :--- |
| `{{selection}}` | `string` | The raw highlighted text string |
| `{{fileBaseName}}` | `string` | Base filename without extension (e.g. `UserService`) |
| `{{filePath}}` | `string` | Full absolute path to source file |
| `{{languageId}}` | `string` | Language ID of source document (e.g. `typescript`, `json`) |
| `{{startLine}}` | `number` | 1-indexed selection start line number |
| `{{endLine}}` | `number` | 1-indexed selection end line number |

#### Example Custom Template (`.vscode/snippet-templates/dto.hbs`)

```handlebars
/**
 * Auto-generated DTO from {{fileBaseName}} (Lines {{startLine}}-{{endLine}})
 */
export interface {{fileBaseName}}Dto {
  // Source Selection:
  {{{selection}}}
}
```

---

## Developer Guide & Building

### Prerequisites
- Node.js 18+
- VS Code 1.85.0+

### Installation & Build Commands

```bash
# Install dependencies
npm install

# Typecheck TypeScript source files (Strict mode)
npm run typecheck

# Run unit tests via Vitest
npm run test

# Bundle extension via esbuild
npm run build

# Watch mode for extension development
npm run watch
```

---

## Architecture Overview

```
src/
├── extension.ts                   # Extension entry point & command registration
├── core/
│   ├── ContextManager.ts          # Selection & document context capture
│   ├── GeneratorRegistry.ts       # Plugin router and strategy selection
│   └── Inserter.ts                # WorkspaceEdit & placement logic
├── generators/
│   ├── IGenerator.ts              # Core plugin contract interface
│   ├── JsonToZodGenerator.ts      # JSON -> Zod schema transformer
│   ├── TsToVitestGenerator.ts     # AST -> Vitest describe/it stubber
│   ├── JsonToTsInterfaceGenerator.ts # JSON -> TS interface transformer
│   └── CustomTemplateGenerator.ts # Handlebars custom user template engine
├── parsers/
│   ├── AstParser.ts               # Babel AST traversal helpers
│   └── SafeJsonParser.ts          # JSON5 relaxed parsing
└── types/
    └── pipeline.ts                # Pipeline data contracts
```

---

## License

MIT
