/**
 * Automated test for Backup Export and Import in StorageService
 */

import { StorageService } from '../src/services/StorageService.js';
import { STORAGE_KEYS, DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('TESTING JSON BACKUP EXPORT & IMPORT');
console.log('----------------------------------------------------\n');

// Mock in-memory storage
const store = new Map();
StorageService.get = async (key) => store.get(key);
StorageService.set = async (key, val) => store.set(key, val);

// 1. Setup sample profiles
const testProfile1 = {
  ...DEFAULT_PROFILE,
  id: 'profile_dev_1',
  name: 'Senior AI Engineer',
  personal: { fullName: 'Alex Morgan', email: 'alex@example.com' },
  skills: ['Python', 'FastAPI', 'LangChain', 'PostgreSQL']
};

const testProfile2 = {
  ...DEFAULT_PROFILE,
  id: 'profile_dev_2',
  name: 'Java Backend SDE',
  personal: { fullName: 'Venkatesh Indla', email: 'venkatesh@example.com' },
  skills: ['Java', 'Spring Boot', 'MySQL', 'AWS']
};

await StorageService.set(STORAGE_KEYS.PROFILES, [testProfile1, testProfile2]);
await StorageService.setActiveProfileId('profile_dev_2');

// 2. Export Backup
const exportedJson = await StorageService.exportBackup();
console.log('Exported JSON Backup Output (length):', exportedJson.length);

const parsedExport = JSON.parse(exportedJson);
if (!parsedExport.profiles || parsedExport.profiles.length !== 2) {
  console.error('FAILED: Exported JSON does not contain 2 profiles, got:', parsedExport.profiles?.length);
  process.exit(1);
}
console.log('[PASS] Export contains 2 profiles and activeProfileId:', parsedExport.activeProfileId);

// 3. Clear store & test Import
store.clear();

const importSuccess = await StorageService.importBackup(exportedJson);
if (!importSuccess) {
  console.error('FAILED: Import returned false');
  process.exit(1);
}

const restoredProfiles = await StorageService.getProfiles();
const restoredActive = await StorageService.getActiveProfile();

console.log(`[PASS] Restored ${restoredProfiles.length} profiles from JSON backup.`);
console.log(`[PASS] Restored Active Profile: "${restoredActive.name}" (${restoredActive.personal.fullName})`);

if (restoredProfiles.length === 2 && restoredActive.id === 'profile_dev_2') {
  console.log('\n====================================================');
  console.log('SUCCESS: JSON EXPORT & IMPORT FULLY VERIFIED!');
  console.log('====================================================');
} else {
  console.error('FAILED: Restored data mismatch');
  process.exit(1);
}
