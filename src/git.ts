/**
 * Git Integration for Ralph Wiggum Loops
 *
 * Provides git utilities for tracking changes, creating commits,
 * and analyzing differences between iterations.
 */

import { execSync, spawnSync } from "child_process";
import { existsSync } from "fs";
import { normalize, resolve } from "path";

export interface GitStatus {
  exists: boolean;
  branch?: string;
  commit?: string;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

export interface GitCommitResult {
  success: boolean;
  commit?: string;
  error?: string;
}

export interface GitDiffResult {
  files: string[];
  additions: number;
  deletions: number;
  summary: string;
}

/**
 * Git Integration Manager
 */
export class GitManager {
  private enabled: boolean;
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
    this.enabled = this.checkGitAvailable();
  }

  /**
   * Escape shell arguments to prevent command injection
   */
  private escapeShellArg(arg: string): string {
    // Replace single quotes and escape special characters
    return `"${arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  /**
   * Validate and sanitize numeric input
   */
  private validateNumber(value: number, min: number = 1, max: number = 1000): number {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`Invalid number: ${value}. Must be between ${min} and ${max}.`);
    }
    return value;
  }

  /**
   * Validate file path to prevent path traversal
   */
  private validateFilePath(filePath: string): string {
    // Resolve the path and ensure it doesn't escape the working directory
    const resolvedPath = resolve(this.workingDir, filePath);
    const normalizedPath = normalize(resolvedPath);

    // Ensure the resolved path is still within the working directory
    if (!normalizedPath.startsWith(resolve(this.workingDir))) {
      throw new Error(`Invalid file path: path traversal detected.`);
    }

    return normalizedPath;
  }

  /**
   * Check if git is available and we're in a git repository
   */
  private checkGitAvailable(): boolean {
    try {
      if (!existsSync(`${this.workingDir}/.git`)) {
        return false;
      }
      execSync("git --version", { cwd: this.workingDir, stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if git integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current git status
   */
  getStatus(): GitStatus {
    if (!this.enabled) {
      return { exists: false, modified: [], added: [], deleted: [], untracked: [] };
    }

    try {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: this.workingDir,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();

      const commit = execSync("git rev-parse HEAD", {
        cwd: this.workingDir,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();

      const statusOutput = execSync("git status --porcelain", {
        cwd: this.workingDir,
        encoding: "utf-8",
        stdio: "pipe",
      });

      const modified: string[] = [];
      const added: string[] = [];
      const deleted: string[] = [];
      const untracked: string[] = [];

      for (const line of statusOutput.split("\n")) {
        if (!line) continue;
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status.includes("M")) modified.push(file);
        if (status.includes("A")) added.push(file);
        if (status.includes("D")) deleted.push(file);
        if (status === "??") untracked.push(file);
      }

      return {
        exists: true,
        branch,
        commit,
        modified,
        added,
        deleted,
        untracked,
      };
    } catch (error) {
      return {
        exists: true,
        modified: [],
        added: [],
        deleted: [],
        untracked: [],
      };
    }
  }

  /**
   * Create a commit for the current iteration (SECURE: uses spawnSync to prevent command injection)
   */
  createCommit(message: string, iteration: number): GitCommitResult {
    if (!this.enabled) {
      return { success: false, error: "Git not available" };
    }

    try {
      // Sanitize message to prevent command injection
      const sanitizedMessage = message
        .replace(/[\"'`$;<>|&]/g, '') // Remove dangerous characters
        .substring(0, 200); // Limit length

      // Add all changes
      execSync("git add -A", {
        cwd: this.workingDir,
        stdio: "pipe",
      });

      // Check if there's anything to commit
      const status = this.getStatus();
      const hasChanges =
        status.modified.length > 0 ||
        status.added.length > 0 ||
        status.deleted.length > 0;

      if (!hasChanges) {
        return { success: false, error: "No changes to commit" };
      }

      // Create commit with iteration number in message
      // Use spawnSync with separate arguments to prevent shell injection
      const fullMessage = `[ralph-iter-${iteration}] ${sanitizedMessage}`;
      const result = spawnSync("git", ["commit", "-m", fullMessage], {
        cwd: this.workingDir,
        stdio: "pipe",
      });

      if (result.status !== 0) {
        return {
          success: false,
          error: result.stderr?.toString() || "Commit failed",
        };
      }

      // Get the commit hash
      const commit = execSync("git rev-parse HEAD", {
        cwd: this.workingDir,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();

      return { success: true, commit };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get diff summary since last commit
   */
  getDiff(): GitDiffResult {
    if (!this.enabled) {
      return { files: [], additions: 0, deletions: 0, summary: "Git not available" };
    }

    try {
      const diffOutput = execSync("git diff --stat HEAD", {
        cwd: this.workingDir,
        encoding: "utf-8",
        stdio: "pipe",
      });

      const lines = diffOutput.split("\n").filter((l) => l.trim());
      const files: string[] = [];
      let totalAdditions = 0;
      let totalDeletions = 0;

      for (const line of lines) {
        // Parse lines like: " file.txt | 5 +--"
        const match = line.match(/^\s*(.+?)\s+\|\s+(\d+)(?:\s+[+-]+)?$/);
        if (match) {
          const file = match[1].trim();
          files.push(file);

          // Extract additions and deletions
          const numChanges = parseInt(match[2], 10);
          const plusCount = (line.match(/\+/g) || []).length;
          const minusCount = (line.match(/-/g) || []).length;

          totalAdditions += plusCount;
          totalDeletions += minusCount;
        }
      }

      const summary =
        files.length > 0
          ? `${files.length} file(s) changed, ${totalAdditions} insertions(+), ${totalDeletions} deletions(-)`
          : "No changes";

      return {
        files,
        additions: totalAdditions,
        deletions: totalDeletions,
        summary,
      };
    } catch (error) {
      return {
        files: [],
        additions: 0,
        deletions: 0,
        summary: "Unable to get diff",
      };
    }
  }

  /**
   * Get file diff for a specific file (SECURE: validates path to prevent traversal)
   */
  getFileDiff(filePath: string): string {
    if (!this.enabled) {
      return "Git not available";
    }

    try {
      // Validate path to prevent traversal attacks
      const validatedPath = this.validateFilePath(filePath);

      // Use spawnSync with separate arguments
      const result = spawnSync("git", ["diff", "HEAD", "--", validatedPath], {
        cwd: this.workingDir,
        encoding: "utf-8",
        stdio: "pipe",
      });

      if (result.status !== 0) {
        return `Unable to get diff for ${filePath}`;
      }

      return result.stdout || "No changes in file";
    } catch (error) {
      return `Unable to get diff for ${filePath}`;
    }
  }

  /**
   * Get git log for the repository (SECURE: validates count parameter)
   */
  getLog(count: number = 10): string[] {
    if (!this.enabled) {
      return [];
    }

    try {
      // Validate count to prevent command injection
      const validatedCount = this.validateNumber(count, 1, 100);

      // Use spawnSync with separate arguments
      const result = spawnSync(
        "git",
        ["log", "-n", validatedCount.toString(), "--pretty=format:%h|%s|%ci"],
        {
          cwd: this.workingDir,
          encoding: "utf-8",
          stdio: "pipe",
        }
      );

      if (result.status !== 0) {
        return [];
      }

      const logOutput = result.stdout;

      return logOutput
        .split("\n")
        .filter((l) => l.trim())
        .map((line) => {
          const [hash, subject, date] = line.split("|");
          return `${hash} - ${subject} (${date})`;
        });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get context from recent Ralph commits (SECURE: validates count parameter)
   */
  getRalphContext(iterationCount: number = 5): string {
    if (!this.enabled) {
      return "";
    }

    try {
      // Validate count to prevent command injection
      const validatedCount = this.validateNumber(iterationCount, 1, 50);

      // Use spawnSync with separate arguments
      const result = spawnSync(
        "git",
        [
          "log",
          "-n",
          validatedCount.toString(),
          "--grep=ralph-iter",
          "--pretty=format:%h|%s|%ci",
        ],
        {
          cwd: this.workingDir,
          encoding: "utf-8",
          stdio: "pipe",
        }
      );

      if (result.status !== 0) {
        return "Unable to retrieve Ralph context from git";
      }

      const logOutput = result.stdout;

      const commits = logOutput
        .split("\n")
        .filter((l) => l.trim())
        .map((line) => {
          const [hash, subject, date] = line.split("|");
          return { hash, subject, date };
        });

      if (commits.length === 0) {
        return "No previous Ralph iterations found in git history.";
      }

      const lines: string[] = [];
      lines.push("📝 Recent Ralph Iterations (from git):");
      lines.push("");

      for (const commit of commits) {
        lines.push(`  ${commit.hash} - ${commit.subject}`);
        lines.push(`    ${commit.date}`);
      }

      return lines.join("\n");
    } catch (error) {
      return "Unable to retrieve Ralph context from git";
    }
  }

  /**
   * Stash changes (SECURE: uses spawnSync to prevent command injection)
   */
  stash(message?: string): boolean {
    if (!this.enabled) {
      return false;
    }

    try {
      // Sanitize message to prevent command injection
      const sanitizedMessage = message
        ? message
            .replace(/[\"'`$;<>|&]/g, '') // Remove dangerous characters
            .substring(0, 200) // Limit length
        : undefined;

      // Use spawnSync with separate arguments
      const args = sanitizedMessage
        ? ["stash", "push", "-m", sanitizedMessage]
        : ["stash"];

      const result = spawnSync("git", args, {
        cwd: this.workingDir,
        stdio: "pipe",
      });

      return result.status === 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if working directory is clean
   */
  isClean(): boolean {
    const status = this.getStatus();
    return (
      status.modified.length === 0 &&
      status.added.length === 0 &&
      status.deleted.length === 0 &&
      status.untracked.length === 0
    );
  }
}
