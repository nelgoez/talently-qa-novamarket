/**
 * KATA Architecture - Global Teardown (Project)
 *
 * Runs LAST after all test projects complete.
 * Prints the ATC coverage summary.
 *
 * Dependencies: e2e, integration (runs after all tests)
 * Dependents: None (this is the final step)
 */

import { existsSync, readFileSync } from 'node:fs';

import { test as teardown } from '@playwright/test';
import { ATC_PARTIAL_PATH } from '@utils/decorators';

/**
 * Global Teardown: report ATC coverage
 *
 * Summarises the ATC executions of this run from the NDJSON partial file.
 */
teardown('Global Teardown: report ATC coverage', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('KATA Architecture - Global Teardown');
  console.log('='.repeat(60));

  // Read NDJSON directly (KataReporter.onEnd() hasn't fired yet)
  if (existsSync(ATC_PARTIAL_PATH)) {
    try {
      const lines = readFileSync(ATC_PARTIAL_PATH, 'utf-8').split('\n').filter(Boolean);
      const grouped: Record<string, { hasFail: boolean, allSkip: boolean, count: number }> = {};

      for (const line of lines) {
        const entry = JSON.parse(line) as { testId: string, status: string };
        if (!grouped[entry.testId]) {
          grouped[entry.testId] = { hasFail: false, allSkip: true, count: 0 };
        }
        grouped[entry.testId].count++;
        if (entry.status === 'FAIL') {
          grouped[entry.testId].hasFail = true;
        }
        if (entry.status !== 'SKIP') {
          grouped[entry.testId].allSkip = false;
        }
      }

      let passed = 0;
      let failed = 0;
      let skipped = 0;
      let executions = 0;

      for (const g of Object.values(grouped)) {
        executions += g.count;
        if (g.hasFail) {
          failed++;
        }
        else if (g.allSkip) {
          skipped++;
        }
        else {
          passed++;
        }
      }

      const total = Object.keys(grouped).length;

      console.log('\nATC Coverage:');
      console.log(`   ${total} unique ATC tracked (${executions} total executions)`);
      console.log(`   ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️ Skipped: ${skipped}`);
    }
    catch (error) {
      console.warn('[WARN] Could not read ATC partial results:', error);
    }
  }
  else {
    console.log('\n[INFO] No ATC results found (no @atc decorators executed)');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('[OK] Global teardown complete');
  console.log(`${'='.repeat(60)}\n`);
});
