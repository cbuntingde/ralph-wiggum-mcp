# Ralph Wiggum MCP Server v2.0

![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Type](https://img.shields.io/badge/type-MCP%20Server-orange)

A production-ready Model Context Protocol (MCP) server implementing the **Ralph Wiggum technique**—iterative AI development loops with history tracking, git integration, and comprehensive analytics.

## Overview

Ralph Wiggum MCP Server enables AI agents to continuously improve work through systematic loops. Named after Ralph Wiggum from *The Simpsons*, it embodies persistent iteration despite setbacks.

**New in v2.0:**
- Iteration history tracking with progress metrics
- Git integration for automatic change tracking
- External tool integration (test runners, linters, formatters)
- Pre-built loop templates
- Stagnation detection and warnings
- Performance analytics

## Features

### Core
- Manual iteration control with `ralph_iterate`
- Completion promises for automatic loop termination
- Max iteration safety limits
- Persistent state across server restarts

### Progress Tracking
- Track files modified, commands run, and errors per iteration
- Duration tracking and performance analysis
- Stagnation detection and repeated error warnings
- History reports with convergence metrics

### Git Integration
- Automatic commits after each iteration (optional)
- Diff summaries and change tracking
- Context from previous Ralph commits

### External Tools
- Run test suites (JavaScript, Python, Rust, Go)
- Execute linters and formatters
- Automatic error extraction and analysis

### Templates
REST API, TDD, Refactoring, Bug Fixing, Documentation, Performance Optimization, Security Hardening, Database Migration

## Installation

**Prerequisites:**
- Node.js ≥18.0.0
- npx (comes with npm ≥5.2.0)
- Git (optional, for git integration)

### Quick Start (Recommended)

No installation required! Simply use npx:

**MCP Client Configuration:**

Add to your MCP client config (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ralph-wiggum": {
      "command": "npx",
      "args": ["ralph-wiggum-mcp"]
    }
  }
}
```

That's it! The package will be automatically downloaded and run on first use.

### Local Development Setup

If you want to develop or contribute:

```bash
git clone https://github.com/cbuntingde/ralph-wiggum-mcp.git
cd ralph-wiggum-mcp
npm install
npm run build
```

Then configure your MCP client to use the local build:

```json
{
  "mcpServers": {
    "ralph-wiggum": {
      "command": "node",
      "args": ["C:/path/to/ralph-wiggum-mcp/dist/index.js"]
    }
  }
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RALPH_MAX_ITERATIONS` | `50` | Default maximum iterations |
| `RALPH_AUTO_COMMIT` | `false` | Enable auto-commit by default |
| `RALPH_HISTORY_LIMIT` | `100` | Maximum history entries |
| `RALPH_STAGNATION_THRESHOLD` | `5` | Iterations before stagnation warning |

## Tools Reference

### Core Tools

#### `ralph_loop`
Start an iterative development loop.

**Parameters:**
- `prompt` (string, optional*) – Task prompt
- `template_id` (string, optional) – Pre-built template ID
- `max_iterations` (number, optional) – Max iterations (0 = unlimited)
- `completion_promise` (string, optional) – Promise phrase signaling completion
- `git_enabled` (boolean, optional) – Enable git integration (default: `true`)
- `auto_commit` (boolean, optional) – Auto-commit after each iteration (default: `false`)

*Either `prompt` or `template_id` required.

#### `ralph_iterate`
Process the next iteration with tracking.

**Parameters:**
- `last_output` (string, required) – Your last output/response
- `files_modified` (array, optional) – Files modified
- `commands_run` (array, optional) – Commands executed
- `errors` (array, optional) – Errors encountered
- `run_tools` (array, optional) – External tool presets (e.g., `['javascript-test']`)

#### `ralph_cancel`
Cancel the active Ralph loop.

#### `ralph_status`
Get current status with progress insights.

**Returns:** iteration number, history summary, stagnation detection, estimated iterations remaining.

### History & Reporting

#### `ralph_history`
Get detailed iteration history report.

**Returns:** timestamps, durations, files modified, commands run, errors, git commits, tool results.

### Templates

#### `ralph_list_templates`
List available templates.

**Parameter:** `category` (optional) – Filter by category: `api`, `testing`, `refactoring`, `debugging`, `documentation`, `performance`, `security`, `database`

#### `ralph_get_template`
Get template details.

**Parameter:** `template_id` (required) – Template ID

**Returns:** full prompt text, suggested settings, recommended tools.

### Git Integration

#### `ralph_git_status`
Get git status and diff summary.

#### `ralph_git_commit`
Create a git commit manually.

**Parameter:** `message` (required) – Commit message

#### `ralph_git_context`
Get context from recent Ralph commits.

**Parameter:** `count` (optional) – Number of commits (default: 5)

### External Tools

#### `ralph_run_tools`
Run external tool presets.

**Parameter:** `presets` (required, array) – Preset names

**Available presets:**
- `javascript-test` – npm test
- `javascript-lint` – ESLint
- `python-test` – pytest
- `python-lint` – ruff
- `rust-test` – cargo test
- `rust-lint` – clippy
- `go-test` – go test
- `build` – Verify project builds

#### `ralph_detect_tools`
Detect available tool presets for your project.

#### `ralph_list_tools`
List all tool presets with descriptions.

## Usage Examples

### Beginner Example: Building a Simple App

**Step 1: Start the loop**

Tell your AI to use `ralph_loop` with:
```
prompt: "Create a simple to-do list app with Node.js and Express. 
Requirements: 
- Add, view, delete todos
- Store in memory
- Output <promise>DONE</promise> when complete"
```

**Step 2: AI starts working**

The AI will create initial files. When it reports what it did, it calls `ralph_iterate` with:
```
last_output: "I created server.js with Express and endpoints for todos"
files_modified: ["server.js", "package.json"]
```

**Step 3: AI continues iterating**

The AI keeps improving the code, calling `ralph_iterate` each time with updates.

**Step 4: Completion**

When the AI meets all requirements, it outputs `<promise>DONE</promise>` and the loop stops.

### Step-by-Step Example with Testing

**Step 1: Start a development loop**

```
ralph_loop with:
- prompt: "Create a calculator module with add, subtract, multiply, divide functions. 
  Write tests first. Keep iterating until tests pass. 
  Output <promise>CALCULATOR_DONE</promise> when complete."
- max_iterations: 20
```

**Step 2: AI writes first test**

```
ralph_iterate with:
- last_output: "Created calculator.test.js with test for add() function"
- files_modified: ["calculator.test.js"]
```

**Step 3: AI implements function**

```
ralph_iterate with:
- last_output: "Implemented add() function in calculator.js"
- files_modified: ["calculator.js"]
- run_tools: ["javascript-test"]
```

**Step 4: Check if tests pass**

The `run_tools` parameter runs `npm test`. If tests fail, the AI sees the errors and tries again.

**Step 5: Repeat until success**

The loop continues calling `ralph_iterate` until all tests pass, then outputs `<promise>CALCULATOR_DONE</promise>`.

### Using Pre-Built Templates

**Step 1: See available templates**

```
ralph_list_templates
```

**Step 2: Get a specific template**

```
ralph_get_template with template_id: "rest-api"
```

This shows you the full prompt and recommended settings.

**Step 3: Start with the template**

```
ralph_loop with:
- template_id: "rest-api"
- auto_commit: true
```

The AI automatically uses the template's prompt and settings.

### Tracking Progress During Development

While a loop is running, you can check progress:

```
ralph_status
```

This shows:
- Current iteration number
- Files modified so far
- Errors encountered
- Whether you've been stuck on the same error

```
ralph_history
```

Shows detailed history of every iteration.

### Template-Based Development

Quick start using built-in templates:

```
ralph_loop with:
- template_id: "rest-api"
- auto_commit: true

Each iteration:
ralph_iterate with:
- last_output: your response
- run_tools: ["javascript-test", "javascript-lint"]
```

### TDD with Automatic Testing

```
ralph_loop with:
- template_id: "tdd"

Each iteration:
ralph_iterate with:
- last_output: your response
- files_modified: ["src/calculator.ts", "src/calculator.test.ts"]
- run_tools: ["javascript-test"]
```

### Bug Fixing

```
ralph_loop with:
- prompt: "Fix authentication bug. Output <promise>BUG_FIXED</promise> when tests pass."
- max_iterations: 15

Track with:
- ralph_status
- ralph_history
- ralph_git_context
```

## Best Practices

**1. Clear Completion Criteria**

```
Build a REST API for todos.

Requirements:
- All CRUD endpoints working
- Input validation
- Tests passing (coverage > 80%)
- README with API docs

Output <promise>API_COMPLETE</promise> when done.
```

**2. Use External Tools**

```
Implement feature X with tests.

Each iteration:
- ralph_iterate with run_tools: ["javascript-test"]
- Only output <promise>COMPLETE</promise> when tests pass
```

**3. Enable Auto-Commit**

```
Refactor codebase with auto_commit: true.

Each successful step is saved automatically.
If broken, revert to last working state.
```

**4. Leverage Templates**

```
ralph_list_templates → view available templates
ralph_get_template with template_id: "tdd" → view full prompt
ralph_loop with template_id: "tdd" → start loop
```

## Philosophy

1. **Iteration > Perfection** – Let the loop refine the work
2. **Failures Are Data** – Predictable failures inform prompt tuning
3. **Operator Skill Matters** – Success depends on good prompts
4. **Persistence Wins** – Keep trying until success
5. **Measurement Improves Outcomes** – Track and learn from history

## When to Use

**Best For:**
- Well-defined tasks with clear success criteria
- Tasks requiring iteration and refinement
- Greenfield projects
- Tasks with automatic verification (tests, linters)
- Refactoring with safety nets

**Not Recommended For:**
- Human judgment or design decisions
- One-shot operations
- Unclear success criteria
- Production debugging (use targeted debugging instead)

## Development

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Watch mode |
| `npm start` | Start server |
| `npm test` | Run tests |
| `npm run test:security` | Security tests |
| `npm run test:coverage` | Coverage tests |

**Project Structure:**
```
ralph-wiggum-mcp/
├── src/
│   ├── index.ts          # Server entry
│   ├── handlers/         # Tool handlers
│   ├── templates/        # Loop templates
│   └── utils/            # Utilities
├── dist/                 # Compiled output
└── package.json
```

## Contributing

Contributions welcome! Report bugs, suggest features, submit pull requests, improve documentation, or add new templates.

## Resources

- [Original Technique](https://ghuntley.com/ralph/) – Geoffrey Huntley
- [Ralph Orchestrator](https://github.com/mikeyobrien/ralph-orchestrator)
- [Claude Code Plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) – Anthropic
- [Model Context Protocol](https://modelcontextprotocol.io) – Specification

## License

MIT License
