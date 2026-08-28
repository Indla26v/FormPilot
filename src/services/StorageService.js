/**
 * StorageService - Centralized, SOLID Data Access Layer for Google Forms Auto-Filler
 * Follows Single Responsibility Principle (SRP) for persistence & multi-profile management.
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_PROFILE, DEFAULT_COMMON_DATA } from '../utils/constants.js';
import { SecurityGuardService } from './security/SecurityGuardService.js';
import { CryptoService } from './security/CryptoService.js';

export class StorageService {
  static _cachedActiveProfile = null;
  static _cachedProfiles = null;
  static _cachedCommonData = null;
  static _cacheListenerAttached = false;

  /**
   * Initialize background storage change listener for memory cache invalidation
   */
  static _initCacheListener() {
    if (this._cacheListenerAttached) return;
    this._cacheListenerAttached = true;
    if (this.isExtensionEnv() && typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      try {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === 'local') {
            if (changes[STORAGE_KEYS.PROFILES] || changes[STORAGE_KEYS.ACTIVE_PROFILE_ID] || changes[STORAGE_KEYS.COMMON_DATA]) {
              this.clearCache();
            }
          }
        });
      } catch {}
    }
  }

  /**
   * Clear in-memory read cache
   */
  static clearCache() {
    this._cachedActiveProfile = null;
    this._cachedProfiles = null;
    this._cachedCommonData = null;
  }

  /**
   * Check if running in Chrome Extension environment
   */
  static isExtensionEnv() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  /**
   * Raw read from storage adapter
   */
  static async get(key) {
    if (this.isExtensionEnv()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result ? result[key] : undefined);
        });
      });
    } else if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(key);
      try {
        return data ? JSON.parse(data) : undefined;
      } catch {
        return data;
      }
    }
    return undefined;
  }

  /**
   * Raw write to storage adapter
   */
  static async set(key, value) {
    this.clearCache();
    if (this.isExtensionEnv()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve(true);
        });
      });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
    return false;
  }

  /**
   * Retrieve common candidate data (Personal, Education, Professional)
   * Shared across all profiles
   */
  static async getCommonData() {
    this._initCacheListener();
    if (this._cachedCommonData) return this._cachedCommonData;

    let common = await this.get(STORAGE_KEYS.COMMON_DATA);
    if (!common || typeof common !== 'object') {
      // If not stored yet, initialize from first profile or default
      const profiles = await this.get(STORAGE_KEYS.PROFILES);
      if (Array.isArray(profiles) && profiles.length > 0 && profiles[0].personal) {
        common = {
          personal: profiles[0].personal || DEFAULT_COMMON_DATA.personal,
          education: profiles[0].education || DEFAULT_COMMON_DATA.education,
          professional: profiles[0].professional || DEFAULT_COMMON_DATA.professional
        };
      } else {
        common = DEFAULT_COMMON_DATA;
      }
      await this.set(STORAGE_KEYS.COMMON_DATA, common);
    }
    this._cachedCommonData = common;
    return common;
  }

  /**
   * Save common candidate data and synchronize across all stored profiles
   */
  static async saveCommonData(commonData) {
    this.clearCache();
    const currentCommon = await this.getCommonData();
    const mergedCommon = {
      personal: { ...(currentCommon.personal || {}), ...(commonData.personal || {}) },
      education: { ...(currentCommon.education || {}), ...(commonData.education || {}) },
      professional: { ...(currentCommon.professional || {}), ...(commonData.professional || {}) }
    };

    await this.set(STORAGE_KEYS.COMMON_DATA, mergedCommon);

    // Synchronize common data across all profiles
    let profiles = (await this.get(STORAGE_KEYS.PROFILES)) || [];
    if (Array.isArray(profiles) && profiles.length > 0) {
      const updatedProfiles = profiles.map((p) => ({
        ...p,
        personal: mergedCommon.personal,
        education: mergedCommon.education,
        professional: mergedCommon.professional,
        updatedAt: new Date().toISOString()
      }));
      await this.set(STORAGE_KEYS.PROFILES, updatedProfiles);
    }

    this._cachedCommonData = mergedCommon;
    return mergedCommon;
  }

  /**
   * Retrieve all saved profiles (with common candidate data seamlessly merged)
   */
  static async getProfiles() {
    this._initCacheListener();
    if (this._cachedProfiles) return this._cachedProfiles;

    let profiles = await this.get(STORAGE_KEYS.PROFILES);
    const common = await this.getCommonData();

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      profiles = [{
        ...DEFAULT_PROFILE,
        personal: common.personal,
        education: common.education,
        professional: common.professional
      }];
      await this.set(STORAGE_KEYS.PROFILES, profiles);
      await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, DEFAULT_PROFILE.id);
      this._cachedProfiles = profiles;
      return profiles;
    }

    // Ensure common data is merged into each profile
    const synced = profiles.map((p) => ({
      ...p,
      personal: common.personal || p.personal,
      education: common.education || p.education,
      professional: common.professional || p.professional
    }));

    this._cachedProfiles = synced;
    return synced;
  }

  /**
   * Retrieve active profile (Read-Through Cache)
   */
  static async getActiveProfile() {
    this._initCacheListener();
    if (this._cachedActiveProfile) {
      return this._cachedActiveProfile;
    }
    const profiles = await this.getProfiles();
    const activeId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    const active = profiles.find((p) => p.id === activeId) || profiles[0] || DEFAULT_PROFILE;
    this._cachedActiveProfile = active;
    return active;
  }

  /**
   * Set active profile by ID
   */
  static async setActiveProfileId(profileId) {
    this.clearCache();
    await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
    return profileId;
  }

  /**
   * Create or update a profile
   * If common fields (personal, education, professional) are passed, they update global common data.
   */
  static async saveProfile(profileData) {
    this.clearCache();
    // 1. Sync common data if present in profileData
    if (profileData.personal || profileData.education || profileData.professional) {
      await this.saveCommonData({
        personal: profileData.personal,
        education: profileData.education,
        professional: profileData.professional
      });
    }

    const common = await this.getCommonData();
    const profiles = await this.getProfiles();
    const id = profileData.id || `profile_${Date.now()}`;
    const now = new Date().toISOString();

    const normalizedProfile = {
      ...profileData,
      id,
      personal: common.personal,
      education: common.education,
      professional: common.professional,
      updatedAt: now,
      createdAt: profileData.createdAt || now
    };

    const existingIndex = profiles.findIndex((p) => p.id === id);
    if (existingIndex >= 0) {
      profiles[existingIndex] = normalizedProfile;
    } else {
      profiles.push(normalizedProfile);
    }

    await this.set(STORAGE_KEYS.PROFILES, profiles);
    return normalizedProfile;
  }

  /**
   * Delete a profile and clean up its profile-specific knowledge base
   */
  static async deleteProfile(profileId) {
    const profiles = await this.getProfiles();
    if (profiles.length <= 1) {
      throw new Error('Cannot delete the last remaining profile.');
    }

    const filtered = profiles.filter((p) => p.id !== profileId);
    await this.set(STORAGE_KEYS.PROFILES, filtered);

    // Clean up profile-specific RAG knowledge base
    const docsKey = STORAGE_KEYS.getRagDocsKey(profileId);
    const chunksKey = STORAGE_KEYS.getRagChunksKey(profileId);
    await this.set(docsKey, []);
    await this.set(chunksKey, []);

    const activeId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    if (activeId === profileId) {
      await this.setActiveProfileId(filtered[0].id);
    }
    return filtered;
  }

  /**
   * Clone / Duplicate a profile (Copies role-specific skills/links/customFields, clones knowledge base, inherits common data)
   */
  static async duplicateProfile(profileId) {
    const profiles = await this.getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) throw new Error('Profile not found.');

    const common = await this.getCommonData();
    const newId = `profile_${Date.now()}`;
    const newProfile = JSON.parse(JSON.stringify(target));
    newProfile.id = newId;
    newProfile.name = `${target.name} (Copy)`;
    newProfile.personal = common.personal;
    newProfile.education = common.education;
    newProfile.professional = common.professional;
    newProfile.createdAt = new Date().toISOString();
    newProfile.updatedAt = new Date().toISOString();

    // Clone RAG knowledge base documents and chunks
    const targetDocsKey = STORAGE_KEYS.getRagDocsKey(profileId);
    const targetChunksKey = STORAGE_KEYS.getRagChunksKey(profileId);
    const newDocsKey = STORAGE_KEYS.getRagDocsKey(newId);
    const newChunksKey = STORAGE_KEYS.getRagChunksKey(newId);

    const targetDocs = (await this.get(targetDocsKey)) || (profileId === 'profile_default' ? (await this.get('gfaf_rag_documents')) : []) || [];
    const targetChunks = (await this.get(targetChunksKey)) || (profileId === 'profile_default' ? (await this.get('gfaf_rag_chunks')) : []) || [];

    if (Array.isArray(targetDocs) && targetDocs.length > 0) {
      const clonedDocs = targetDocs.map((d, i) => ({
        ...d,
        id: `doc_${Date.now()}_${i}`,
        profileId: newId
      }));
      const clonedChunks = (targetChunks || []).map((c, i) => ({
        ...c,
        id: `chunk_${Date.now()}_${i}`,
        profileId: newId
      }));
      await this.set(newDocsKey, clonedDocs);
      await this.set(newChunksKey, clonedChunks);
    }

    profiles.push(newProfile);
    await this.set(STORAGE_KEYS.PROFILES, profiles);
    return newProfile;
  }

  /**
   * Retrieve settings
   */
  static async getSettings() {
    const settings = await this.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(settings || {}) };
  }

  /**
   * Save user settings
   */
  static async saveSettings(newSettings) {
    const current = await this.getSettings();
    const merged = { ...current, ...newSettings };
    await this.set(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  /**
   * Export all profiles, settings, profile-scoped RAG docs, and LLM config to JSON string
   * @param {object} options
   * @param {boolean} options.includeApiKeys Whether to include raw API keys (default: false for security)
   */
  static async exportBackup({ includeApiKeys = false } = {}) {
    const profiles = await this.getProfiles();
    const commonData = await this.getCommonData();
    const activeProfileId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    const settings = await this.getSettings();
    
    // Export profile-scoped RAG knowledge bases
    const ragDocsByProfile = {};
    const ragChunksByProfile = {};
    for (const p of profiles) {
      const docsKey = STORAGE_KEYS.getRagDocsKey(p.id);
      const chunksKey = STORAGE_KEYS.getRagChunksKey(p.id);
      ragDocsByProfile[p.id] = (await this.get(docsKey)) || [];
      ragChunksByProfile[p.id] = (await this.get(chunksKey)) || [];
    }

    const ragDocs = (await this.get(STORAGE_KEYS.getRagDocsKey(activeProfileId))) || (await this.get('gfaf_rag_documents')) || [];
    const ragChunks = (await this.get(STORAGE_KEYS.getRagChunksKey(activeProfileId))) || (await this.get('gfaf_rag_chunks')) || [];
    let llmConfig = (await this.get('gfaf_llm_config')) || null;

    // Redact raw API keys by default to prevent accidental leakage in shared files
    if (llmConfig && !includeApiKeys) {
      llmConfig = { ...llmConfig };
      delete llmConfig.geminiApiKey;
      delete llmConfig.openaiApiKey;
      delete llmConfig.anthropicApiKey;
    }

    const exportObj = {
      app: 'GoogleFormsAutoFiller',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      activeProfileId,
      commonData,
      profiles,
      settings,
      ragDocs,
      ragChunks,
      ragDocsByProfile,
      ragChunksByProfile,
      llmConfig
    };

    return JSON.stringify(exportObj, null, 2);
  }

  /**
   * Export password-protected encrypted backup (.gfaf.enc)
   * @param {string} passphrase 
   * @param {object} options 
   * @returns {Promise<string>} Encrypted envelope JSON string
   */
  static async exportEncryptedBackup(passphrase, { includeApiKeys = true } = {}) {
    const rawBackupJson = await this.exportBackup({ includeApiKeys });
    return await CryptoService.encrypt(rawBackupJson, passphrase);
  }

  // Alias for backward compatibility
  static async exportAllDataAsJson() {
    return await this.exportBackup();
  }

  /**
   * Import data from JSON string with strict schema validation & prototype pollution defense
   */
  static async importBackup(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      
      if (!parsed) {
        throw new Error('Empty or invalid JSON file.');
      }

      // Validate and sanitize data against strict security schema
      const sanitized = SecurityGuardService.validateAndSanitizeBackup(parsed);

      await this.set(STORAGE_KEYS.PROFILES, sanitized.profiles);
      if (sanitized.commonData) {
        await this.saveCommonData(sanitized.commonData);
      } else if (sanitized.profiles && sanitized.profiles.length > 0) {
        await this.saveCommonData({
          personal: sanitized.profiles[0].personal,
          education: sanitized.profiles[0].education,
          professional: sanitized.profiles[0].professional
        });
      }
      if (sanitized.activeProfileId) {
        await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, sanitized.activeProfileId);
      }
      if (sanitized.settings) {
        await this.set(STORAGE_KEYS.SETTINGS, sanitized.settings);
      }

      // Restore profile-scoped RAG docs and chunks if provided
      if (sanitized.ragDocsByProfile && typeof sanitized.ragDocsByProfile === 'object') {
        for (const [pId, docs] of Object.entries(sanitized.ragDocsByProfile)) {
          if (Array.isArray(docs)) {
            await this.set(STORAGE_KEYS.getRagDocsKey(pId), docs);
          }
        }
      }
      if (sanitized.ragChunksByProfile && typeof sanitized.ragChunksByProfile === 'object') {
        for (const [pId, chunks] of Object.entries(sanitized.ragChunksByProfile)) {
          if (Array.isArray(chunks)) {
            await this.set(STORAGE_KEYS.getRagChunksKey(pId), chunks);
          }
        }
      }

      // Restore global/active profile RAG docs
      const activeId = sanitized.activeProfileId || (sanitized.profiles?.[0]?.id) || 'profile_default';
      if (sanitized.ragDocs && sanitized.ragDocs.length > 0) {
        await this.set('gfaf_rag_documents', sanitized.ragDocs);
        await this.set(STORAGE_KEYS.getRagDocsKey(activeId), sanitized.ragDocs);
      }
      if (sanitized.ragChunks && sanitized.ragChunks.length > 0) {
        await this.set('gfaf_rag_chunks', sanitized.ragChunks);
        await this.set(STORAGE_KEYS.getRagChunksKey(activeId), sanitized.ragChunks);
      }
      if (sanitized.llmConfig) {
        await this.set('gfaf_llm_config', sanitized.llmConfig);
      }
      return true;
    } catch (err) {
      console.error('[GFAF Security] Import validation failed:', err);
      throw new Error(`Failed to import data: ${err.message}`);
    }
  }

  /**
   * Decrypt and import password-protected encrypted backup (.gfaf.enc)
   * @param {string} encryptedStr 
   * @param {string} passphrase 
   * @returns {Promise<boolean>}
   */
  static async importEncryptedBackup(encryptedStr, passphrase) {
    const decryptedData = await CryptoService.decrypt(encryptedStr, passphrase);
    return await this.importBackup(decryptedData);
  }

  // Alias for backward compatibility
  static async importDataFromJson(jsonString) {
    return await this.importBackup(jsonString);
  }

  /**
   * Log history of form fill
   */
  static async recordHistory(historyEntry) {
    let history = (await this.get(STORAGE_KEYS.HISTORY)) || [];
    history.unshift({
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...historyEntry
    });
    // Keep max 50 entries
    if (history.length > 50) history = history.slice(0, 50);
    await this.set(STORAGE_KEYS.HISTORY, history);
  }
}
