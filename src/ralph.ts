/**
 * Ralph Wiggum Loop State Management
 *
 * Manages the state for Ralph Wiggum iterative development loops.
 * Includes iteration history tracking, progress metrics, and stagnation detection.
 */

export interface RalphLoopState {
  active: boolean;
  iteration: number;
  maxIterations: number;
  completionPromise: string | null;
  startedAt: string;
  prompt: string;
  history: RalphIterationHistoryEntry[];
  gitEnabled: boolean;
  autoCommit: boolean;
}

export interface RalphIterationHistoryEntry {
  iteration: number;
  timestamp: string;
  duration?: number; // milliseconds
  output: string;
  completionDetected: boolean;
  filesModified?: string[];
  commandsRun?: string[];
  errors?: string[];
  gitCommit?: string;
  externalToolsRun?: ExternalToolResult[];
}

export interface ExternalToolResult {
  name: string;
  command: string;
  exitCode: number;
  output: string;
  duration: number;
}

export interface RalphIterationResult {
  completed: boolean;
  iteration: number;
  reason: string;
  nextPrompt?: string;
  completionDetected?: boolean;
  progress?: RalphProgressMetrics;
}

export interface RalphProgressMetrics {
  stagnationDetected: boolean;
  stagnationReason?: string;
  convergenceRate: number; // 0-1, higher = better
  repeatedErrors: string[];
  suggestedActions: string[];
  estimatedIterationsRemaining?: number;
}

/**
 * Ralph Loop Manager
 *
 * Manages Ralph loop state, iteration logic, history tracking, and progress analysis.
 */
export class RalphLoopManager {
  private state: RalphLoopState | null = null;
  private stateFilePath: string;
  private historyFilePath: string;
  private lastIterationStartTime: number | null = null;

  constructor(stateFilePath: string = ".REMOVED/ralph-loop-state.json") {
    this.stateFilePath = stateFilePath;
    this.historyFilePath = stateFilePath.replace("-state.json", "-history.jsonl");
    this.loadState();
  }

