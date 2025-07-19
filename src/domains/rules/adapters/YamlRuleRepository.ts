import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { RuleRepository } from '../core/ports/RuleEngine';
import { Result, ok, err } from '../../../shared/types/Result';
import { RulePack } from '../core/entities/RulePack';

/**
 * YAML-based rule repository implementation
 */
export class YamlRuleRepository implements RuleRepository {
  private defaultRulepackDir: string;

  constructor(defaultRulepackDir: string = 'rulepacks') {
    this.defaultRulepackDir = defaultRulepackDir;
  }

  /**
   * Loads rules from a YAML file
   */
  async loadFromYaml(filePath: string): Promise<Result<RulePack, Error>> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return err(new Error(`RulePack file not found: ${filePath}`));
      }

      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // Parse YAML
      const data = yaml.load(content) as Record<string, unknown>;

      if (!data) {
        return err(new Error('Empty or invalid YAML file'));
      }

      // Create RulePack from YAML data
      try {
        const rulePack = RulePack.fromYaml(data);
        return ok(rulePack);
      } catch (validationError) {
        return err(new Error(`Invalid RulePack format: ${validationError}`));
      }
    } catch (error) {
      return err(new Error(`Failed to load RulePack from YAML: ${error}`));
    }
  }

  /**
   * Saves rules to a YAML file
   */
  async saveToYaml(
    filePath: string,
    rulePack: RulePack
  ): Promise<Result<void, Error>> {
    try {
      // Convert RulePack to YAML format
      const yamlData = rulePack.toYaml();

      // Convert to YAML string
      const yamlContent = yaml.dump(yamlData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      // Write to file
      await fs.promises.writeFile(filePath, yamlContent, 'utf-8');

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save RulePack to YAML: ${error}`));
    }
  }

  /**
   * Lists available rulepacks
   */
  async listAvailable(): Promise<Result<string[], Error>> {
    try {
      const rulepackDir = this.defaultRulepackDir;

      if (!fs.existsSync(rulepackDir)) {
        return ok([]);
      }

      const files = await fs.promises.readdir(rulepackDir);
      const yamlFiles = files
        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map((file) => path.join(rulepackDir, file));

      return ok(yamlFiles);
    } catch (error) {
      return err(new Error(`Failed to list available rulepacks: ${error}`));
    }
  }

  /**
   * Gets the default rulepack path
   */
  getDefaultPath(): string {
    // Look for default rulepacks in order of preference
    const candidates = [
      path.join(this.defaultRulepackDir, 'prompt-injection.yaml'),
      path.join(this.defaultRulepackDir, 'pii.yaml'),
      path.join(this.defaultRulepackDir, 'default.yaml'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    // If no default found, return the first available
    const availableResult = this.listAvailableSync();
    if (availableResult.length > 0) {
      return availableResult[0];
    }

    // Fallback to prompt-injection.yaml
    return path.join(this.defaultRulepackDir, 'prompt-injection.yaml');
  }

  /**
   * Synchronous version of listAvailable for getDefaultPath
   */
  private listAvailableSync(): string[] {
    try {
      if (!fs.existsSync(this.defaultRulepackDir)) {
        return [];
      }

      const files = fs.readdirSync(this.defaultRulepackDir);
      return files
        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map((file) => path.join(this.defaultRulepackDir, file));
    } catch {
      return [];
    }
  }

  /**
   * Validates that a YAML file contains valid rulepack structure
   */
  async validateYamlFile(filePath: string): Promise<Result<void, Error>> {
    const loadResult = await this.loadFromYaml(filePath);

    if (loadResult.isErr()) {
      return err(loadResult.error);
    }

    return ok(undefined);
  }
}
