# Ralph Wiggum MCP Server v2.0

![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Type](https://img.shields.io/badge/type-MCP%20Server-orange)

An enhanced Model Context Protocol (MCP) server implementing the **Ralph Wiggum technique** for iterative, self-referential AI development loops.

## Table of Contents

- [Overview](#overview)
- [What is Ralph?](#what-is-ralph)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Tools Reference](#tools-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Ralph Wiggum MCP Server v2.0 is a production-ready implementation of the iterative development methodology that enables AI agents to continuously improve their work through systematic loops. This enhanced version adds enterprise-grade features including history tracking, git integration, external tool support, and comprehensive analytics.

**New in v2.0:**
- Iteration history tracking with progress metrics
- Git integration for automatic change tracking
- External tool integration (test runners, linters, formatters)
- Pre-built loop templates for common workflows
- Smart stagnation detection and warnings
- Resource tracking and performance analytics

---

## What is Ralph?

Ralph is a development methodology based on continuous AI agent loops. As Geoffrey Huntley describes it: **"Ralph is a Bash loop"**—a simple `while true` construct that repeatedly feeds an AI agent a prompt file, allowing it to iteratively improve its work until completion.

The technique is named after Ralph Wiggum from *The Simpsons*, embodying the philosophy of persistent iteration despite setbacks. This approach has demonstrated remarkable results:

- Successfully generated 6 repositories overnight in Y Combinator hackathon testing
- One $50k contract completed for $297 in API costs
- Created entire programming language ("cursed") over 3 months

---

## Features

### Core Loop Functionality

- **Manual iteration control** – Call `ralph_iterate` when ready
- **Completion promises** – Detect specific phrases to signal completion
- **Max iteration limits** – Safety net to prevent infinite loops
- **Persistent state** – Survives server restarts

### Enhanced Features (v2.0)

#### Progress Tracking & Analytics
- Track files modified, commands run, and errors per iteration
- Duration tracking for performance analysis
- Detect repeated errors and stagnation patterns
- Estimate remaining iterations
- Detailed history reports with convergence metrics

#### Git Integration
- Automatic commits after each iteration (optional)
- Track changes with diff summaries
- View context from previous Ralph commits
- Branch and commit tracking

#### External Tool Integration
- Run test suites (JavaScript, Python, Rust, Go)
- Execute linters and formatters
- Automatic error extraction
- Tool result analysis and reporting

#### Pre-built Templates
- **REST API Development** – Full CRUD with tests
- **Test-Driven Development** – Strict TDD methodology
- **Refactoring** – Safe code refactoring
- **Bug Fixing** – Systematic debugging with tests
- **Documentation** – Comprehensive docs generation
- **Performance Optimization** – Benchmarking and optimization
- **Security Hardening** – Vulnerability detection and fixes
- **Database Migration** – Safe schema migrations

---

## Installation

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** or **yarn** package manager
- **Git** (for git integration features)

### Install Dependencies

```bash
cd ralph-wiggum-mcp
npm install
```

### Build the Server

```bash
npm run build
```

### Configure MCP Client

Add to your MCP client configuration (e.g., REMOVED Desktop's `REMOVED_desktop_config.json`):

```json
{
  "mcpServers": {
    "ralph-wiggum": {
      "command": "node",
      "args": ["C:/chris-apps/REMOVED-mods/ralph-wiggum-mcp/dist/index.js"]
    }
  }
}
```

Adjust the path to match your installation location.

---

## Configuration

### Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `RALPH_MAX_ITERATIONS` | Default maximum iterations | `50` |
| `RALPH_AUTO_COMMIT` | Enable auto-commit by default | `false` |
| `RALPH_HISTORY_LIMIT` | Maximum history entries to keep | `100` |
| `RALPH_STAGNATION_THRESHOLD` | Iterations before stagnation warning | `5` |

---

## Tools Reference

### Core Tools

#### `ralph_loop`

Start a Ralph Wiggum iterative development loop.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | No* | The task prompt to iterate on |
| `template_id` | string | No | ID of a pre-built template to use |
| `max_iterations` | number | No | Maximum iterations before auto-stop (default: 0 = unlimited) |
| `completion_promise` | string | No | Promise phrase that signals completion |
| `git_enabled` | boolean | No | Enable git integration (default: true) |
| `auto_commit` | boolean | No | Auto-commit changes after each iteration (default: false) |

*Either `prompt` or `template_id` must be provided.

---

#### `ralph_iterate`

Process the next iteration with enhanced tracking.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `last_output` | string | Yes | Your last output/response |
| `files_modified` | array | No | List of files modified in this iteration |
| `commands_run` | array | No | List of commands executed |
| `errors` | array | No | List of errors encountered |
| `run_tools` | array | No | External tool presets to run (e.g., 'javascript-test') |

**Returns:**
- Progress analysis and stagnation warnings
- External tool results
- Git commit status (if enabled)

---

#### `ralph_cancel`

Cancel the active Ralph loop.

**Parameters:** None

---

#### `ralph_status`

Get current status with progress insights.

**Parameters:** None

**Returns:**
- Iteration number and progress
- History summary (time, files changed, tools used)
- Stagnation detection and repeated errors
- Estimated iterations remaining

---

### History & Reporting

#### `ralph_history`

Get detailed iteration history report.

**Parameters:** None

**Returns:**
- Timestamp and duration for each iteration
- Files modified and commands run
- Errors encountered
- Git commits
- External tool results

---

### Templates

#### `ralph_list_templates`

List all available templates.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category |

**Categories:** `api`, `testing`, `refactoring`, `debugging`, `documentation`, `performance`, `security`, `database`, `quality`

---

#### `ralph_get_template`

Get details of a specific template.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `template_id` | string | Yes | The ID of the template |

**Returns:**
- Full prompt text
- Suggested settings
- Recommended external tools

---

### Git Integration

#### `ralph_git_status`

Get git status and diff summary.

**Parameters:** None

**Returns:**
- Current branch and commit
- Modified, added, deleted files
- Diff summary (insertions, deletions)

---

#### `ralph_git_commit`

Create a git commit manually.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Commit message |

---

#### `ralph_git_context`

Get context from recent Ralph commits.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `count` | number | No | Number of commits to show (default: 5) |

---

### External Tools

#### `ralph_run_tools`

Run external tool presets.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `presets` | array | Yes | List of preset names |

**Available Presets:**
- `javascript-test` – Run npm test
- `javascript-lint` – Run ESLint
- `python-test` – Run pytest
- `python-lint` – Run ruff
- `rust-test` – Run cargo test
- `rust-lint` – Run clippy
- `go-test` – Run go test
- `build` – Verify project builds

---

#### `ralph_detect_tools`

Detect which tool presets are available for your project.

**Analyzes:**
- `package.json` (JavaScript/TypeScript)
- `setup.py`/`pyproject.toml` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)

---

#### `ralph_list_tools`

List all available tool presets with descriptions.

**Parameters:** None

---

## Usage Examples

### Example 1: Using a Template

```
Use ralph_loop with:
- template_id: "rest-api"
- auto_commit: true

Then work on the task and call ralph_iterate with:
- last_output: your response
- run_tools: ["javascript-test", "javascript-lint"]
```

### Example 2: TDD with Automatic Testing

```
Use ralph_loop with:
- template_id: "tdd"

Each iteration, call ralph_iterate with:
- last_output: your response
- files_modified: ["src/calculator.ts", "src/calculator.test.ts"]
- run_tools: ["javascript-test"]
```

### Example 3: Bug Fixing with History

```
Use ralph_loop with:
- prompt: "Fix the authentication bug. When tests pass, output <promise>BUG_FIXED</promise>"
- max_iterations: 15

Track progress with:
- ralph_status (current iteration, errors found)
- ralph_history (what was tried in each iteration)
- ralph_git_context (see commits from previous attempts)
```

### Example 4: Refactoring with Safety

```
Use ralph_loop with:
- template_id: "refactor"
- auto_commit: true (commit after each successful step)

Each iteration:
1. Make small changes
2. Run tests with ralph_iterate run_tools: ["javascript-test"]
3. If tests pass, auto-commit happens
4. If tests fail, revert and try again
```

---

## Best Practices

### 1. Clear Completion Criteria

**Poor:**
```
"Build a todo API and make it good."
```

**Good:**
```
Build a REST API for todos.

When complete:
- All CRUD endpoints working
- Input validation in place
- Tests passing (coverage > 80%)
- README with API docs

Output <promise>API_COMPLETE</promise> when done.
```

### 2. Use External Tools for Verification

**Good:**
```
Implement feature X with tests.

Each iteration:
- Call ralph_iterate with run_tools: ["javascript-test"]
- Only output <promise>COMPLETE</promise> when tests pass
```

### 3. Enable Auto-Commit for Safe Iteration

**Good:**
```
Refactor the codebase.

Use auto_commit: true so each successful step is saved.
If you break something, you can easily revert to the last working state.
```

### 4. Leverage Templates

```
Use ralph_list_templates to see available templates.
Use ralph_get_template with template_id: "tdd" to see the full prompt.
Then start the loop with template_id: "tdd" to use it directly.
```

---

## Philosophy

Ralph embodies several key principles:

### 1. Iteration > Perfection
Don't aim for perfect on first try. Let the loop refine the work.

### 2. Failures Are Data
"Deterministically bad" means failures are predictable and informative. Use them to tune prompts.

### 3. Operator Skill Matters
Success depends on writing good prompts, not just having a good model.

### 4. Persistence Wins
Keep trying until success. The loop handles retry logic automatically.

### 5. Measurement Improves Outcomes
Track what works, what doesn't, and adjust accordingly. Use history to learn.

---

## When to Use Ralph

**Best For:**
- Well-defined tasks with clear success criteria
- Tasks requiring iteration and refinement (e.g., getting tests to pass)
- Greenfield projects where you can walk away
- Tasks with automatic verification (tests, linters)
- Refactoring with safety nets
- Learning codebases through iterative exploration

**Not Recommended For:**
- Tasks requiring human judgment or design decisions
- One-shot operations
- Tasks with unclear success criteria
- Production debugging (use targeted debugging instead)

---

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Watch mode for development |
| `npm start` | Start the server |
| `npm test` | Run tests |
| `npm run test:security` | Run security tests |
| `npm run test:coverage` | Run tests with coverage |

### Project Structure

```
ralph-wiggum-mcp/
├── src/
│   ├── index.ts          # Server entry point
│   ├── handlers/         # Tool handlers
│   ├── templates/        # Loop templates
│   └── utils/            # Utilities
├── dist/                 # Compiled output
├── package.json
└── README.md
```

---

## Contributing

Contributions are welcome! Please feel free to:

- Report bugs via issues
- Suggest new features
- Submit pull requests
- Improve documentation
- Add new loop templates

---

## Resources

- [Original Technique](https://ghuntley.com/ralph/) by Geoffrey Huntley
- [Ralph Orchestrator](https://github.com/mikeyobrien/ralph-orchestrator)
- [REMOVED Code Plugin](https://github.com/anthropics/REMOVED-code/tree/main/plugins/ralph-wiggum) by Anthropic
- [Model Context Protocol](https://modelcontextprotocol.io) specification

---

## License

MIT License

---

**Copyright 2026 by Chris Bunting. All rights reserved.**
