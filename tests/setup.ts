// Global test setup
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

// Global test configuration
export const TEST_TIMEOUT = 30000 // 30 seconds
export const INTEGRATION_TEST_TIMEOUT = 300000 // 5 minutes

// Test directories
export const TEST_TMP_DIR = path.join(os.tmpdir(), 'create-poly-app-tests')
export const TEST_FIXTURES_DIR = path.join(__dirname, 'fixtures')
export const TEST_SNAPSHOTS_DIR = path.join(__dirname, 'snapshots')

// Global cleanup function
export async function cleanup(): Promise<void> {
  try {
    await fs.rm(TEST_TMP_DIR, { recursive: true, force: true })
  } catch (error) {
    console.warn('Failed to cleanup test directory:', error)
  }
}
