/**
 * Cryptography Utilities
 * Secure encryption, hashing, and crypto functions
 */

import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hash Algorithms
 */
export type HashAlgorithm = 'sha256' | 'sha512' | 'md5' | 'sha1';

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength?: number;
  iterations?: number;
  salt?: Buffer;
}

/**
 * Default encryption configurations
 */
export const ENCRYPTION_CONFIGS = {
  aes256: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },
  aes128: {
    algorithm: 'aes-128-gcm',
    keyLength: 16,
    ivLength: 16,
    tagLength: 16,
  },
  chacha20: {
    algorithm: 'chacha20-poly1305',
    keyLength: 32,
    ivLength: 12,
    tagLength: 16,
  },
} as const;

/**
 * Password hashing configuration
 */
export interface PasswordConfig {
  algorithm: 'scrypt' | 'bcrypt' | 'argon2';
  saltLength: number;
  keyLength: number;
  iterations?: number;
  memory?: number;
  parallelism?: number;
}

export const PASSWORD_CONFIGS = {
  scrypt: {
    algorithm: 'scrypt' as const,
    saltLength: 16,
    keyLength: 64,
    iterations: 32768,
  },
  bcrypt: {
    algorithm: 'bcrypt' as const,
    saltLength: 16,
    keyLength: 60,
    iterations: 12,
  },
  argon2: {
    algorithm: 'argon2' as const,
    saltLength: 16,
    keyLength: 32,
    iterations: 3,
    memory: 4096,
    parallelism: 1,
  },
} as const;

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Buffer {
  return randomBytes(length);
}

/**
 * Generate random string with specified length and character set
 */
export function generateRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  const bytes = generateRandomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  
  return result;
}

/**
 * Generate random UUID v4
 */
