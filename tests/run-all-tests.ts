#!/usr/bin/env bun

/**
 * Comprehensive test runner for XGPT CLI
 * Runs all tests and provides detailed reporting
 */

import { spawn } from "bun";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  output: string;
  success: boolean;
}

interface TestSuite {
  name: string;
  path: string;
  description: string;
  required: boolean;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: "Unit Tests",
    path: "tests/unit",
    description: "Core functionality and rate limiting tests",
    required: true
  },
  {
    name: "Integration Tests", 
    path: "tests/integration",
    description: "CLI command integration tests",
    required: true
  },
  {
    name: "End-to-End Tests",
    path: "tests/e2e", 
    description: "Complete workflow tests",
    required: false // May fail without real auth tokens
  }
];

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log("🧪 XGPT CLI Test Suite");
    console.log("=" .repeat(50));
    console.log();

    this.startTime = Date.now();

    // Check prerequisites
    await this.checkPrerequisites();

    // Run each test suite
    for (const suite of TEST_SUITES) {
      await this.runTestSuite(suite);
    }

    // Generate report
    await this.generateReport();
  }

  private async checkPrerequisites(): Promise<void> {
    console.log("🔍 Checking prerequisites...");

    // Check if CLI builds successfully
    console.log("   Building CLI...");
    const buildResult = await this.runCommand(["bun", "build", "src/cli.ts", "--outdir", "./dist", "--target", "bun"]);
    
    if (buildResult.exitCode !== 0) {
      console.error("❌ Build failed!");
      console.error(buildResult.stderr);
      process.exit(1);
    }
    console.log("   ✅ Build successful");

    // Check if CLI runs
    console.log("   Testing CLI execution...");
    const cliResult = await this.runCommand(["bun", "run", "src/cli.ts", "--version"]);
    
    if (cliResult.exitCode !== 0) {
      console.error("❌ CLI execution failed!");
      console.error(cliResult.stderr);
      process.exit(1);
    }
    console.log("   ✅ CLI execution successful");

    // Check environment
    const hasAuthTokens = process.env.AUTH_TOKEN && process.env.CT0;
    const hasOpenAI = process.env.OPENAI_API_KEY;

    console.log(`   Auth tokens: ${hasAuthTokens ? '✅' : '⚠️  Missing (some tests may be skipped)'}`);
    console.log(`   OpenAI API key: ${hasOpenAI ? '✅' : '⚠️  Missing (embedding tests may be skipped)'}`);
    
    console.log();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🧪 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);

    if (!existsSync(suite.path)) {
      console.log(`   ⚠️  Test suite not found: ${suite.path}`);
      return;
    }

    const startTime = Date.now();
    const result = await this.runCommand(["bun", "test", suite.path]);
    const duration = Date.now() - startTime;

    const testResult: TestResult = {
      suite: suite.name,
      passed: this.extractPassedCount(result.stdout),
      failed: this.extractFailedCount(result.stdout),
      duration,
      output: result.stdout + result.stderr,
      success: result.exitCode === 0
    };

    this.results.push(testResult);

    if (testResult.success) {
      console.log(`   ✅ ${suite.name} passed (${testResult.passed} tests, ${duration}ms)`);
    } else {
      console.log(`   ❌ ${suite.name} failed (${testResult.failed} failures, ${duration}ms)`);
      if (suite.required) {
        console.log("   This is a required test suite!");
      }
    }

    console.log();
  }

  private async runCommand(cmd: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const proc = spawn({
      cmd,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return { stdout, stderr, exitCode };
  }

  private extractPassedCount(output: string): number {
    const match = output.match(/(\d+) pass/);
    return match ? parseInt(match[1]!) : 0;
  }

  private extractFailedCount(output: string): number {
    const match = output.match(/(\d+) fail/);
    return match ? parseInt(match[1]!) : 0;
  }

  private async generateReport(): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : "0";

    console.log("📊 TEST RESULTS SUMMARY");
    console.log("=" .repeat(50));
    console.log();

    // Individual suite results
    for (const result of this.results) {
      const status = result.success ? "✅ PASS" : "❌ FAIL";
      const rate = result.passed + result.failed > 0 
        ? (result.passed / (result.passed + result.failed) * 100).toFixed(1)
        : "0";
      
      console.log(`${status} ${result.suite}`);
      console.log(`     Tests: ${result.passed} passed, ${result.failed} failed (${rate}%)`);
      console.log(`     Duration: ${result.duration}ms`);
      console.log();
    }

    // Overall summary
    console.log("📈 OVERALL SUMMARY");
    console.log("-" .repeat(30));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log();

    // Determine overall result
    const requiredSuites = this.results.filter((_, i) => TEST_SUITES[i]!.required);
    const requiredPassed = requiredSuites.every(r => r.success);
    const allPassed = this.results.every(r => r.success);

    if (allPassed) {
      console.log("🎉 ALL TESTS PASSED!");
      console.log("   The XGPT CLI is working perfectly!");
    } else if (requiredPassed) {
      console.log("✅ CORE TESTS PASSED!");
      console.log("   The XGPT CLI core functionality is working.");
      console.log("   Some optional tests failed (likely due to missing auth tokens).");
    } else {
      console.log("❌ TESTS FAILED!");
      console.log("   Critical issues found in core functionality.");
    }

    console.log();

    // Generate detailed report file
    await this.generateDetailedReport();

    // Exit with appropriate code
    process.exit(requiredPassed ? 0 : 1);
  }

  private async generateDetailedReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed, 0),
        totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
        totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
        totalDuration: Date.now() - this.startTime,
        successRate: this.results.reduce((sum, r) => sum + r.passed, 0) / 
                    Math.max(1, this.results.reduce((sum, r) => sum + r.passed + r.failed, 0)) * 100
      },
      suites: this.results.map(r => ({
        name: r.suite,
        passed: r.passed,
        failed: r.failed,
        duration: r.duration,
        success: r.success
      })),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        hasAuthTokens: !!(process.env.AUTH_TOKEN && process.env.CT0),
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        isCI: process.env.CI === 'true'
      }
    };

    await writeFile("test-results.json", JSON.stringify(report, null, 2));
    console.log("📄 Detailed report saved to test-results.json");
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const runner = new TestRunner();
  await runner.runAllTests();
}
