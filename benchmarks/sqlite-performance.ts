#!/usr/bin/env bun

import { 
  optimizeDatabase, 
  getDatabaseMetrics, 
  runPerformanceBenchmarks, 
  monitorDatabaseSize 
} from '../src/database/optimization.js';
import { initializeDatabase } from '../src/database/connection.js';

// Benchmark configuration
interface BenchmarkConfig {
  runOptimization: boolean;
  generateReport: boolean;
  testDataSize: 'small' | 'medium' | 'large';
  iterations: number;
}

// Benchmark results
interface BenchmarkResults {
  timestamp: Date;
  config: BenchmarkConfig;
  beforeOptimization: {
    metrics: any;
    benchmarks: any;
    sizeInfo: any;
  };
  afterOptimization?: {
    metrics: any;
    benchmarks: any;
    sizeInfo: any;
  };
  improvements: {
    performanceGain: number;
    sizeReduction: number;
    recommendations: string[];
  };
}

/**
 * Run comprehensive SQLite performance benchmarks
 */
export async function runComprehensiveBenchmarks(config: Partial<BenchmarkConfig> = {}): Promise<BenchmarkResults> {
  const finalConfig: BenchmarkConfig = {
    runOptimization: true,
    generateReport: true,
    testDataSize: 'small',
    iterations: 3,
    ...config
  };

  console.log("🚀 Starting comprehensive SQLite performance benchmarks...");
  console.log(`📊 Configuration:`);
  console.log(`   • Run optimization: ${finalConfig.runOptimization}`);
  console.log(`   • Generate report: ${finalConfig.generateReport}`);
  console.log(`   • Test data size: ${finalConfig.testDataSize}`);
  console.log(`   • Iterations: ${finalConfig.iterations}`);
  console.log();

  const results: BenchmarkResults = {
    timestamp: new Date(),
    config: finalConfig,
    beforeOptimization: {
      metrics: null,
      benchmarks: null,
      sizeInfo: null
    },
    improvements: {
      performanceGain: 0,
      sizeReduction: 0,
      recommendations: []
    }
  };

  try {
    // Ensure database is initialized
    await initializeDatabase();

    // Step 1: Collect baseline metrics
    console.log("📊 Collecting baseline metrics...");
    results.beforeOptimization.metrics = await getDatabaseMetrics();
    results.beforeOptimization.benchmarks = await runPerformanceBenchmarks();
    results.beforeOptimization.sizeInfo = await monitorDatabaseSize();

    // Step 2: Run optimization if requested
    if (finalConfig.runOptimization) {
      console.log("\n⚡ Running database optimization...");
      await optimizeDatabase({
        enableIndexes: true,
        enableVacuum: true,
        enableAnalyze: true,
        enablePragmaOptimizations: true,
        logSlowQueries: true,
        slowQueryThreshold: 50
      });

      // Collect post-optimization metrics
      console.log("\n📊 Collecting post-optimization metrics...");
      results.afterOptimization = {
        metrics: await getDatabaseMetrics(),
        benchmarks: await runPerformanceBenchmarks(),
        sizeInfo: await monitorDatabaseSize()
      };

      // Calculate improvements
      const beforeScore = results.beforeOptimization.benchmarks.overallScore;
      const afterScore = results.afterOptimization.benchmarks.overallScore;
      results.improvements.performanceGain = ((afterScore - beforeScore) / beforeScore) * 100;

      const beforeSize = results.beforeOptimization.sizeInfo.sizeMB;
      const afterSize = results.afterOptimization.sizeInfo.sizeMB;
      results.improvements.sizeReduction = ((beforeSize - afterSize) / beforeSize) * 100;

      // Generate recommendations
      results.improvements.recommendations = generateRecommendations(results);
    }

    // Step 3: Generate report if requested
    if (finalConfig.generateReport) {
      await generatePerformanceReport(results);
    }

    console.log("\n✅ Comprehensive benchmarks completed!");
    return results;

  } catch (error) {
    console.error("❌ Benchmark failed:", error);
    throw error;
  }
}

/**
 * Generate performance recommendations based on benchmark results
 */
