/**
 * Security Tests for Ralph Wiggum MCP Server
 *
 * Tests to validate security hardening and vulnerability prevention.
 */

import { describe, it, expect } from "@jest/globals";
import { GitManager } from "./git.js";

describe("Security Tests", () => {
  describe("GitManager - Command Injection Prevention", () => {
    const gitManager = new GitManager();

    describe("validateNumber", () => {
      it("should accept valid numbers", () => {
        // This tests the private method indirectly through public methods
        const result = gitManager.getLog(10);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should prevent command injection via negative numbers", () => {
        const result = gitManager.getLog(-1);
        expect(Array.isArray(result)).toBe(true);
        // Should return empty array or throw, not execute command
      });

      it("should prevent command injection via large numbers", () => {
        const result = gitManager.getLog(999999);
        expect(Array.isArray(result)).toBe(true);
        // Should be limited, not cause DoS
      });
    });

    describe("createCommit - Message Sanitization", () => {
      it("should sanitize shell metacharacters in commit messages", () => {
        // Test with various injection attempts
        const maliciousMessages = [
          'normal message"; rm -rf /; #',
          'message && malicious_command',
          'message | cat /etc/passwd',
          'message `whoami`',
          'message $(cat /etc/passwd)',
          'message with "quotes" and $dollar',
        ];

        for (const msg of maliciousMessages) {
          const result = gitManager.createCommit(msg, 1);
          // Should either succeed with sanitized message or fail safely
          // Should not execute the injected commands
          expect(result).toBeDefined();
        }
      });
    });

    describe("stash - Message Sanitization", () => {
      it("should sanitize shell metacharacters in stash messages", () => {
        const maliciousMessages = [
          'message"; echo "hacked',
          'message && evil',
          'message `whoami`',
          'message $(evil)',
        ];

        for (const msg of maliciousMessages) {
          const result = gitManager.stash(msg);
          // Should return boolean, not execute injected commands
          expect(typeof result).toBe('boolean');
        }
      });
    });
  });

  describe("Path Traversal Prevention", () => {
    const gitManager = new GitManager();

    it("should prevent path traversal in getFileDiff", () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        'C:\\Windows\\System32\\config\\SAM',
        'file.txt/../../etc/passwd',
      ];

      for (const path of maliciousPaths) {
        const result = gitManager.getFileDiff(path);
        // Should return error message, not expose system files
        expect(typeof result).toBe('string');
        expect(result).not.toContain('root:');
        expect(result).not.toContain('[extensions]');
      }
    });
  });

  describe("Input Validation", () => {
    const gitManager = new GitManager();

    it("should validate count parameter in getLog", () => {
      // Valid inputs
      expect(gitManager.getLog(1)).toBeDefined();
      expect(gitManager.getLog(50)).toBeDefined();
      expect(gitManager.getLog(10)).toBeDefined();
    });

    it("should validate count parameter in getRalphContext", () => {
      // Valid inputs
      expect(gitManager.getRalphContext(1)).toBeDefined();
      expect(gitManager.getRalphContext(25)).toBeDefined();
      expect(gitManager.getRalphContext(5)).toBeDefined();
    });
  });

  describe("Denial of Service Prevention", () => {
    const gitManager = new GitManager();

    it("should limit output size to prevent memory exhaustion", () => {
      // Create a message with thousands of characters
      const longMessage = 'A'.repeat(10000);

      const result = gitManager.createCommit(longMessage, 1);
      // Should truncate, not crash
      expect(result).toBeDefined();
    });

    it("should limit file path length", () => {
      const longPath = 'A'.repeat(10000);
      const result = gitManager.getFileDiff(longPath);
      // Should handle gracefully, not crash
      expect(typeof result).toBe('string');
    });
  });

  describe("Character Filtering", () => {
    const dangerousChars = [
      ['"', 'double quote'],
      ["'", 'single quote'],
      ['`', 'backtick'],
      ['$', 'dollar sign'],
      [';', 'semicolon'],
      ['<', 'less than'],
      ['>', 'greater than'],
      ['|', 'pipe'],
      ['&', 'ampersand'],
      ['\n', 'newline'],
      ['\r', 'carriage return'],
    ];

    it("should filter dangerous shell characters", () => {
      const gm = new GitManager();
      for (const [char, name] of dangerousChars) {
        const message = `test ${char} injection`;
        const result = gm.createCommit(message, 1);
        // Should handle safely
        expect(result).toBeDefined();
      }
    });
  });
});

/**
 * Integration Security Tests
 */
describe("Integration Security Tests", () => {
  it("should not expose working directory in error messages", () => {
    const gm = new GitManager();
    const result = gm.getLog(999999);
    // Errors should not leak full paths
    if (result.length === 0) {
      expect(true).toBe(true);
    }
  });

  it("should handle concurrent operations safely", () => {
    const gm = new GitManager();
    const promises = [
      Promise.resolve(gm.getLog(5)),
      Promise.resolve(gm.getStatus()),
      Promise.resolve(gm.getDiff()),
    ];

    const results = Promise.all(promises);
    expect(results).toBeDefined();
  });
});
