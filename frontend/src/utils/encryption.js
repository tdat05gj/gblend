import CryptoJS from 'crypto-js';

// Simple encryption utilities for demo purposes
// In production, use proper public-key cryptography libraries

export class EncryptionService {
  // Generate a simple key pair (for demo - use proper cryptography in production)
  static generateKeyPair() {
    const privateKey = CryptoJS.lib.WordArray.random(256/8).toString();
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    return {
      privateKey,
      publicKey
    };
  }

  // Encrypt message with receiver's public key (simplified version)
  static encryptMessage(message, receiverPublicKey) {
    try {
      // Use receiver's public key as encryption key
      const encrypted = CryptoJS.AES.encrypt(message, receiverPublicKey).toString();
      console.log('Encrypting with key:', receiverPublicKey.substring(0, 10) + '...');
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt message - use the same key that was used for encryption
  static decryptMessage(encryptedMessage, decryptionKey) {
    try {
      // For our simple symmetric encryption, use the same key for decryption
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, decryptionKey);
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      console.log('Decrypting with key:', decryptionKey.substring(0, 10) + '...');
      console.log('Decryption result length:', decryptedText.length);
      
      if (!decryptedText || decryptedText.length === 0) {
        return '[Unable to decrypt message]';
      }
      
      return decryptedText;
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Unable to decrypt message]';
    }
  }

  // Generate deterministic key from wallet address (for demo)
  static generateKeyFromAddress(address) {
    const hash = CryptoJS.SHA256(address.toLowerCase()).toString();
    return {
      privateKey: hash,
      publicKey: CryptoJS.SHA256(hash).toString()
    };
  }
}

// Local storage service for user keys
export class KeyStorageService {
  static STORAGE_KEY = 'gblend_keys';

  static saveKeys(keys) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }

  static getKeys() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static clearKeys() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