function generateRecommendations(results: BenchmarkResults): string[] {
  const recommendations: string[] = [];

  if (!results.afterOptimization) {
    recommendations.push("Run database optimization to improve performance");
    return recommendations;
  }

  const performanceGain = results.improvements.performanceGain;
  const sizeReduction = results.improvements.sizeReduction;

  // Performance recommendations
  if (performanceGain < 10) {
    recommendations.push("Consider adding more specific indexes for your query patterns");
  } else if (performanceGain > 50) {
    recommendations.push("Excellent performance improvement achieved!");
  }

  // Size recommendations
  if (sizeReduction < 5) {
    recommendations.push("Database size not significantly reduced - consider data archiving");
  } else if (sizeReduction > 20) {
    recommendations.push("Significant space savings achieved through optimization");
  }

  // Query-specific recommendations
  const slowQueries = results.afterOptimization.benchmarks.queryBenchmarks.filter(
    (q: any) => q.duration > 100
  );
  
  if (slowQueries.length > 0) {
    recommendations.push(`${slowQueries.length} queries still taking >100ms - consider further optimization`);
  }

  // Database size recommendations
  if (results.afterOptimization.sizeInfo.sizeMB > 500) {
    recommendations.push("Large database detected - consider implementing data partitioning");
  }

  return recommendations;
}

/**
 * Generate detailed performance report
 */
async function generatePerformanceReport(results: BenchmarkResults): Promise<void> {
  console.log("📝 Generating performance report...");

  const reportContent = `# SQLite Performance Benchmark Report

Generated: ${results.timestamp.toISOString()}

## Configuration
- Run Optimization: ${results.config.runOptimization}
- Test Data Size: ${results.config.testDataSize}
- Iterations: ${results.config.iterations}

## Baseline Performance (Before Optimization)

### Database Metrics
- Database Size: ${results.beforeOptimization.sizeInfo.sizeMB.toFixed(2)} MB
- Overall Performance Score: ${results.beforeOptimization.benchmarks.overallScore.toFixed(1)}/100

### Query Benchmarks
${results.beforeOptimization.benchmarks.queryBenchmarks.map((b: any) => 
  `- ${b.name}: ${b.duration}ms (${b.recordsPerSecond} records/sec)`
).join('\n')}

${results.afterOptimization ? `
## Optimized Performance (After Optimization)

### Database Metrics
- Database Size: ${results.afterOptimization.sizeInfo.sizeMB.toFixed(2)} MB
- Overall Performance Score: ${results.afterOptimization.benchmarks.overallScore.toFixed(1)}/100

### Query Benchmarks
${results.afterOptimization.benchmarks.queryBenchmarks.map((b: any) => 
  `- ${b.name}: ${b.duration}ms (${b.recordsPerSecond} records/sec)`
).join('\n')}

## Performance Improvements
- Performance Gain: ${results.improvements.performanceGain.toFixed(1)}%
- Size Reduction: ${results.improvements.sizeReduction.toFixed(1)}%

## Recommendations
${results.improvements.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

## Summary

${results.afterOptimization ? 
  `The database optimization ${results.improvements.performanceGain > 0 ? 'improved' : 'did not improve'} performance by ${Math.abs(results.improvements.performanceGain).toFixed(1)}% and ${results.improvements.sizeReduction > 0 ? 'reduced' : 'increased'} size by ${Math.abs(results.improvements.sizeReduction).toFixed(1)}%.` :
  'Baseline performance metrics collected. Run with optimization enabled to see improvements.'
}

---
*Report generated by X-GPT CLI Performance Benchmarking Tool*
`;

  // Save report to file
  const reportPath = `benchmarks/performance-report-${results.timestamp.toISOString().replace(/[:.]/g, '-')}.md`;
  await Bun.write(reportPath, reportContent);
  
  console.log(`📝 Performance report saved to: ${reportPath}`);
}

/**
 * CLI function to run benchmarks
 */
export async function runBenchmarkCLI(options: {
  optimize?: boolean;
  report?: boolean;
  size?: 'small' | 'medium' | 'large';
  iterations?: number;
} = {}): Promise<void> {
  try {
    const results = await runComprehensiveBenchmarks({
      runOptimization: options.optimize ?? true,
      generateReport: options.report ?? true,
      testDataSize: options.size ?? 'small',
      iterations: options.iterations ?? 3
    });

    console.log("\n🎉 Benchmark Summary:");
    console.log(`   • Performance Score: ${results.beforeOptimization.benchmarks.overallScore.toFixed(1)}/100`);
    
    if (results.afterOptimization) {
      console.log(`   • Optimized Score: ${results.afterOptimization.benchmarks.overallScore.toFixed(1)}/100`);
      console.log(`   • Performance Gain: ${results.improvements.performanceGain.toFixed(1)}%`);
      console.log(`   • Size Reduction: ${results.improvements.sizeReduction.toFixed(1)}%`);
    }

    if (results.improvements.recommendations.length > 0) {
      console.log("\n💡 Top Recommendations:");
      results.improvements.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

  } catch (error) {
    console.error("❌ Benchmark CLI failed:", error);
    process.exit(1);
  }
}

// Export types
export type { BenchmarkConfig, BenchmarkResults };
