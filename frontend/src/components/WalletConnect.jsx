import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { web3Service } from '../utils/web3';
import { EncryptionService, KeyStorageService } from '../utils/encryption';
import { Wallet, UserPlus, AlertCircle } from 'lucide-react';

const WalletConnect = ({ onWalletConnected, onUserRegistered }) => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const account = accounts[0];
          setAccount(account);
          
          // Initialize web3 service if wallet is already connected
          try {
            web3Service.account = account;
            web3Service.provider = new ethers.providers.Web3Provider(window.ethereum);
            await web3Service.initializeContract();
            
            // Check if user is registered
            const registered = await web3Service.isUserRegistered(account);
            setIsRegistered(registered);
            
            onWalletConnected(account, registered);
          } catch (error) {
            console.error('Error initializing web3 on check connection:', error);
            // If initialization fails, user will need to connect manually
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      const account = await web3Service.connectWallet();
      setAccount(account);
      
      // Check if user is registered
      const registered = await web3Service.isUserRegistered(account);
      setIsRegistered(registered);
      
      onWalletConnected(account, registered);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const registerUser = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      // Generate or get existing keys
      let keys = KeyStorageService.getKeys();
      if (!keys) {
        keys = EncryptionService.generateKeyFromAddress(account);
        KeyStorageService.saveKeys(keys);
      }

      // Register user with public key
      await web3Service.registerUser(keys.publicKey, nickname.trim());
      
      setIsRegistered(true);
      onUserRegistered(account, nickname.trim(), keys);
    } catch (error) {
      setError(error.message || 'Failed to register user');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!account) {
    return (
      <div className="wallet-connect">
        <div className="connect-card">
          <h2>
            <Wallet size={24} />
            Connect Your Wallet
          </h2>
          <p>Connect your wallet to start using Gblend DApp</p>
          
          {error && (
            <div className="error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="connect-button"
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="wallet-connect">
        <div className="register-card">
          <h2>
            <UserPlus size={24} />
            Register Account
          </h2>
          <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <p>Please register to start messaging</p>
          
          <div className="form-group">
            <label htmlFor="nickname">Nickname:</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              maxLength={50}
            />
          </div>
          
          {error && (
            <div className="error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <button 
            onClick={registerUser} 
            disabled={isRegistering || !nickname.trim()}
            className="register-button"
          >
            {isRegistering ? 'Registering...' : 'Register'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default WalletConnect;
