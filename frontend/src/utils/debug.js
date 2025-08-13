// Debug utility to test encryption/decryption
import { EncryptionService } from './encryption.js';

// Test function to verify encryption works
export const testEncryption = () => {
  console.log('=== Testing Encryption ===');
  
  // Simulate two users
  const user1Keys = {
    privateKey: 'user1_private_key_demo',
    publicKey: 'user1_public_key_demo'
  };
  
  const user2Keys = {
    privateKey: 'user2_private_key_demo', 
    publicKey: 'user2_public_key_demo'
  };
  
  const testMessage = 'Hello, this is a test message!';
  
  console.log('Original message:', testMessage);
  console.log('User1 public key:', user1Keys.publicKey);
  console.log('User2 public key:', user2Keys.publicKey);
  
  try {
    // User1 sends message to User2
    // Encrypt with User2's public key
    const encrypted = EncryptionService.encryptMessage(testMessage, user2Keys.publicKey);
    console.log('Encrypted message:', encrypted);
    
    // User2 receives message and decrypts with their own public key
    const decrypted = EncryptionService.decryptMessage(encrypted, user2Keys.privateKey, user2Keys.publicKey);
    console.log('Decrypted message:', decrypted);
    
    console.log('SUCCESS:', decrypted === testMessage);
    
    // Test reverse direction  
    console.log('\n=== Testing Reverse Direction ===');
    const encrypted2 = EncryptionService.encryptMessage(testMessage, user1Keys.publicKey);
    const decrypted2 = EncryptionService.decryptMessage(encrypted2, user1Keys.privateKey, user1Keys.publicKey);
    console.log('Reverse test SUCCESS:', decrypted2 === testMessage);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  window.testEncryption = testEncryption;
}
