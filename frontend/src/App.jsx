import React, { useState, useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import PublicChat from './components/PublicChat';
import PrivateChat from './components/PrivateChat';
import { KeyStorageService } from './utils/encryption';
import { testEncryption } from './utils/debug';
import { MessageSquare, Lock, Wallet, LogOut, Sun, Moon } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userKeys, setUserKeys] = useState(null);
  const [activeTab, setActiveTab] = useState('public');
  const [userInfo, setUserInfo] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Load saved keys from local storage
    const savedKeys = KeyStorageService.getKeys();
    if (savedKeys) {
      setUserKeys(savedKeys);
    }
    
    // Add debug function to window for testing
    window.testEncryption = testEncryption;
    console.log('Debug: testEncryption() function available in console');
  }, []);

  const handleWalletConnected = (walletAccount, registered) => {
    setAccount(walletAccount);
    setIsRegistered(registered);
    
    if (registered) {
      toast.success('Wallet connected successfully!');
    }
  };

  const handleUserRegistered = (walletAccount, nickname, keys) => {
    setAccount(walletAccount);
    setIsRegistered(true);
    setUserKeys(keys);
    setUserInfo({ nickname });
    toast.success('Registration successful! You can now start messaging.');
  };

  const disconnect = () => {
    setAccount(null);
    setIsRegistered(false);
    setUserKeys(null);
    setUserInfo(null);
    KeyStorageService.clearKeys();
    toast.info('Wallet disconnected');
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account || !isRegistered) {
    return (
      <div className="app" data-theme={theme}>
        <header className="app-header">
          <h1>
            <MessageSquare size={32} />
            Gblend DApp
          </h1>
          <p>Secure communication on Gblend Testnet</p>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </header>
        
        <main>
          <WalletConnect 
            onWalletConnected={handleWalletConnected}
            onUserRegistered={handleUserRegistered}
          />
        </main>
        
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    );
  }

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <div className="header-left">
          <h1>
            <MessageSquare size={32} />
            Gblend DApp
          </h1>
        </div>
        
        <div className="header-right">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="user-info">
            <Wallet size={16} />
            <span>{formatAddress(account)}</span>
            {userInfo && <span className="nickname">({userInfo.nickname})</span>}
          </div>
          <button onClick={disconnect} className="disconnect-button">
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveTab('public')}
        >
          <MessageSquare size={18} />
          Public Board
        </button>
        <button 
          className={`tab-button ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => setActiveTab('private')}
        >
          <Lock size={18} />
          Private Chat
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'public' ? (
          <PublicChat account={account} />
        ) : (
          <PrivateChat account={account} userKeys={userKeys} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built on <strong>Gblend Testnet</strong> • 
          <a 
            href="https://testnet.gblend.xyz/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Faucet
          </a> • 
          <a 
            href="https://testnet.fluentscan.xyz/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Explorer
          </a> • 
          <a 
            href="https://docs.fluent.xyz/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Docs
          </a>
        </p>
      </footer>

      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
