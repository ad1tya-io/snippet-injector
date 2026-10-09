export const window = {
  activeTextEditor: undefined,
  showInformationMessage: () => Promise.resolve(undefined),
  showWarningMessage: () => Promise.resolve(undefined),
  showErrorMessage: () => Promise.resolve(undefined),
  showQuickPick: () => Promise.resolve(undefined),
  setStatusBarMessage: () => ({ dispose: () => {} }),
};

export const workspace = {
  workspaceFolders: [],
  fs: {
    stat: () => Promise.reject(new Error('File not found')),
    readDirectory: () => Promise.resolve([]),
    readFile: () => Promise.resolve(Buffer.from('')),
  },
  applyEdit: () => Promise.resolve(true),
  openTextDocument: () => Promise.resolve({ lineCount: 0, lineAt: () => ({ range: { end: {} } }) }),
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
  executeCommand: () => Promise.resolve([]),
};

export const env = {
  clipboard: {
    writeText: () => Promise.resolve(),
  },
};

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(public start: Position, public end: Position) {}
}

export class Uri {
  static file(path: string) {
    return { fsPath: path, fileName: path };
  }
}

export class WorkspaceEdit {
  insert() {}
  createFile() {}
  set() {}
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}
