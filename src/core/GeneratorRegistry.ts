import { CustomTemplateGenerator } from '../generators/CustomTemplateGenerator';
import { JsonToTsInterfaceGenerator } from '../generators/JsonToTsInterfaceGenerator';
import { JsonToZodGenerator } from '../generators/JsonToZodGenerator';
import { TsToVitestGenerator } from '../generators/TsToVitestGenerator';
import { IGeneratorPlugin, SelectionContext } from '../types/pipeline';

export class GeneratorRegistry {
  private plugins: IGeneratorPlugin[] = [];

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registers default built-in generator plugins.
   */
  public registerDefaults(): void {
    this.register(new JsonToZodGenerator());
    this.register(new TsToVitestGenerator());
    this.register(new JsonToTsInterfaceGenerator());
    this.register(new CustomTemplateGenerator());
  }

  /**
   * Registers a generator plugin.
   */
  public register(plugin: IGeneratorPlugin): void {
    if (!this.plugins.some((p) => p.id === plugin.id)) {
      this.plugins.push(plugin);
    }
  }

  /**
   * Returns all plugins registered in the system.
   */
  public getAllGenerators(): IGeneratorPlugin[] {
    return [...this.plugins];
  }

  /**
   * Evaluates all plugins against selection context and returns applicable strategies.
   */
  public async getApplicableGenerators(ctx: SelectionContext): Promise<IGeneratorPlugin[]> {
    const applicable: IGeneratorPlugin[] = [];
    for (const plugin of this.plugins) {
      try {
        const canHandle = await plugin.canHandle(ctx);
        if (canHandle) {
          applicable.push(plugin);
        }
      } catch {
        // Skip plugin if canHandle check throws
      }
    }
    return applicable;
  }

  /**
   * Finds generator by unique ID.
   */
  public getGeneratorById(id: string): IGeneratorPlugin | undefined {
    return this.plugins.find((p) => p.id === id);
  }
}
