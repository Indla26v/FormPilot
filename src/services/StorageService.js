/**
 * StorageService - Centralized, SOLID Data Access Layer for Google Forms Auto-Filler
 * Follows Single Responsibility Principle (SRP) for persistence & multi-profile management.
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_PROFILE } from '../utils/constants.js';

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
   */
  static async exportBackup() {
    const profiles = await this.getProfiles();
    const activeProfileId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    const settings = await this.getSettings();
    const ragDocs = (await this.get('gfaf_rag_documents')) || [];
    const ragChunks = (await this.get('gfaf_rag_chunks')) || [];
    const llmConfig = (await this.get('gfaf_llm_config')) || null;

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

  // Alias for backward compatibility
  static async exportAllDataAsJson() {
    return await this.exportBackup();
  }

  /**
   * Import data from JSON string
   */
  static async importBackup(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      
      if (!parsed) {
        throw new Error('Empty or invalid JSON file.');
      }

      // Check if it's an array of profiles or full backup object
      if (Array.isArray(parsed)) {
        await this.set(STORAGE_KEYS.PROFILES, parsed);
        if (parsed.length > 0) {
          await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, parsed[0].id);
        }
        return true;
      }

      if (!parsed.profiles || !Array.isArray(parsed.profiles)) {
        throw new Error('Invalid backup file format: "profiles" array is missing.');
      }

      await this.set(STORAGE_KEYS.PROFILES, parsed.profiles);
      if (parsed.activeProfileId) {
        await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, parsed.activeProfileId);
      }
      if (parsed.settings) {
        await this.set(STORAGE_KEYS.SETTINGS, parsed.settings);
      }
      if (parsed.ragDocs && Array.isArray(parsed.ragDocs)) {
        await this.set('gfaf_rag_documents', parsed.ragDocs);
      }
      if (parsed.ragChunks && Array.isArray(parsed.ragChunks)) {
        await this.set('gfaf_rag_chunks', parsed.ragChunks);
      }
      if (parsed.llmConfig) {
        await this.set('gfaf_llm_config', parsed.llmConfig);
      }
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      throw new Error(`Failed to import data: ${err.message}`);
    }
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
