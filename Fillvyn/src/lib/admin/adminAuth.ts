/**
 * Admin Authentication Service (SRP)
 * Manages admin passkey verification and authorization tokens.
 */

const DEFAULT_ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || 'fillvyn2026';

export class AdminAuthService {
  private validPasskey = DEFAULT_ADMIN_PASSKEY;

  verifyPasskey(passkey: string): boolean {
    if (!passkey || typeof passkey !== 'string') return false;
    return passkey.trim() === this.validPasskey;
  }

  createSessionToken(passkey: string): string | null {
    if (!this.verifyPasskey(passkey)) return null;
    const expiry = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    const payload = `${this.validPasskey}:${expiry}`;
    return Buffer.from(payload).toString('base64');
  }

  verifySessionToken(token: string): boolean {
    if (!token) return false;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [passkey, expiryStr] = decoded.split(':');
      const expiry = Number(expiryStr);
      if (passkey !== this.validPasskey) return false;
      if (isNaN(expiry) || Date.now() > expiry) return false;
      return true;
    } catch {
      return false;
    }
  }
}

export const adminAuthService = new AdminAuthService();
