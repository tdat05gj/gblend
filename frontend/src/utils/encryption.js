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
    const secret = CryptoJS.SHA256(addresses.join('')).toString();
    

    
    return secret;
  }

  // Encrypt message using shared secret between sender and receiver
  static encryptMessage(message, senderAddress, receiverAddress) {
    try {
      // Validate input
      if (!message || !senderAddress || !receiverAddress) {
        throw new Error('Invalid encryption parameters');
      }
      
      // Ensure message is a clean string
      const cleanMessage = message.trim();
      if (cleanMessage.length === 0) {
        throw new Error('Empty message');
      }
      
      const sharedSecret = this.createSharedSecret(senderAddress, receiverAddress);
      const encrypted = CryptoJS.AES.encrypt(cleanMessage, sharedSecret).toString();
      
      // Validate encryption result
      if (!encrypted || encrypted.length === 0) {
        throw new Error('Encryption failed');
      }
      
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt message using shared secret between sender and receiver
  static decryptMessage(encryptedMessage, senderAddress, receiverAddress) {
    try {
      // Validate input
      if (!encryptedMessage || !senderAddress || !receiverAddress) {
        return '[Unable to decrypt message]';
      }

      const sharedSecret = this.createSharedSecret(senderAddress, receiverAddress);
      
      // Try to decrypt
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, sharedSecret);
      
      // Check if decryption was successful before converting to UTF-8
      if (!decrypted || decrypted.sigBytes <= 0) {
        return '[Unable to decrypt message]';
      }
      
      // Safely convert to UTF-8 with error handling
      let decryptedText;
      try {
        decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      } catch (utf8Error) {
        // If UTF-8 conversion fails, try with Latin1 encoding
        try {
          decryptedText = decrypted.toString(CryptoJS.enc.Latin1);
        } catch (latinError) {
          return '[Unable to decrypt message]';
        }
      }
      
      // Validate the result
      if (!decryptedText || decryptedText.length === 0) {
        return '[Unable to decrypt message]';
      }
      
      // Check for non-printable characters that might indicate corruption
      if (!/^[\x20-\x7E\s]*$/.test(decryptedText)) {
        return '[Unable to decrypt message]';
      }
      
      return decryptedText;
    } catch (error) {
      console.error('❌ Decryption error:', error);
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
