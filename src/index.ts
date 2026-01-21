#!/usr/bin/env node

/**
 * Ralph Wiggum MCP Server
 *
 * An MCP server implementing the Ralph Wiggum technique for iterative,
 * self-referential AI development loops.
 *
 * Features:
 * - Iteration history tracking with progress analysis
 * - Git integration for change tracking
 * - External tool integration (tests, linters, etc.)
 * - Pre-built loop templates
 * - Smart stagnation detection
 * - Resource tracking and metrics
 *
 * Based on the Ralph Wiggum REMOVED Code plugin by Anthropic.
 * See: https://github.com/anthropics/REMOVED-code/tree/main/plugins/ralph-wiggum
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { RalphLoopManager, ExternalToolResult } from "./ralph.js";
import { GitManager } from "./git.js";
import { ToolsManager } from "./tools.js";
import { TemplatesManager } from "./templates.js";

/**
 * Ralph Wiggum MCP Server
 *
 * Provides comprehensive tools for managing Ralph Wiggum iterative development loops.
 */
class RalphWiggumServer {
  private server: Server;
  private ralphManager: RalphLoopManager;
  private gitManager: GitManager;
  private toolsManager: ToolsManager;
  private templatesManager: TemplatesManager;

  constructor() {
    this.server = new Server(
      {
        name: "ralph-wiggum-mcp",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.ralphManager = new RalphLoopManager();
    this.gitManager = new GitManager();
    this.toolsManager = new ToolsManager();
    this.templatesManager = new TemplatesManager();

    this.setupHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.handleToolCall(name, args || {});
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Get tool definitions
   */
  private getToolDefinitions(): Tool[] {
    return [
      // Core Ralph tools
      {
        name: "ralph_loop",
        description: `Start a Ralph Wiggum iterative development loop.

Ralph is a development methodology based on continuous AI agent loops.
The technique creates a self-referential feedback loop where the same
prompt is fed back repeatedly, allowing the AI to iteratively improve
its work until completion.

NEW FEATURES:
- Iteration history tracking with progress metrics
- Git integration for automatic change tracking
- External tool integration (tests, linters)
- Smart stagnation detection and warnings
- Pre-built templates for common tasks

Use ralph_list_templates to see available templates.`,
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The task prompt to iterate on (can be omitted if using template_id)",
            },
            template_id: {
              type: "string",
              description: "ID of a pre-built template to use (overrides prompt)",
            },
            max_iterations: {
              type: "number",
              description:
                "Maximum iterations before auto-stop (0 = unlimited)",
              default: 0,
            },
            completion_promise: {
              type: "string",
              description:
                "Promise phrase that signals completion (e.g., 'DONE', 'COMPLETE'). When detected in output as <promise>PROMISE</promise>, the loop ends.",
            },
            git_enabled: {
              type: "boolean",
              description: "Enable git integration (default: true)",
              default: true,
            },
            auto_commit: {
              type: "boolean",
              description: "Automatically commit changes after each iteration (default: false)",
              default: false,
            },
          },
        },
      },
      {
        name: "ralph_iterate",
        description: `Process the next iteration of a Ralph loop with enhanced tracking.

After completing work on the current iteration, call this tool with your
output and optional metadata to:
1. Check if completion promise was met
2. Track iteration history (files modified, commands run, errors)
3. Run external tools if configured
4. Analyze progress and detect stagnation
5. Create git commits if enabled
6. Either continue loop or stop

Enhanced features:
- Automatic progress analysis
- Stagnation warnings with suggestions
- External tool integration
- Git commit tracking`,
        inputSchema: {
          type: "object",
          properties: {
            last_output: {
              type: "string",
              description:
                "Your last output/response from this iteration. Will be checked for completion promise.",
            },
            files_modified: {
              type: "array",
              items: { type: "string" },
              description: "List of files modified in this iteration",
            },
            commands_run: {
              type: "array",
              items: { type: "string" },
              description: "List of commands executed in this iteration",
            },
            errors: {
              type: "array",
              items: { type: "string" },
              description: "List of errors encountered in this iteration",
            },
            run_tools: {
              type: "array",
              items: { type: "string" },
              description:
                "External tool presets to run (e.g., 'javascript-test', 'python-lint')",
            },
          },
          required: ["last_output"],
        },
      },
      {
        name: "ralph_cancel",
        description: `Cancel the active Ralph loop.

Stops the current Ralph loop and removes all state. Use this when you
want to manually stop the loop before completion.`,
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "ralph_status",
        description: `Get the current status of the Ralph loop with progress insights.

Shows:
- Whether a loop is active
- Current iteration number
- Max iterations setting
- Completion promise (if set)
- The current prompt being iterated on
- Iteration history summary (total time, files changed, tools used)
- Progress analysis (stagnation detection, repeated errors)
- Estimated iterations remaining`,
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      // History and reporting
      {
        name: "ralph_history",
        description: `Get detailed iteration history report.

Shows a comprehensive history of all iterations including:
- Timestamp and duration
- Files modified
- Commands run
- Errors encountered
- Git commits
- External tools run with results`,
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      // Templates
      {
        name: "ralph_list_templates",
        description: `List all available Ralph loop templates.

Templates are pre-built prompts and configurations for common tasks:
- REST API development
- Test-driven development
- Refactoring
- Bug fixing
- Documentation
- Performance optimization
- Security hardening
- And more...

Each template includes suggested settings and external tools.`,
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Filter by category (optional)",
            },
          },
        },
      },
      {
        name: "ralph_get_template",
        description: `Get details of a specific template.

Returns the full template configuration including:
- Name and description
- Complete prompt text
- Suggested completion promise
- Suggested max iterations
- Suggested external tools
- Git integration settings`,
        inputSchema: {
          type: "object",
          properties: {
            template_id: {
              type: "string",
              description: "The ID of the template to retrieve",
            },
          },
          required: ["template_id"],
        },
      },
      // Git integration
      {
        name: "ralph_git_status",
        description: `Get git status and diff summary.

Shows:
- Current branch and commit
- Modified, added, deleted, and untracked files
- Diff summary (files changed, insertions, deletions)`,
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "ralph_git_commit",
        description: `Create a git commit for the current iteration.

Use this to manually create a commit with a custom message.
If auto_commit is enabled, commits are created automatically.`,
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Commit message",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "ralph_git_context",
        description: `Get context from recent Ralph commits.

Shows recent Ralph iteration commits from git history,
providing context about what was done in previous iterations.`,
        inputSchema: {
          type: "object",
          properties: {
            count: {
              type: "number",
              description: "Number of recent commits to show (default: 5)",
              default: 5,
            },
          },
        },
      },
      // External tools
      {
        name: "ralph_run_tools",
        description: `Run external tool presets (test runners, linters, etc.).

Available presets:
- javascript-test: Run npm test
- javascript-lint: Run ESLint
- python-test: Run pytest
- python-lint: Run ruff
- rust-test: Run cargo test
- rust-lint: Run clippy
- go-test: Run go test
- build: Verify project builds

Use ralph_detect_tools to see which presets are available for your project.`,
        inputSchema: {
          type: "object",
          properties: {
            presets: {
              type: "array",
              items: { type: "string" },
              description: "List of tool preset names to run",
            },
          },
          required: ["presets"],
        },
      },
      {
        name: "ralph_detect_tools",
        description: `Detect which tool presets are available for the current project.

Analyzes the project structure and suggests relevant tool presets
(e.g., if package.json exists, suggests javascript-test and javascript-lint).`,
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "ralph_list_tools",
        description: `List all available external tool presets.

Shows all available tool presets with descriptions,
regardless of whether they're applicable to the current project.`,
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];
  }

