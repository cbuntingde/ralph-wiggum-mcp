/**
 * Loop Templates for Ralph Wiggum
 *
 * Pre-built prompts and configurations for common development tasks.
 */

export interface LoopTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  suggestedCompletionPromise: string;
  suggestedMaxIterations: number;
  suggestedTools?: string[];
  gitEnabled: boolean;
  autoCommit: boolean;
}

/**
 * Templates Manager
 */
export class TemplatesManager {
  private templates: Map<string, LoopTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize built-in templates
   */
  private initializeTemplates(): void {
    // API Development
    this.addTemplate({
      id: "rest-api",
      name: "REST API Development",
      description: "Build a REST API with full CRUD operations",
      category: "api",
      prompt: `Build a REST API with the following requirements:

1. Create models for the resource
2. Implement CRUD endpoints (Create, Read, Update, Delete)
3. Add input validation
4. Add proper error handling
5. Write unit tests for all endpoints
6. Add API documentation (README with examples)

Use test-driven development:
- Write failing tests first
- Implement features to make tests pass
- Refactor for code quality
- Repeat until all tests pass

Make sure tests achieve >80% code coverage.`,
      suggestedCompletionPromise: "API_COMPLETE",
      suggestedMaxIterations: 30,
      suggestedTools: ["javascript-test", "javascript-lint"],
      gitEnabled: true,
      autoCommit: false,
    });

    // Test-Driven Development
    this.addTemplate({
      id: "tdd",
      name: "Test-Driven Development",
      description: "Implement a feature using strict TDD methodology",
      category: "testing",
      prompt: `Implement the feature using strict Test-Driven Development:

TDD Process:
1. Write a failing test for a small piece of functionality
2. Run the test - confirm it fails
3. Write the minimum code to make the test pass
4. Run the test - confirm it passes
5. Refactor the code if needed
6. Run the test - confirm it still passes
7. Repeat from step 1 for the next piece of functionality

Rules:
- Never write code without a failing test first
- Keep tests small and focused
- Only write enough code to make the current test pass
- Run tests after every change
- When all tests pass and code is clean, you're done`,
      suggestedCompletionPromise: "ALL_TESTS_PASSING",
      suggestedMaxIterations: 20,
      suggestedTools: ["javascript-test"],
      gitEnabled: true,
      autoCommit: false,
    });

    // Refactoring
    this.addTemplate({
      id: "refactor",
      name: "Safe Refactoring",
      description: "Refactor code with safety checks and tests",
      category: "refactoring",
      prompt: `Refactor the codebase with the following approach:

Refactoring Process:
1. Write tests covering existing behavior (if none exist)
2. Make small, incremental changes
3. Run tests after each change
4. Commit after each successful refactoring step
5. Ensure functionality remains identical

Refactoring Goals:
- Improve code readability
- Reduce complexity
- Eliminate code duplication
- Apply design patterns where appropriate
- Improve performance (if possible)

Safety Rules:
- Never change functionality without tests
- Run tests after every change
- If tests fail, revert immediately
- Keep changes small and focused
- Commit often to enable easy rollback`,
      suggestedCompletionPromise: "REFACTORING_COMPLETE",
      suggestedMaxIterations: 25,
      suggestedTools: ["javascript-test", "javascript-lint"],
      gitEnabled: true,
      autoCommit: true,
    });

    // Bug Fixing
    this.addTemplate({
      id: "bug-fix",
      name: "Bug Fixing with Tests",
      description: "Fix bugs with proper test coverage",
      category: "debugging",
      prompt: `Fix the bug using the following methodology:

Bug Fixing Process:
1. Understand the bug - read error messages and reproduce the issue
2. Write a failing test that reproduces the bug
3. Investigate the root cause
4. Implement the fix
5. Run the test - confirm it now passes
6. Add additional tests for edge cases
7. Check for similar issues elsewhere in the code
8. Run the full test suite

If you cannot fix the bug after 5 attempts:
- Document what you've tried
- Explain the blocking issue
- Suggest alternative approaches

Output <promise>BUG_FIXED</promise> when:
- The original test case passes
- Edge case tests pass
- Full test suite passes
- No regressions introduced`,
      suggestedCompletionPromise: "BUG_FIXED",
      suggestedMaxIterations: 15,
      suggestedTools: ["javascript-test"],
      gitEnabled: true,
      autoCommit: false,
    });

    // Documentation
    this.addTemplate({
      id: "docs",
      name: "Documentation Generation",
      description: "Generate comprehensive documentation",
      category: "documentation",
      prompt: `Generate comprehensive documentation for the codebase:

Documentation Tasks:
1. Write a detailed README with:
   - Project overview and purpose
   - Installation instructions
   - Usage examples
   - API documentation
   - Configuration options
   - Contributing guidelines

2. Add inline code comments where complex logic exists
3. Create examples demonstrating common use cases
4. Document error conditions and edge cases
5. Add architecture diagrams (using ASCII/Mermaid)

Quality Standards:
- Clear, concise explanations
- Code examples for all features
- Accurate and up-to-date information
- Professional formatting`,
      suggestedCompletionPromise: "DOCS_COMPLETE",
      suggestedMaxIterations: 10,
      gitEnabled: true,
      autoCommit: false,
    });

    // Performance Optimization
    this.addTemplate({
      id: "optimize",
      name: "Performance Optimization",
      description: "Optimize code performance with benchmarks",
      category: "performance",
      prompt: `Optimize the codebase for better performance:

Optimization Process:
1. Profile the code to identify bottlenecks
2. Write benchmarks for critical paths
3. Optimize the slowest parts first
4. Run benchmarks to verify improvement
5. Ensure tests still pass
6. Document performance improvements

Optimization Goals:
- Reduce time complexity where possible
- Minimize memory usage
- Improve cache efficiency
- Reduce unnecessary allocations
- Optimize database queries

Safety Rules:
- Never sacrifice correctness for performance
- Always have tests before optimizing
- Measure before and after optimization
- Keep code readable - avoid premature optimization`,
      suggestedCompletionPromise: "OPTIMIZED",
      suggestedMaxIterations: 20,
      suggestedTools: ["javascript-test"],
      gitEnabled: true,
      autoCommit: true,
    });

    // Security Hardening
    this.addTemplate({
      id: "security",
      name: "Security Hardening",
      description: "Find and fix security vulnerabilities",
      category: "security",
      prompt: `Security hardening for the codebase:

Security Tasks:
1. Audit code for common vulnerabilities:
   - SQL injection
   - XSS (cross-site scripting)
   - CSRF (cross-site request forgery)
   - Insecure dependencies
   - Missing authentication/authorization
   - Sensitive data exposure

2. Fix identified vulnerabilities
3. Add security tests
4. Implement security headers
5. Add input validation and sanitization
6. Review and update dependencies

Completion Criteria:
- No critical/high vulnerabilities remain
- Security tests added and passing
- Dependencies updated to secure versions
- Security headers implemented`,
      suggestedCompletionPromise: "SECURE",
      suggestedMaxIterations: 20,
      suggestedTools: ["javascript-test", "javascript-lint"],
      gitEnabled: true,
      autoCommit: true,
    });

    // Database Migration
    this.addTemplate({
      id: "db-migrate",
      name: "Database Migration",
      description: "Safely migrate database schema",
      category: "database",
      prompt: `Perform database migration with zero downtime:

Migration Process:
1. Analyze current schema and data
2. Design new schema
3. Create migration scripts (forward and backward)
4. Write tests for migration logic
5. Test migration on sample data
6. Create rollback plan
7. Update application code for new schema
8. Verify data integrity after migration

Safety Rules:
- Always provide rollback migration
- Test migrations thoroughly
- Backup data before migration
- Ensure backward compatibility during transition
- Document migration steps

Completion Criteria:
- Migration scripts created (up and down)
- Tests verify data integrity
- Rollback tested and working
- Application code updated
- Documentation updated`,
      suggestedCompletionPromise: "MIGRATION_COMPLETE",
      suggestedMaxIterations: 15,
      gitEnabled: true,
      autoCommit: true,
    });

    // Code Review
    this.addTemplate({
      id: "review",
      name: "Automated Code Review",
      description: "Review code for issues and improvements",
      category: "quality",
      prompt: `Perform comprehensive code review:

Review Checklist:
1. Correctness:
   - Logic errors
   - Edge cases not handled
   - Race conditions
   - Memory leaks

2. Code Quality:
   - Code duplication
   - Complex functions that need refactoring
   - Naming conventions
   - Design patterns

3. Security:
   - Input validation
   - Authentication/authorization
   - Sensitive data handling
   - Dependency vulnerabilities

4. Performance:
   - Inefficient algorithms
   - Unnecessary database queries
   - Memory usage
   - Caching opportunities

5. Testing:
   - Missing test coverage
   - Test quality
   - Edge case tests

For each issue found:
- Explain the problem
- Provide specific code references
- Suggest concrete improvements
- Prioritize by severity (critical/high/medium/low)`,
      suggestedCompletionPromise: "REVIEW_COMPLETE",
      suggestedMaxIterations: 10,
      gitEnabled: false,
      autoCommit: false,
    });
  }

