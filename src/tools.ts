/**
 * External Tools Integration for Ralph Wiggum Loops
 *
 * Provides integration with test runners, linters, formatters,
 * and other development tools for automatic feedback.
 */

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { ExternalToolResult } from "./ralph.js";

export interface ToolConfig {
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  timeout?: number;
  parseOutput?: (output: string, exitCode: number) => {
    errors: string[];
    warnings: string[];
    summary: string;
  };
}

export interface ToolPreset {
  name: string;
  description: string;
  tools: ToolConfig[];
}

/**
 * External Tools Manager
 */
export class ToolsManager {
  private workingDir: string;
  private presets: Map<string, ToolPreset>;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
    this.presets = new Map();
    this.initializePresets();
  }

  /**
   * Initialize tool presets for common project types
   * (optimized: using static parsers instead of bound methods)
   */
  private initializePresets(): void {
    // JavaScript/TypeScript
    this.presets.set("javascript-test", {
      name: "JavaScript/TypeScript Test Suite",
      description: "Run tests for JS/TS projects",
      tools: [
        {
          name: "npm-test",
          command: "npm",
          args: ["test"],
          parseOutput: ToolsManager.parseNpmTest,
        },
      ],
    });

    this.presets.set("javascript-lint", {
      name: "JavaScript/TypeScript Linting",
      description: "Run ESLint for JS/TS projects",
      tools: [
        {
          name: "eslint",
          command: "npx",
          args: ["eslint", ".", "--format", "compact"],
          parseOutput: ToolsManager.parseESLint,
        },
      ],
    });

    // Python
    this.presets.set("python-test", {
      name: "Python Test Suite",
      description: "Run tests for Python projects",
      tools: [
        {
          name: "pytest",
          command: "python",
          args: ["-m", "pytest", "-v"],
          parseOutput: ToolsManager.parsePytest,
        },
      ],
    });

    this.presets.set("python-lint", {
      name: "Python Linting",
      description: "Run linters for Python projects",
      tools: [
        {
          name: "ruff",
          command: "ruff",
          args: ["check", "."],
          parseOutput: ToolsManager.parseRuff,
        },
      ],
    });

    // Rust
    this.presets.set("rust-test", {
      name: "Rust Test Suite",
      description: "Run tests for Rust projects",
      tools: [
        {
          name: "cargo-test",
          command: "cargo",
          args: ["test"],
          parseOutput: ToolsManager.parseCargoTest,
        },
      ],
    });

    this.presets.set("rust-lint", {
      name: "Rust Linting",
      description: "Run clippy for Rust projects",
      tools: [
        {
          name: "clippy",
          command: "cargo",
          args: ["clippy", "--", "-D", "warnings"],
          parseOutput: ToolsManager.parseClippy,
        },
      ],
    });

    // Go
    this.presets.set("go-test", {
      name: "Go Test Suite",
      description: "Run tests for Go projects",
      tools: [
        {
          name: "go-test",
          command: "go",
          args: ["test", "./..."],
          parseOutput: ToolsManager.parseGoTest,
        },
      ],
    });

    // General build
    this.presets.set("build", {
      name: "Build Check",
      description: "Verify project builds successfully",
      tools: [
        {
          name: "build",
          command: "npm",
          args: ["run", "build"],
          parseOutput: ToolsManager.parseBuild,
        },
      ],
    });
  }

  /**
   * Run a single tool (SECURE: uses spawnSync to prevent command injection)
   */
  async runTool(config: ToolConfig): Promise<ExternalToolResult> {
    const startTime = Date.now();
    let exitCode = 0;
    let output = "";

    try {
      // Sanitize command to prevent injection
      const sanitizedCommand = config.command.replace(/[\"'`$;<>|&\n\r]/g, '');

      // Build args array - sanitize each arg
      const sanitizedArgs = (config.args || []).map(arg =>
        arg.replace(/[\"'`$;<>|&\n\r]/g, '')
      );

      // Use spawnSync with separate arguments to prevent shell injection
      const result = spawnSync(sanitizedCommand, sanitizedArgs, {
        cwd: config.cwd || this.workingDir,
        encoding: "utf-8",
        stdio: "pipe",
        timeout: config.timeout || 30000,
      });

      exitCode = result.status || 0;
      output = result.stdout || result.stderr || "";
    } catch (error: any) {
      exitCode = error.status || 1;
      output = error.stdout || error.stderr || String(error);
    }

    const duration = Date.now() - startTime;

    return {
      name: config.name,
      command: config.command,
      exitCode,
      output: output.substring(0, 5000), // Limit output size
      duration,
    };
  }

  /**
   * Run all tools in a preset
   */
  async runPreset(presetName: string): Promise<ExternalToolResult[]> {
    const preset = this.presets.get(presetName);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    const results: ExternalToolResult[] = [];
    for (const tool of preset.tools) {
      const result = await this.runTool(tool);
      results.push(result);
    }

    return results;
  }

  /**
   * Get available presets
   */
  getPresets(): ToolPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Detect project type and suggest presets
   */
  detectPresets(): string[] {
    const suggested: string[] = [];

    // Check for JavaScript/TypeScript
    if (existsSync(`${this.workingDir}/package.json`)) {
      suggested.push("javascript-test", "javascript-lint", "build");
    }

    // Check for Python
    if (
      existsSync(`${this.workingDir}/setup.py`) ||
      existsSync(`${this.workingDir}/pyproject.toml`) ||
      existsSync(`${this.workingDir}/requirements.txt`)
    ) {
      suggested.push("python-test", "python-lint");
    }

    // Check for Rust
    if (existsSync(`${this.workingDir}/Cargo.toml`)) {
      suggested.push("rust-test", "rust-lint");
    }

    // Check for Go
    if (existsSync(`${this.workingDir}/go.mod`)) {
      suggested.push("go-test");
    }

    return suggested;
  }

  /**
   * Parse tool output and extract errors, warnings, and summary
   */
  analyzeResults(
    results: ExternalToolResult[],
    presetName: string
  ): {
    success: boolean;
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const preset = this.presets.get(presetName);
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const summaries: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const tool = preset?.tools[i];

      if (tool?.parseOutput) {
        const parsed = tool.parseOutput(result.output, result.exitCode);
        allErrors.push(...parsed.errors);
        allWarnings.push(...parsed.warnings);
        summaries.push(parsed.summary);
      } else {
        // Default parsing
        if (result.exitCode !== 0) {
          allErrors.push(
            `${result.name} failed with exit code ${result.exitCode}`
          );
        }
        summaries.push(
          `${result.name}: ${result.exitCode === 0 ? "✓" : "✗"} (${Math.floor(
            result.duration / 1000
          )}s)`
        );
      }
    }

    const success = results.every((r) => r.exitCode === 0);
    const summary = summaries.join("\n");

    return {
      success,
      errors: allErrors,
      warnings: allWarnings,
      summary,
    };
  }

  // Output parsers for different tools (static for better performance)

  private static parseNpmTest(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const lines = output.split("\n");

    // Look for failing tests
    for (const line of lines) {
      if (line.includes("✗") || line.includes("failing") || line.includes("Error:")) {
        errors.push(line.trim());
      }
    }

    // Extract summary
    const summaryMatch = output.match(/(\d+) passing?,? (\d+) failing?/);
    const summary = summaryMatch
      ? `Tests: ${summaryMatch[1]} passing, ${summaryMatch[2]} failing`
      : `Exit code: ${exitCode}`;

    return { errors, warnings: [], summary };
  }

  private static parseESLint(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (line.includes("error")) {
        errors.push(line.trim());
      } else if (line.includes("warning")) {
        warnings.push(line.trim());
      }
    }

    const summary =
      exitCode === 0
        ? "No linting errors found"
        : `${errors.length} errors, ${warnings.length} warnings`;

    return { errors, warnings, summary };
  }

  private static parsePytest(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (line.startsWith("FAILED")) {
        errors.push(line.trim());
      }
    }

    const summaryMatch = output.match(/(\d+) passed, (\d+) failed/);
    const summary = summaryMatch
      ? `Tests: ${summaryMatch[1]} passed, ${summaryMatch[2]} failed`
      : `Exit code: ${exitCode}`;

    return { errors, warnings: [], summary };
  }

  private static parseRuff(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (line.trim() && !line.startsWith("Found")) {
        errors.push(line.trim());
      }
    }

    const summary = exitCode === 0 ? "No linting errors" : `${errors.length} issues found`;

    return { errors, warnings: [], summary };
  }

  private static parseCargoTest(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (line.startsWith("FAILED") || line.includes("error:")) {
        errors.push(line.trim());
      }
    }

    const summaryMatch = output.match(/test result: ok\. (\d+) passed;/);
    const summary = summaryMatch
      ? `Tests: ${summaryMatch[1]} passed`
      : `Exit code: ${exitCode}`;

    return { errors, warnings: [], summary };
  }

  private static parseClippy(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (line.includes("error[")) {
        errors.push(line.trim());
      } else if (line.includes("warning[")) {
        warnings.push(line.trim());
      }
    }

    const summary = `Clippy: ${errors.length} errors, ${warnings.length} warnings`;

    return { errors, warnings, summary };
  }

  private static parseGoTest(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (line.startsWith("--- FAIL")) {
        errors.push(line.trim());
      }
    }

    const summaryMatch = output.match(/PASS: (\d+)/);
    const summary = summaryMatch
      ? `Tests: ${summaryMatch[1]} passed`
      : `Exit code: ${exitCode}`;

    return { errors, warnings: [], summary };
  }

  private static parseBuild(output: string, exitCode: number): {
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (
        line.toLowerCase().includes("error") &&
        !line.includes("warning") &&
        !line.includes("notice")
      ) {
        errors.push(line.trim());
      }
    }

    const summary = exitCode === 0 ? "Build successful" : "Build failed";

    return { errors, warnings: [], summary };
  }
}
