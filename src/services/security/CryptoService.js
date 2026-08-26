/**
 * CryptoService - Web Crypto API (AES-GCM 256-bit + PBKDF2)
 * Provides client-side authenticated encryption, key derivation, and integrity verification.
 * Follows SOLID principles with zero external dependencies.
 */

export class CryptoService {
  /**
   * Derive an AES-GCM 256-bit CryptoKey from a user passphrase using PBKDF2
   * @param {string} passphrase 
   * @param {Uint8Array} salt 
   * @param {number} iterations 
   * @returns {Promise<CryptoKey>}
   */
  static async deriveKey(passphrase, salt, iterations = 100000) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt arbitrary data using AES-GCM 256-bit with PBKDF2
   * @param {string|object} data 
   * @param {string} passphrase 
   * @returns {Promise<string>} Base64-encoded encrypted envelope
   */
  static async encrypt(data, passphrase) {
    if (!passphrase || typeof passphrase !== 'string' || passphrase.length === 0) {
      throw new Error('A valid passphrase is required for encryption.');
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);

    const plainText = typeof data === 'string' ? data : JSON.stringify(data);
    const encoded = new TextEncoder().encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    );

    const envelope = {
      v: 1,
      alg: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256',
      iter: 100000,
      salt: this.bytesToBase64(salt),
      iv: this.bytesToBase64(iv),
      ciphertext: this.bytesToBase64(new Uint8Array(cipherBuffer))
    };

    return JSON.stringify(envelope);
  }

  /**
   * Decrypt envelope using passphrase
   * @param {string} envelopeJson 
   * @param {string} passphrase 
   * @returns {Promise<any>}
   */
  static async decrypt(envelopeJson, passphrase) {
    if (!passphrase) {
      throw new Error('A passphrase is required for decryption.');
    }

    let envelope;
    try {
      envelope = typeof envelopeJson === 'string' ? JSON.parse(envelopeJson) : envelopeJson;
    } catch {
      throw new Error('Invalid encrypted envelope format.');
    }

    if (!envelope.salt || !envelope.iv || !envelope.ciphertext) {
      throw new Error('Corrupted or incomplete encrypted payload.');
    }

    const salt = this.base64ToBytes(envelope.salt);
    const iv = this.base64ToBytes(envelope.iv);
    const ciphertext = this.base64ToBytes(envelope.ciphertext);
    const iter = envelope.iter || 100000;

    const key = await this.deriveKey(passphrase, salt, iter);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      const decoded = new TextDecoder().decode(decryptedBuffer);
      try {
        return JSON.parse(decoded);
      } catch {
        return decoded;
      }
    } catch {
      throw new Error('Decryption failed. Incorrect passphrase or tampered file.');
    }
  }

  /**
   * SHA-256 Hash of a string
   * @param {string} text 
   * @returns {Promise<string>} Hex string
   */
  static async sha256(text) {
    const encoded = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Safely mask sensitive API key for UI display (e.g. sk-proj-1234567890 -> sk-proj-...7890)
   * @param {string} key 
   * @returns {string}
   */
  static maskKey(key) {
    if (!key || typeof key !== 'string') return '';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '••••••••';
    const prefix = trimmed.slice(0, 4);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }

  static bytesToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
