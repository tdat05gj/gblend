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

  // Create shared secret from two addresses (deterministic for same pair)
  static createSharedSecret(address1, address2) {
    // Sort addresses to ensure same result regardless of order
    const addresses = [address1.toLowerCase(), address2.toLowerCase()].sort();
    return CryptoJS.SHA256(addresses.join('')).toString();
  }

  // Encrypt message using shared secret between sender and receiver
  static encryptMessage(message, senderAddress, receiverAddress) {
    try {
      const sharedSecret = this.createSharedSecret(senderAddress, receiverAddress);
      const encrypted = CryptoJS.AES.encrypt(message, sharedSecret).toString();
      
      console.log('Encrypting message between:', senderAddress.substring(0, 6), 'and', receiverAddress.substring(0, 6));
      console.log('Shared secret:', sharedSecret.substring(0, 10) + '...');
      
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt message using shared secret between sender and receiver
  static decryptMessage(encryptedMessage, senderAddress, receiverAddress) {
    try {
      const sharedSecret = this.createSharedSecret(senderAddress, receiverAddress);
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, sharedSecret);
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      console.log('Decrypting message between:', senderAddress.substring(0, 6), 'and', receiverAddress.substring(0, 6));
      console.log('Shared secret:', sharedSecret.substring(0, 10) + '...');
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