export function generateUUID(): string {
  const bytes = generateRandomBytes(16);
  
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Create hash from data
 */
export function createHashFromData(
  data: string | Buffer,
  algorithm: HashAlgorithm = 'sha256'
): string {
  return createHash(algorithm).update(data).digest('hex');
}

/**
 * Create HMAC from data
 */
export function createHmacFromData(
  data: string | Buffer,
  secret: string | Buffer,
  algorithm: HashAlgorithm = 'sha256'
): string {
  return createHmac(algorithm, secret).update(data).digest('hex');
}

/**
 * Verify HMAC
 */
export function verifyHmac(
  data: string | Buffer,
  secret: string | Buffer,
  signature: string,
  algorithm: HashAlgorithm = 'sha256'
): boolean {
  const expectedSignature = createHmacFromData(data, secret, algorithm);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Hash password securely using scrypt
 */
export async function hashPassword(
  password: string,
  config: PasswordConfig = PASSWORD_CONFIGS.scrypt
): Promise<string> {
  if (config.algorithm !== 'scrypt') {
    throw new Error('Only scrypt is implemented in this utility');
  }
  
  const salt = generateRandomBytes(config.saltLength);
  const derivedKey = await scryptAsync(
    password,
    salt,
    config.keyLength,
    { N: config.iterations }
  ) as Buffer;
  
  // Combine salt and hash for storage
  const combined = Buffer.concat([salt, derivedKey]);
  return `scrypt:${config.iterations}:${config.saltLength}:${config.keyLength}:${combined.toString('base64')}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const [algorithm, iterations, saltLength, keyLength, data] = hashedPassword.split(':');
    
    if (algorithm !== 'scrypt') {
      throw new Error('Unsupported algorithm');
    }
    
    const combined = Buffer.from(data, 'base64');
    const salt = combined.slice(0, parseInt(saltLength));
    const hash = combined.slice(parseInt(saltLength));
    
    const derivedKey = await scryptAsync(
      password,
      salt,
      parseInt(keyLength),
      { N: parseInt(iterations) }
    ) as Buffer;
    
    return timingSafeEqual(hash, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptData(
  data: string | Buffer,
  key: Buffer,
  config: EncryptionConfig = ENCRYPTION_CONFIGS.aes256
): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
  const crypto = require('crypto');
  const iv = generateRandomBytes(config.ivLength);
  const cipher = crypto.createCipher(config.algorithm, key, { iv });
  
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const tag = cipher.getAuthTag();
  
  return { encrypted, iv, tag };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(
  encrypted: Buffer,
  key: Buffer,
  iv: Buffer,
  tag: Buffer,
  config: EncryptionConfig = ENCRYPTION_CONFIGS.aes256
): Buffer {
  const crypto = require('crypto');
  const decipher = crypto.createDecipher(config.algorithm, key, { iv });
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
}

/**
 * Derive key from password using PBKDF2
 */
export function deriveKeyFromPassword(
  password: string,
  salt: Buffer,
  iterations: number = 100000,
  keyLength: number = 32,
  algorithm: string = 'sha256'
): Promise<Buffer> {
  const crypto = require('crypto');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, algorithm, (err: any, derivedKey: Buffer) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Create digital signature
 */
export function createSignature(
  data: string | Buffer,
  privateKey: string,
  algorithm: string = 'RSA-SHA256'
): string {
  const crypto = require('crypto');
  const sign = crypto.createSign(algorithm);
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

/**
 * Verify digital signature
 */
export function verifySignature(
  data: string | Buffer,
  signature: string,
  publicKey: string,
  algorithm: string = 'RSA-SHA256'
): boolean {
  try {
    const crypto = require('crypto');
    const verify = crypto.createVerify(algorithm);
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}

/**
 * Generate secure token
 */
export function generateSecureToken(length: number = 32): string {
  return generateRandomBytes(length).toString('base64url');
}

/**
 * Generate API key
 */
export function generateApiKey(prefix: string = 'ak'): string {
  const timestamp = Date.now().toString(36);
  const random = generateRandomString(16);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Constant-time string comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Hash data with SHA-256
 */
export function sha256(data: string | Buffer): string {
  return createHashFromData(data, 'sha256');
}

/**
 * Hash data with SHA-512
 */
export function sha512(data: string | Buffer): string {
  return createHashFromData(data, 'sha512');
}

/**
 * Generate hash-based message authentication code
 */
export function hmacSha256(data: string | Buffer, secret: string | Buffer): string {
  return createHmacFromData(data, secret, 'sha256');
}

/**
 * Secure random number generation
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;
  
  let randomInt;
  do {
    const randomBytes = generateRandomBytes(bytesNeeded);
    randomInt = randomBytes.readUIntBE(0, bytesNeeded);
  } while (randomInt > maxValid);
  
  return min + (randomInt % range);
}

/**
 * Time-based one-time password (TOTP) utilities
 */
export class TOTPGenerator {
  private static base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  
  static generateSecret(length: number = 20): string {
    const bytes = generateRandomBytes(length);
    let result = '';
    
    for (let i = 0; i < bytes.length; i++) {
      result += this.base32Chars[bytes[i] % 32];
    }
    
    return result;
  }
  
  static generateTOTP(secret: string, timestamp?: number): string {
    const time = Math.floor((timestamp || Date.now()) / 30000);
    const timeBuffer = Buffer.allocUnsafe(8);
    timeBuffer.writeBigUInt64BE(BigInt(time));
    
    const hmac = createHmac('sha1', this.base32Decode(secret));
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0x0f;
    const truncated = hash.readUInt32BE(offset) & 0x7fffffff;
    const otp = truncated % 1000000;
    
    return otp.toString().padStart(6, '0');
  }
  
  static verifyTOTP(secret: string, token: string, window: number = 1): boolean {
    const currentTime = Date.now();
    
    for (let i = -window; i <= window; i++) {
      const testTime = currentTime + (i * 30000);
      const expectedToken = this.generateTOTP(secret, testTime);
      
      if (constantTimeCompare(token, expectedToken)) {
        return true;
      }
    }
    
    return false;
  }
  
  private static base32Decode(encoded: string): Buffer {
    let bits = '';
    for (const char of encoded.toUpperCase()) {
      const val = this.base32Chars.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }
    
    return Buffer.from(bytes);
  }
}

/**
 * JWT-like token utilities (simplified)
 */
export class TokenGenerator {
  static encode(payload: any, secret: string, expiresIn?: number): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    
    const claims = {
      ...payload,
      iat: now,
      ...(expiresIn && { exp: now + expiresIn }),
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
    const encodedSignature = Buffer.from(signature, 'hex').toString('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }
  
  static decode(token: string, secret: string): any {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    
    // Verify signature
    const expectedSignature = hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
    const expectedEncodedSignature = Buffer.from(expectedSignature, 'hex').toString('base64url');
    
    if (!constantTimeCompare(encodedSignature, expectedEncodedSignature)) {
      throw new Error('Invalid token signature');
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  }
  
  static verify(token: string, secret: string): boolean {
    try {
      this.decode(token, secret);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Export commonly used functions
 */
export const crypto = {
  // Random generation
  generateRandomBytes,
  generateRandomString,
  generateUUID,
  generateSecureToken,
  generateApiKey,
  secureRandomInt,
  
  // Hashing
  sha256,
  sha512,
  createHashFromData,
  hmacSha256,
  createHmacFromData,
  verifyHmac,
  
  // Password handling
  hashPassword,
  verifyPassword,
  
  // Encryption
  encryptData,
  decryptData,
  deriveKeyFromPassword,
  
  // Signatures
  createSignature,
  verifySignature,
  
  // Utilities
  constantTimeCompare,
  
  // Classes
  TOTPGenerator,
  TokenGenerator,
};