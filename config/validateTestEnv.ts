/**
 * KATA Architecture - Test Environment Variables Validator
 *
 * Validates required runtime variables for the active test environment:
 * - Credentials: Only for current TEST_ENV (local or staging)
 *
 * Usage:
 *   - Importable: call validateTestEnvironment(vars) with pre-extracted env vars
 *   - Standalone: bun run config/validateTestEnv.ts
 */

/** Variables needed for validation (subset of all env vars) */
export interface EnvVarsToValidate {
  TEST_ENV: string
  LOCAL_USER_EMAIL?: string
  LOCAL_USER_PASSWORD?: string
  STAGING_USER_EMAIL?: string
  STAGING_USER_PASSWORD?: string
}

/**
 * Validates test environment variables.
 * Throws Error if validation fails (fail-fast).
 *
 * @param vars - Pre-extracted environment variables (avoids multiple process.env reads)
 */
export function validateTestEnvironment(vars: EnvVarsToValidate): void {
  const errors: string[] = [];

  // Validate credentials for CURRENT environment only
  if (vars.TEST_ENV === 'local') {
    if (!vars.LOCAL_USER_EMAIL) {
      errors.push('LOCAL_USER_EMAIL is required for TEST_ENV=local');
    }
    if (!vars.LOCAL_USER_PASSWORD) {
      errors.push('LOCAL_USER_PASSWORD is required for TEST_ENV=local');
    }
  }
  else if (vars.TEST_ENV === 'staging') {
    if (!vars.STAGING_USER_EMAIL) {
      errors.push('STAGING_USER_EMAIL is required for TEST_ENV=staging');
    }
    if (!vars.STAGING_USER_PASSWORD) {
      errors.push('STAGING_USER_PASSWORD is required for TEST_ENV=staging');
    }
  }
  else {
    errors.push(`Unknown TEST_ENV: ${vars.TEST_ENV}. Valid values: local, staging`);
  }

  if (errors.length > 0) {
    throw new Error(`Test environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

// Standalone execution: bun run config/validateTestEnv.ts
if (import.meta.main) {
  // Only standalone mode reads process.env directly
  const vars: EnvVarsToValidate = {
    TEST_ENV: process.env.TEST_ENV || 'local',
    LOCAL_USER_EMAIL: process.env.LOCAL_USER_EMAIL,
    LOCAL_USER_PASSWORD: process.env.LOCAL_USER_PASSWORD,
    STAGING_USER_EMAIL: process.env.STAGING_USER_EMAIL,
    STAGING_USER_PASSWORD: process.env.STAGING_USER_PASSWORD,
  };

  console.log('\nValidating test environment variables...');
  console.log(`  TEST_ENV: ${vars.TEST_ENV}`);

  try {
    validateTestEnvironment(vars);
    console.log('\n✅ Test environment validated successfully');
  }
  catch (error) {
    console.error('\n❌ Validation failed:');
    console.error((error as Error).message);
    process.exit(1);
  }
}