  /**
   * Handle tool calls
   */
  private async handleToolCall(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    switch (name) {
      case "ralph_loop":
        return this.handleRalphLoop(args);
      case "ralph_iterate":
        return await this.handleRalphIterate(args);
      case "ralph_cancel":
        return this.handleRalphCancel();
      case "ralph_status":
        return this.handleRalphStatus();
      case "ralph_history":
        return this.handleRalphHistory();
      case "ralph_list_templates":
        return this.handleListTemplates(args);
      case "ralph_get_template":
        return this.handleGetTemplate(args);
      case "ralph_git_status":
        return this.handleGitStatus();
      case "ralph_git_commit":
        return this.handleGitCommit(args);
      case "ralph_git_context":
        return this.handleGitContext(args);
      case "ralph_run_tools":
        return await this.handleRunTools(args);
      case "ralph_detect_tools":
        return this.handleDetectTools();
      case "ralph_list_tools":
        return this.handleListTools();
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Handle ralph_loop tool
   */
  private handleRalphLoop(args: Record<string, unknown>): string {
    const {
      prompt,
      template_id,
      max_iterations = 0,
      completion_promise = null,
      git_enabled = true,
      auto_commit = false,
    } = args;

    // Determine the prompt to use
    let finalPrompt = prompt as string | undefined;
    let finalCompletionPromise = completion_promise as string | null;
    let finalMaxIterations = max_iterations as number;
    let finalGitEnabled = git_enabled as boolean;
    let finalAutoCommit = auto_commit as boolean;

    // If template_id is provided, use it
    if (template_id && typeof template_id === "string") {
      const template = this.templatesManager.getTemplate(template_id);
      if (!template) {
        throw new Error(`Unknown template: ${template_id}`);
      }

      finalPrompt = template.prompt;
      finalCompletionPromise = template.suggestedCompletionPromise;
      finalMaxIterations = template.suggestedMaxIterations;
      finalGitEnabled = template.gitEnabled;
      finalAutoCommit = template.autoCommit;
    }

    if (!finalPrompt || finalPrompt.trim() === "") {
      throw new Error("prompt is required (or provide a valid template_id)");
    }

    if (
      typeof finalMaxIterations !== "number" ||
      finalMaxIterations < 0 ||
      !Number.isInteger(finalMaxIterations)
    ) {
      throw new Error("max_iterations must be a non-negative integer");
    }

    if (
      finalCompletionPromise !== null &&
      typeof finalCompletionPromise !== "string"
    ) {
      throw new Error("completion_promise must be a string or null");
    }

    // Check if loop is already active
    if (this.ralphManager.isLoopActive()) {
      const currentStatus = this.ralphManager.getStatus();
      return (
        "⚠️  A Ralph loop is already active!\n\n" +
        currentStatus +
        "\n\nUse ralph_cancel to cancel the current loop before starting a new one."
      );
    }

    // Start the loop
    const state = this.ralphManager.startLoop(
      finalPrompt,
      finalMaxIterations,
      finalCompletionPromise,
      finalGitEnabled,
      finalAutoCommit
    );

    const lines: string[] = [];
    lines.push("🔄 Ralph loop activated!");
    lines.push("");
    lines.push(`Iteration: ${state.iteration}`);
    lines.push(
      `Max iterations: ${
        state.maxIterations > 0 ? state.maxIterations : "unlimited"
      }`
    );
    lines.push(
      `Completion promise: ${
        state.completionPromise
          ? `${state.completionPromise} (ONLY output when TRUE - do not lie!)`
          : "none (runs forever)"
      }`
    );
    lines.push(`Git integration: ${state.gitEnabled ? "enabled" : "disabled"}`);
    lines.push(
      `Auto-commit: ${
        state.autoCommit ? "enabled" : "disabled"
      } (changes committed each iteration)`
    );
    lines.push("");
    lines.push("📊 Enhanced Features:");
    lines.push("  ✅ Iteration history tracking");
    lines.push("  ✅ Progress analysis and stagnation detection");
    lines.push("  ✅ External tool integration");
    lines.push("  ✅ Git change tracking");
    lines.push("  ✅ Resource metrics");
    lines.push("");
    lines.push("How it works:");
    lines.push("1. Work on the task described in the prompt");
    lines.push("2. When done, call ralph_iterate with your output");
    lines.push("3. Optionally include metadata (files, commands, errors)");
    lines.push("4. Optionally run external tools (tests, linters)");
    lines.push("5. The loop analyzes progress and continues or stops");
    lines.push("");
    lines.push("⚠️  WARNING: This loop cannot be stopped automatically!");
    lines.push(
      "    It will run infinitely unless you set --max-iterations or --completion-promise."
    );
    lines.push("");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("YOUR TASK - Ralph Loop Prompt");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(finalPrompt);

    if (finalCompletionPromise) {
      lines.push("");
      lines.push("═══════════════════════════════════════════════════════════");
      lines.push("CRITICAL - Ralph Loop Completion Promise");
      lines.push("═══════════════════════════════════════════════════════════");
      lines.push("");
      lines.push("To complete this loop, output this EXACT text:");
      lines.push(`  <promise>${finalCompletionPromise}</promise>`);
      lines.push("");
      lines.push("STRICT REQUIREMENTS (DO NOT VIOLATE):");
      lines.push("  ✓ Use <promise> XML tags EXACTLY as shown above");
      lines.push("  ✓ The statement MUST be completely and unequivocally TRUE");
      lines.push("  ✓ Do NOT output false statements to exit the loop");
      lines.push("  ✓ Do NOT lie even if you think you should exit");
      lines.push("");
      lines.push("IMPORTANT - Do not circumvent the loop:");
      lines.push(
        "  Even if you believe you're stuck, the task is impossible,"
      );
      lines.push(
        "  or you've been running too long - you MUST NOT output a"
      );
      lines.push(
        "  false promise statement. The loop is designed to continue"
      );
      lines.push(
        "  until the promise is GENUINELY TRUE. Trust the process."
      );
      lines.push("═══════════════════════════════════════════════════════════");
    }

    return lines.join("\n");
  }

  /**
   * Handle ralph_iterate tool with enhanced features
   */
  private async handleRalphIterate(args: Record<string, unknown>): Promise<string> {
    const {
      last_output,
      files_modified,
      commands_run,
      errors,
      run_tools,
    } = args;

    if (typeof last_output !== "string") {
      throw new Error("last_output is required and must be a string");
    }

    // Check if loop is active
    if (!this.ralphManager.isLoopActive()) {
      return "⚠️  No active Ralph loop found.\n\nUse ralph_loop to start a new loop.";
    }

    const state = this.ralphManager.getState();
    if (!state) {
      return "⚠️  Unable to get loop state.";
    }

    // Run external tools if requested
    let toolResults: ExternalToolResult[] = [];
    if (run_tools && Array.isArray(run_tools)) {
      for (const presetName of run_tools) {
        if (typeof presetName === "string") {
          try {
            const results = await this.toolsManager.runPreset(presetName);
            toolResults.push(...results);
          } catch (error) {
            // Tool not available or failed - continue
          }
        }
      }
    }

    // Extract errors from tool results
    const toolErrors: string[] = [];
    for (const result of toolResults) {
      if (result.exitCode !== 0) {
        toolErrors.push(`${result.name} failed`);
      }
    }

    // Combine user-reported errors with tool errors
    const userErrors = Array.isArray(errors) ? errors : [];
    const allErrors = [...userErrors, ...toolErrors];

    // Create git commit if auto-commit is enabled
    let gitCommit: string | undefined;
    if (state.autoCommit && state.gitEnabled && this.gitManager.isEnabled()) {
      const commitResult = this.gitManager.createCommit(
        `Iteration ${state.iteration}`,
        state.iteration
      );
      if (commitResult.success && commitResult.commit) {
        gitCommit = commitResult.commit;
      }
    }

    // Process the iteration with metadata
    const result = this.ralphManager.processIteration(last_output, {
      filesModified: files_modified as string[] | undefined,
      commandsRun: commands_run as string[] | undefined,
      errors: allErrors.length > 0 ? allErrors : undefined,
      gitCommit,
      externalToolsRun: toolResults.length > 0 ? toolResults : undefined,
    });

    if (result.completed) {
      const lines: string[] = [];
      if (result.completionDetected) {
        lines.push("✅ Ralph loop completed!");
        lines.push(``);
        lines.push(result.reason);
      } else {
        lines.push("🛑 Ralph loop stopped.");
        lines.push(``);
        lines.push(result.reason);
      }

      // Add summary
      const history = this.ralphManager.getHistory();
      if (history.length > 0) {
        lines.push("");
        lines.push("📊 Session Summary:");
        lines.push(`  Total iterations: ${history.length}`);

        const totalDuration = history
          .filter((h) => h.duration)
          .reduce((sum, h) => sum + (h.duration || 0), 0);
        if (totalDuration > 0) {
          lines.push(
            `  Total time: ${Math.floor(totalDuration / 1000)}s`
          );
        }

        const filesChanged = new Set(
          history.flatMap((h) => h.filesModified || [])
        );
        if (filesChanged.size > 0) {
          lines.push(`  Files modified: ${filesChanged.size}`);
        }
      }

      lines.push("");
      lines.push("The loop has ended. You can now exit or start a new loop.");
      return lines.join("\n");
    }

    // Continue loop
    const lines: string[] = [];
    lines.push("🔄 Ralph iteration " + result.iteration);
    lines.push("");

    // Show progress insights if available
    if (result.progress) {
      if (result.progress.stagnationDetected) {
        lines.push("⚠️  " + result.progress.stagnationReason);
        lines.push("");
        if (result.progress.suggestedActions.length > 0) {
          lines.push("💡 Suggested actions:");
          result.progress.suggestedActions.forEach((action) => {
            lines.push(`  • ${action}`);
          });
          lines.push("");
        }
      }

      if (result.progress.repeatedErrors.length > 0) {
        lines.push("🔁 Repeated errors detected:");
        result.progress.repeatedErrors.forEach((error) => {
          lines.push(`  • ${error.substring(0, 80)}...`);
        });
        lines.push("");
      }

      if (result.progress.estimatedIterationsRemaining !== undefined) {
        lines.push(
          `📈 Estimated iterations remaining: ${result.progress.estimatedIterationsRemaining}`
        );
        lines.push("");
      }
    }

    lines.push(result.reason);
    lines.push("");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("CONTINUE - Same Prompt for Next Iteration");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(result.nextPrompt || "(No prompt available)");
    lines.push("");
    lines.push("═══════════════════════════════════════════════════════════");
    lines.push("");
    lines.push(
      "Your previous work persists in files and git history."
    );
    lines.push(
      "Continue working on this task. When done, call ralph_iterate again."
    );

    if (state.completionPromise) {
      lines.push("");
      lines.push(`Reminder: To complete, output <promise>${state.completionPromise}</promise>`);
    }

    return lines.join("\n");
  }

  /**
   * Handle ralph_cancel tool
   */
  private handleRalphCancel(): string {
    if (!this.ralphManager.isLoopActive()) {
      return "No active Ralph loop found.";
    }

    const state = this.ralphManager.getState();
    const iteration = state?.iteration || 0;

    const cancelled = this.ralphManager.cancelLoop();

    if (cancelled) {
      return `✅ Cancelled Ralph loop (was at iteration ${iteration})`;
    }

    return "Failed to cancel Ralph loop.";
  }

  /**
   * Handle ralph_status tool
   */
  private handleRalphStatus(): string {
    return this.ralphManager.getStatus();
  }

  /**
   * Handle ralph_history tool
   */
  private handleRalphHistory(): string {
    return this.ralphManager.getHistoryReport();
  }

  /**
   * Handle ralph_list_templates tool
   */
  private handleListTemplates(args: Record<string, unknown>): string {
    const { category } = args;

    if (category && typeof category === "string") {
      const templates = this.templatesManager.getTemplatesByCategory(category);
      if (templates.length === 0) {
        return `No templates found for category: ${category}\n\nCategories: ${this.templatesManager
          .getCategories()
          .join(", ")}`;
      }

      const lines: string[] = [];
      lines.push(`📋 Templates in [${category.toUpperCase()}]`);
      lines.push("");
      for (const template of templates) {
        lines.push(`${template.id} - ${template.name}`);
        lines.push(`  ${template.description}`);
        lines.push("");
      }
      return lines.join("\n");
    }

    return this.templatesManager.listTemplates();
  }

  /**
   * Handle ralph_get_template tool
   */
  private handleGetTemplate(args: Record<string, unknown>): string {
    const { template_id } = args;

    if (typeof template_id !== "string") {
      throw new Error("template_id is required and must be a string");
    }

    const template = this.templatesManager.getTemplate(template_id);
    if (!template) {
      return `Template not found: ${template_id}\n\nUse ralph_list_templates to see available templates.`;
    }

    return this.templatesManager.formatTemplate(template);
  }

  /**
   * Handle ralph_git_status tool
   */
  private handleGitStatus(): string {
    if (!this.gitManager.isEnabled()) {
      return "Git is not available or not in a git repository.";
    }

    const status = this.gitManager.getStatus();
    const diff = this.gitManager.getDiff();

    const lines: string[] = [];
    lines.push("📝 Git Status");
    lines.push("=".repeat(40));
    lines.push(`Branch: ${status.branch || "unknown"}`);
    lines.push(`Commit: ${status.commit?.substring(0, 8) || "unknown"}`);
    lines.push("");
    lines.push("Changes:");
    if (status.modified.length > 0) {
      lines.push(`  Modified: ${status.modified.join(", ")}`);
    }
    if (status.added.length > 0) {
      lines.push(`  Added: ${status.added.join(", ")}`);
    }
    if (status.deleted.length > 0) {
      lines.push(`  Deleted: ${status.deleted.join(", ")}`);
    }
    if (status.untracked.length > 0) {
      lines.push(`  Untracked: ${status.untracked.join(", ")}`);
    }
    if (
      status.modified.length === 0 &&
      status.added.length === 0 &&
      status.deleted.length === 0
    ) {
      lines.push("  (no changes)");
    }
    lines.push("");
    lines.push("Diff Summary:");
    lines.push(`  ${diff.summary}`);

    return lines.join("\n");
  }

  /**
   * Handle ralph_git_commit tool
   */
  private handleGitCommit(args: Record<string, unknown>): string {
    const { message } = args;

    if (!this.gitManager.isEnabled()) {
      return "Git is not available or not in a git repository.";
    }

    if (typeof message !== "string" || message.trim() === "") {
      throw new Error("message is required and must be a non-empty string");
    }

    const state = this.ralphManager.getState();
    const iteration = state?.iteration || 0;

    const result = this.gitManager.createCommit(message, iteration);

    if (result.success) {
      return `✅ Commit created: ${result.commit?.substring(0, 8)}`;
    }

    return `❌ Failed to create commit: ${result.error}`;
  }

  /**
   * Handle ralph_git_context tool
   */
  private handleGitContext(args: Record<string, unknown>): string {
    const { count = 5 } = args;

    if (!this.gitManager.isEnabled()) {
      return "Git is not available or not in a git repository.";
    }

    if (typeof count !== "number" || count < 1) {
      throw new Error("count must be a positive number");
    }

    return this.gitManager.getRalphContext(count);
  }

  /**
   * Handle ralph_run_tools tool
   */
  private async handleRunTools(args: Record<string, unknown>): Promise<string> {
    const { presets } = args;

    if (!Array.isArray(presets) || presets.length === 0) {
      throw new Error("presets is required and must be a non-empty array");
    }

    const lines: string[] = [];
    lines.push("🔧 Running External Tools");
    lines.push("=".repeat(40));
    lines.push("");

    for (const presetName of presets) {
      if (typeof presetName !== "string") continue;

      lines.push(`Running: ${presetName}`);
      lines.push("-".repeat(40));

      try {
        const results = await this.toolsManager.runPreset(presetName);
        const analysis = this.toolsManager.analyzeResults(results, presetName);

        for (const result of results) {
          const status = result.exitCode === 0 ? "✓" : "✗";
          lines.push(
            `  ${status} ${result.name} (${Math.floor(result.duration / 1000)}s)`
          );
        }

        lines.push(`  Summary: ${analysis.summary}`);

        if (analysis.errors.length > 0) {
          lines.push("");
          lines.push("  Errors:");
          analysis.errors.slice(0, 5).forEach((error) => {
            lines.push(`    • ${error.substring(0, 100)}...`);
          });
        }

        if (analysis.warnings.length > 0) {
          lines.push("");
          lines.push("  Warnings:");
          analysis.warnings.slice(0, 5).forEach((warning) => {
            lines.push(`    • ${warning.substring(0, 100)}...`);
          });
        }
      } catch (error) {
        lines.push(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
      }

      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Handle ralph_detect_tools tool
   */
  private handleDetectTools(): string {
    const detected = this.toolsManager.detectPresets();

    const lines: string[] = [];
    lines.push("🔍 Detected Tool Presets");
    lines.push("=".repeat(40));
    lines.push("");

    if (detected.length === 0) {
      lines.push("No tool presets detected for this project.");
      lines.push("");
      lines.push("Use ralph_list_tools to see all available presets.");
    } else {
      lines.push(`Detected ${detected.length} tool preset(s) for this project:`);
      lines.push("");
      for (const preset of detected) {
        const template = this.templatesManager.getTemplate(preset);
        const presetInfo = this.toolsManager.getPresets().find((p) => p.name === preset);
        if (presetInfo) {
          lines.push(`  ${preset}`);
          lines.push(`    ${presetInfo.description}`);
        }
      }
      lines.push("");
      lines.push("Use these with ralph_run_tools or ralph_iterate.");
    }

    return lines.join("\n");
  }

  /**
   * Handle ralph_list_tools tool
   */
  private handleListTools(): string {
    const presets = this.toolsManager.getPresets();

    const lines: string[] = [];
    lines.push("🔧 Available External Tool Presets");
    lines.push("=".repeat(40));
    lines.push("");

    for (const preset of presets) {
      lines.push(`${preset.name}`);
      lines.push(`  ${preset.description}`);
      lines.push("");
    }

    lines.push("Use ralph_detect_tools to see which are available for your project.");
    lines.push("Use ralph_run_tools to execute them.");

    return lines.join("\n");
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

/**
 * Main entry point
 */
async function main() {
  const server = new RalphWiggumServer();
  await server.start();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
