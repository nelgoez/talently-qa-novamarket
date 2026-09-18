/**
 * KATA Architecture - Environment Variables Configuration
 *
 * SINGLE SOURCE OF TRUTH for all environment variables.
 * This is the ONLY file that should read process.env.
 *
 * Bun automatically loads .env files - no dotenv dependency needed.
 * But the Playwright VSCode extension requires reading process.env as Node.js, so we use loadEnvFile()
 *
 * Usage:
 *   import { config, env } from '@variables';
 */

// Load .env file into process.env (Playwright VSCode extension needs it)
// In CI, env vars come from GitHub Secrets, so .env doesn't exist - hence try/catch
try {
  process.loadEnvFile();
}
catch {
  // .env file doesn't exist (expected in CI environments)
}
// ============================================
// Environment Type Definitions
// ============================================

export type Environment = 'local' | 'staging'; // Add more when needed (e.g., 'production')

// ============================================
// Destructure Environment Variables (Single Access)
// ============================================

const {
  // === Environment Detection ===
  TEST_ENV = 'local', // Used: env.current, selects URLs and credentials
  CI, // Used: env.isCI (global.setup, KataReporter)
  BUILD_ID, // Used: env.buildId

  // === Test User Credentials (only current TEST_ENV required) ===
  LOCAL_USER_EMAIL, // Required if TEST_ENV=local
  LOCAL_USER_PASSWORD, // Required if TEST_ENV=local
  STAGING_USER_EMAIL, // Required if TEST_ENV=staging
  STAGING_USER_PASSWORD, // Required if TEST_ENV=staging

  // === TMS Configuration ===
  // `none` in this project: QA tracks tests in Trello cards/checklists + a
  // Google Drive matrix (see docs/qa-standard/traceability-trello-drive.md).
  TMS_PROVIDER = 'none', // Used: config.tms.provider

  // === Browser Configuration ===
  HEADLESS = 'true', // Used: config.browser.headless (playwright.config)
  DEFAULT_TIMEOUT = '30000', // Used: config.browser.defaultTimeout (playwright.config, ApiBase)

  // === Reporting Configuration ===
  ALLURE_RESULTS_DIR = './allure-results', // Used: config.reporting.allureResultsDir (playwright.config)
  SCREENSHOT_ON_FAILURE = 'true', // Used: config.reporting.screenshotOnFailure (playwright.config)
  VIDEO_ON_FAILURE = 'true', // Used: config.reporting.videoOnFailure (playwright.config, CI only)
} = process.env;

// ============================================
// Environment Detection
// ============================================

export const env = {
  current: TEST_ENV as Environment,
  isLocal: TEST_ENV === 'local' || TEST_ENV === undefined,
  isStaging: TEST_ENV === 'staging',
  isCI: CI === 'true',
  buildId: BUILD_ID ?? 'local',
} as const;

// ============================================
// Test-User Credentials Mapping (variables from .env)
// After validation, current environment credentials are guaranteed to exist
// ============================================

const userCredentialsMap: Record<Environment, { email: string, password: string }> = {
  local: {
    email: LOCAL_USER_EMAIL ?? '',
    password: LOCAL_USER_PASSWORD ?? '',
  },
  staging: {
    email: STAGING_USER_EMAIL ?? '',
    password: STAGING_USER_PASSWORD ?? '',
  },
};

// ============================================
// ENV DATA Mapping (hardcoded - not secrets because these are not sensitive data like credentials)
// ============================================

const envDataMap: Record<
  Environment,
  { base: string, api: string, user: { email: string, password: string } }
> = {
  local: {
    base: 'http://localhost:3000',
    api: 'http://localhost:3000/api',
    user: userCredentialsMap.local,
  },
  staging: {
    base: 'https://dojo.upexgalaxy.com',
    api: 'https://dojo.upexgalaxy.com/api',
    user: userCredentialsMap.staging,
  },
};
const envData = envDataMap[env.current];

// ============================================
// Main Configuration Object
// ============================================

export const config = {
  // URLs - selected by TEST_ENV from urlMap
  baseUrl: envData.base,
  apiUrl: envData.api,

  // Authentication config (UPEX Dojo endpoints - relative to apiUrl)
  auth: {
    loginEndpoint: '/auth/login',
    tokenEndpoint: '/auth/login', // Endpoint to intercept for token (used by page.waitForResponse)
    meEndpoint: '/auth/me',
    tokenLifetimeSeconds: 86400, // 24 hours (1 day)
    // Storage paths for authenticated sessions
    storageStatePath: '.auth/user.json',
    apiStatePath: '.auth/api-state.json',
  },

  // Test User (configure in .env)
  testUser: envData.user,

  // TMS — none in this project (Trello + Drive matrix)
  tms: {
    provider: TMS_PROVIDER as 'xray' | 'jira' | 'none',
  },

  // Browser
  browser: {
    headless: HEADLESS !== 'false',
    defaultTimeout: Number.parseInt(DEFAULT_TIMEOUT, 10),
  },

  // Reporting
  reporting: {
    allureResultsDir: ALLURE_RESULTS_DIR,
    screenshotOnFailure: SCREENSHOT_ON_FAILURE !== 'false',
    videoOnFailure: VIDEO_ON_FAILURE !== 'false',
  },
} as const;
