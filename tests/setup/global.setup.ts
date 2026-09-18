/**
 * KATA Architecture - Global Setup (Project)
 *
 * Runs FIRST before all other projects.
 * Prepares the test environment: creates directories, validates config.
 *
 * Dependencies: None (this is the root)
 * Dependents: ui-setup, api-setup
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test as setup } from '@playwright/test';
import { env } from '@variables';

/**
 * Prepare test environment
 *
 * Creates required directories and validates environment configuration.
 */
setup('Global Setup: prepare environment', async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('KATA Architecture - Global Setup');
  console.log('='.repeat(60));
  console.log(`Environment: ${env.current}`);
  console.log(`CI Mode: ${env.isCI ? 'Yes' : 'No'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Ensure required directories exist
  const directories = [
    'test-results',
    'test-results/screenshots',
    'playwright-report',
    'allure-results',
    'reports',
    '.auth',
  ];

  for (const dir of directories) {
    const fullPath = join(process.cwd(), dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`[CREATED] ${dir}`);
    }
  }

  console.log('[OK] Global setup complete\n');
});
