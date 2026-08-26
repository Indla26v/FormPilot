/**
 * StorageService - Centralized, SOLID Data Access Layer for Google Forms Auto-Filler
 * Follows Single Responsibility Principle (SRP) for persistence & multi-profile management.
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_PROFILE } from '../utils/constants.js';
import { SecurityGuardService } from './security/SecurityGuardService.js';
import { CryptoService } from './security/CryptoService.js';

export class StorageService {
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
   * Retrieve all saved profiles
   */
  static async getProfiles() {
    let profiles = await this.get(STORAGE_KEYS.PROFILES);
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      profiles = [DEFAULT_PROFILE];
      await this.set(STORAGE_KEYS.PROFILES, profiles);
      await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, DEFAULT_PROFILE.id);
    }
    return profiles;
  }

  /**
   * Retrieve active profile
   */
  static async getActiveProfile() {
    const profiles = await this.getProfiles();
    const activeId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    const active = profiles.find((p) => p.id === activeId) || profiles[0] || DEFAULT_PROFILE;
    return active;
  }

  /**
   * Set active profile by ID
   */
  static async setActiveProfileId(profileId) {
    await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
    return profileId;
  }

  /**
   * Create or update a profile
   */
  static async saveProfile(profileData) {
    const profiles = await this.getProfiles();
    const id = profileData.id || `profile_${Date.now()}`;
    const now = new Date().toISOString();

    const normalizedProfile = {
      ...profileData,
      id,
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
   * Delete a profile
   */
  static async deleteProfile(profileId) {
    const profiles = await this.getProfiles();
    if (profiles.length <= 1) {
      throw new Error('Cannot delete the last remaining profile.');
    }

    const filtered = profiles.filter((p) => p.id !== profileId);
    await this.set(STORAGE_KEYS.PROFILES, filtered);

    const activeId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    if (activeId === profileId) {
      await this.setActiveProfileId(filtered[0].id);
    }
    return filtered;
  }

  /**
   * Clone / Duplicate a profile
   */
  static async duplicateProfile(profileId) {
    const profiles = await this.getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) throw new Error('Profile not found.');

    const newId = `profile_${Date.now()}`;
    const newProfile = JSON.parse(JSON.stringify(target));
    newProfile.id = newId;
    newProfile.name = `${target.name} (Copy)`;
    newProfile.createdAt = new Date().toISOString();
    newProfile.updatedAt = new Date().toISOString();

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
   * Export all profiles, settings, RAG docs, and LLM config to JSON string
   * @param {object} options
   * @param {boolean} options.includeApiKeys Whether to include raw API keys (default: false for security)
   */
  static async exportBackup({ includeApiKeys = false } = {}) {
    const profiles = await this.getProfiles();
    const activeProfileId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    const settings = await this.getSettings();
    const ragDocs = (await this.get('gfaf_rag_documents')) || [];
    const ragChunks = (await this.get('gfaf_rag_chunks')) || [];
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
      profiles,
      settings,
      ragDocs,
      ragChunks,
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
      if (sanitized.activeProfileId) {
        await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, sanitized.activeProfileId);
      }
      if (sanitized.settings) {
        await this.set(STORAGE_KEYS.SETTINGS, sanitized.settings);
      }
      if (sanitized.ragDocs && sanitized.ragDocs.length > 0) {
        await this.set('gfaf_rag_documents', sanitized.ragDocs);
      }
      if (sanitized.ragChunks && sanitized.ragChunks.length > 0) {
        await this.set('gfaf_rag_chunks', sanitized.ragChunks);
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