  /**
   * Add a template
   */
  addTemplate(template: LoopTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): LoopTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): LoopTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): LoopTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category
    );
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set(
      Array.from(this.templates.values()).map((t) => t.category)
    );
    return Array.from(categories).sort();
  }

  /**
   * Search templates by keyword
   */
  searchTemplates(keyword: string): LoopTemplate[] {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerKeyword) ||
        t.description.toLowerCase().includes(lowerKeyword) ||
        t.category.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get template as formatted string
   */
  formatTemplate(template: LoopTemplate): string {
    const lines: string[] = [];
    lines.push(`📋 ${template.name}`);
    lines.push(`=".repeat(50)}`);
    lines.push(`ID: ${template.id}`);
    lines.push(`Category: ${template.category}`);
    lines.push(``);
    lines.push(template.description);
    lines.push(``);
    lines.push(`Suggested settings:`);
    lines.push(`  Completion promise: ${template.suggestedCompletionPromise}`);
    lines.push(`  Max iterations: ${template.suggestedMaxIterations}`);
    if (template.suggestedTools && template.suggestedTools.length > 0) {
      lines.push(`  External tools: ${template.suggestedTools.join(", ")}`);
    }
    lines.push(`  Git enabled: ${template.gitEnabled}`);
    lines.push(`  Auto-commit: ${template.autoCommit}`);
    lines.push(``);
    lines.push(`Prompt:`);
    lines.push(`".repeat(50)}`);
    lines.push(template.prompt);
    lines.push(`".repeat(50)}`);

    return lines.join("\n");
  }

  /**
   * List all templates with brief info
   */
  listTemplates(): string {
    const lines: string[] = [];
    lines.push("📚 Available Ralph Loop Templates");
    lines.push("=".repeat(50));
    lines.push("");

    const categories = this.getCategories();
    for (const category of categories) {
      lines.push(`[${category.toUpperCase()}]`);
      const templates = this.getTemplatesByCategory(category);
      for (const template of templates) {
        lines.push(`  ${template.id.padEnd(15)} - ${template.name}`);
        lines.push(`"                    }${template.description}`);
      }
      lines.push("");
    }

    lines.push("Use a template by specifying its ID when starting a loop.");
    lines.push("Example: ralph_loop with template_id='tdd'");

    return lines.join("\n");
  }
}