  /**
   * Load state from file if it exists
   */
  private loadState(): void {
    try {
      const fs = require("fs");
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, "utf-8");
        this.state = JSON.parse(data);
      }
    } catch (error) {
      console.error(`Failed to load Ralph state: ${error}`);
      this.state = null;
    }
  }

  /**
   * Save state to file
   */
  private saveState(): void {
    try {
      const fs = require("fs");
      const path = require("path");
      const dir = path.dirname(this.stateFilePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error(`Failed to save Ralph state: ${error}`);
    }
  }

  /**
   * Append to history log (append-only for durability)
   */
  private appendToHistory(entry: RalphIterationHistoryEntry): void {
    try {
      const fs = require("fs");
      const path = require("path");
      const dir = path.dirname(this.historyFilePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Append as JSONL (one JSON object per line)
      const line = JSON.stringify(entry) + "\n";
      fs.appendFileSync(this.historyFilePath, line);
    } catch (error) {
      console.error(`Failed to append to history: ${error}`);
    }
  }

  /**
   * Start a new Ralph loop
   */
  startLoop(
    prompt: string,
    maxIterations: number = 0,
    completionPromise: string | null = null,
    gitEnabled: boolean = true,
    autoCommit: boolean = false
  ): RalphLoopState {
    this.state = {
      active: true,
      iteration: 1,
      maxIterations,
      completionPromise,
      startedAt: new Date().toISOString(),
      prompt,
      history: [],
      gitEnabled,
      autoCommit,
    };
    this.saveState();
    this.lastIterationStartTime = Date.now();
    return this.state;
  }

  /**
   * Cancel the active Ralph loop
   */
  cancelLoop(): boolean {
    if (!this.state || !this.state.active) {
      return false;
    }

    const iteration = this.state.iteration;
    this.state = null;
    try {
      const fs = require("fs");
      if (fs.existsSync(this.stateFilePath)) {
        fs.unlinkSync(this.stateFilePath);
      }
    } catch (error) {
      console.error(`Failed to delete state file: ${error}`);
    }
    return true;
  }

  /**
   * Get the current loop state
   */
  getState(): RalphLoopState | null {
    return this.state;
  }

  /**
   * Check if a loop is active
   */
  isLoopActive(): boolean {
    return this.state !== null && this.state.active;
  }

  /**
   * Get iteration history
   */
  getHistory(): RalphIterationHistoryEntry[] {
    if (!this.state) {
      return [];
    }
    return this.state.history;
  }

  /**
   * Analyze progress and detect patterns (optimized single-pass)
   */
  private analyzeProgress(): RalphProgressMetrics {
    const history = this.state?.history || [];
    const metrics: RalphProgressMetrics = {
      stagnationDetected: false,
      convergenceRate: 0,
      repeatedErrors: [],
      suggestedActions: [],
    };

    if (history.length < 3) {
      return metrics;
    }

    // Single-pass analysis: collect all metrics in one iteration
    const errorFrequency = new Map<string, number>();
    let totalErrors = 0;
    let totalOutputLength = 0;
    let completionCount = 0;
    const recentLengths: number[] = [];
    const recentCompletions: boolean[] = [];

    // Process all history in one loop
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];

      // Track errors with normalization
      const errors = entry.errors || [];
      for (const error of errors) {
        // Normalize error messages (remove file paths, line numbers, timestamps)
        // Use single regex with alternation for better performance
        const normalized = error
          .replace(/\/[^\s]+|\d+:\d+|\b\d+\b/g, "<n>")
          .trim();
        const count = (errorFrequency.get(normalized) || 0) + 1;
        errorFrequency.set(normalized, count);
        totalErrors++;
      }

      // Track output patterns for last 3 iterations
      if (i >= history.length - 3) {
        recentLengths.push(entry.output.length);
        recentCompletions.push(entry.completionDetected);
      }

      totalOutputLength += entry.output.length;
      if (entry.completionDetected) completionCount++;
    }

    // Find errors that repeat 3+ times
    for (const [error, count] of errorFrequency.entries()) {
      if (count >= 3) {
        metrics.repeatedErrors.push(error);
      }
    }

    // Detect stagnation - same error repeating
    if (metrics.repeatedErrors.length > 0) {
      metrics.stagnationDetected = true;
      metrics.stagnationReason = `Same error(s) repeating across iterations: ${metrics.repeatedErrors.slice(0, 2).join(", ")}`;
      metrics.suggestedActions.push(
        "Consider a different approach - current strategy is not working",
        "Review the repeated error patterns and try addressing them differently"
      );
    }

    // Check if last 3 iterations had similar output length and no completion
    if (recentLengths.length === 3) {
      const avgLength = recentLengths[0];
      const allSameLength = recentLengths.every(
        (len) => Math.abs(len - avgLength) < len * 0.1
      );

      if (allSameLength && recentCompletions.every((c) => !c)) {
        metrics.stagnationDetected = true;
        metrics.stagnationReason =
          "Output length and structure similar across last 3 iterations - may be stuck in loop";
        metrics.suggestedActions.push(
          "Try breaking down the task into smaller sub-tasks",
          "Consider reviewing the prompt for clarity"
        );
      }
    }

    // Calculate convergence rate
    const uniqueErrors = errorFrequency.size;
    metrics.convergenceRate =
      totalErrors > 0 ? 1 - uniqueErrors / totalErrors : 0.5;

    // Estimate iterations remaining
    if (metrics.convergenceRate > 0) {
      const progressPerIteration = metrics.convergenceRate / history.length;
      if (progressPerIteration > 0) {
        metrics.estimatedIterationsRemaining = Math.ceil(
          (1 - metrics.convergenceRate) / progressPerIteration
        );
      }
    }

    return metrics;
  }

  /**
   * Process the next iteration with history tracking
   *
   * @param lastOutput The last output from the AI assistant
   * @param metadata Optional metadata about the iteration
   * @returns Result indicating if loop should continue or stop
   */
  processIteration(
    lastOutput: string,
    metadata?: {
      filesModified?: string[];
      commandsRun?: string[];
      errors?: string[];
      gitCommit?: string;
      externalToolsRun?: ExternalToolResult[];
    }
  ): RalphIterationResult {
    if (!this.state || !this.state.active) {
      return {
        completed: true,
        iteration: 0,
        reason: "No active Ralph loop found",
      };
    }

    const { iteration, maxIterations, completionPromise, prompt } = this.state;

    // Check for completion promise
    let completionDetected = false;
    if (completionPromise) {
      // Extract text from <promise> tags
      const promiseMatch = lastOutput.match(/<promise>(.*?)<\/promise>/s);
      if (promiseMatch) {
        const extractedPromise = promiseMatch[1].trim();
        if (extractedPromise === completionPromise) {
          completionDetected = true;
        }
      }
    }

    // Calculate duration
    const duration =
      this.lastIterationStartTime !== null
        ? Date.now() - this.lastIterationStartTime
        : undefined;

    // Create history entry
    const historyEntry: RalphIterationHistoryEntry = {
      iteration,
      timestamp: new Date().toISOString(),
      duration,
      output: lastOutput.substring(0, 1000), // Truncate for storage
      completionDetected,
      filesModified: metadata?.filesModified,
      commandsRun: metadata?.commandsRun,
      errors: metadata?.errors,
      gitCommit: metadata?.gitCommit,
      externalToolsRun: metadata?.externalToolsRun,
    };

    this.state.history.push(historyEntry);
    this.appendToHistory(historyEntry);

    if (completionDetected) {
      this.cancelLoop();
      return {
        completed: true,
        iteration,
        reason: `Completion promise detected: <promise>${completionPromise}</promise>`,
        completionDetected: true,
      };
    }

    // Check max iterations
    if (maxIterations > 0 && iteration >= maxIterations) {
      this.cancelLoop();
      return {
        completed: true,
        iteration,
        reason: `Max iterations (${maxIterations}) reached`,
      };
    }

    // Analyze progress before continuing
    const progress = this.analyzeProgress();

    // Continue loop - increment iteration
    const nextIteration = iteration + 1;
    this.state.iteration = nextIteration;
    this.saveState();
    this.lastIterationStartTime = Date.now();

    return {
      completed: false,
      iteration: nextIteration,
      reason: `Iteration ${nextIteration} - continue loop`,
      nextPrompt: prompt,
      progress,
    };
  }

  /**
   * Get formatted status string with progress insights (optimized with cached calculations)
   */
  getStatus(): string {
    if (!this.state || !this.state.active) {
      return "No active Ralph loop";
    }

    const {
      iteration,
      maxIterations,
      completionPromise,
      startedAt,
      prompt,
      history,
      gitEnabled,
    } = this.state;

    const lines: string[] = [];
    lines.push("🔄 Ralph Loop Status");
    lines.push("==================");
    lines.push(`Active: Yes`);
    lines.push(`Iteration: ${iteration}`);
    lines.push(
      `Max iterations: ${
        maxIterations > 0 ? maxIterations : "unlimited"
      }`
    );
    lines.push(
      `Completion promise: ${completionPromise || "none (runs forever)"}`
    );
    lines.push(`Started at: ${startedAt}`);
    lines.push(`Git integration: ${gitEnabled ? "enabled" : "disabled"}`);

    // Add history summary (optimized: single pass calculations)
    if (history.length > 0) {
      lines.push("");
      lines.push("📊 Iteration History:");
      lines.push(`  Total iterations: ${history.length}`);

      // Calculate all metrics in single pass
      let totalDuration = 0;
      const filesChanged = new Set<string>();
      const toolsRun = new Set<string>();

      for (const entry of history) {
        if (entry.duration) totalDuration += entry.duration;
        if (entry.filesModified) {
          for (const file of entry.filesModified) {
            filesChanged.add(file);
          }
        }
        if (entry.externalToolsRun) {
          for (const tool of entry.externalToolsRun) {
            toolsRun.add(tool.name);
          }
        }
      }

      if (totalDuration > 0) {
        const avgDuration = Math.floor(totalDuration / history.length / 1000);
        lines.push(
          `  Total time: ${Math.floor(totalDuration / 1000)}s (${avgDuration}s/iter avg)`
        );
      }

      if (filesChanged.size > 0) {
        lines.push(`  Files modified: ${filesChanged.size}`);
      }

      if (toolsRun.size > 0) {
        lines.push(`  External tools used: ${Array.from(toolsRun).join(", ")}`);
      }
    }

    // Add progress analysis
    const progress = this.analyzeProgress();
    if (progress.stagnationDetected) {
      lines.push("");
      lines.push("⚠️  Stagnation Detected:");
      lines.push(`  ${progress.stagnationReason}`);
      if (progress.suggestedActions.length > 0) {
        lines.push("  Suggested actions:");
        progress.suggestedActions.forEach((action) => {
          lines.push(`    • ${action}`);
        });
      }
    }

    if (progress.repeatedErrors.length > 0) {
      lines.push("");
      lines.push("🔁 Repeated Errors:");
      progress.repeatedErrors.forEach((error) => {
        lines.push(`  • ${error.substring(0, 100)}${error.length > 100 ? "..." : ""}`);
      });
    }

    if (progress.estimatedIterationsRemaining !== undefined) {
      lines.push("");
      lines.push(
        `📈 Estimated iterations remaining: ${progress.estimatedIterationsRemaining}`
      );
    }

    lines.push("");
    lines.push("Prompt:");
    lines.push(prompt);

    return lines.join("\n");
  }

  /**
   * Get detailed history report
   */
  getHistoryReport(): string {
    const history = this.state?.history || [];

    if (history.length === 0) {
      return "No iteration history available.";
    }

    const lines: string[] = [];
    lines.push("📜 Ralph Loop History Report");
    lines.push("============================");
    lines.push(`Total iterations: ${history.length}`);
    lines.push("");

    for (const entry of history) {
      lines.push(`--- Iteration ${entry.iteration} ---`);
      lines.push(`Time: ${entry.timestamp}`);
      if (entry.duration) {
        lines.push(`Duration: ${Math.floor(entry.duration / 1000)}s`);
      }
      lines.push(`Completion detected: ${entry.completionDetected}`);

      if (entry.filesModified && entry.filesModified.length > 0) {
        lines.push(`Files modified: ${entry.filesModified.join(", ")}`);
      }

      if (entry.commandsRun && entry.commandsRun.length > 0) {
        lines.push(`Commands run: ${entry.commandsRun.join(", ")}`);
      }

      if (entry.errors && entry.errors.length > 0) {
        lines.push(`Errors: ${entry.errors.length}`);
        entry.errors.slice(0, 3).forEach((e) => {
          lines.push(`  • ${e.substring(0, 100)}${e.length > 100 ? "..." : ""}`);
        });
      }

      if (entry.gitCommit) {
        lines.push(`Git commit: ${entry.gitCommit.substring(0, 8)}`);
      }

      if (entry.externalToolsRun && entry.externalToolsRun.length > 0) {
        lines.push(`External tools:`);
        entry.externalToolsRun.forEach((tool) => {
          lines.push(
            `  ${tool.name}: ${tool.exitCode === 0 ? "✓" : "✗"} (${Math.floor(
              tool.duration / 1000
            )}s)`
          );
        });
      }

      lines.push("");
    }

    return lines.join("\n");
  }
}
