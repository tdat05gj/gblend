import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletConnect from './components/WalletConnect';
import PublicChat from './components/PublicChat';
import PrivateChat from './components/PrivateChat';
import OnChainTransfer from './components/OnChainTransfer';
import Game2048 from './components/Game2048';
import MasterMind from './components/MasterMind';
import DiscordBinding from './components/DiscordBinding';
import FeedbackSystem from './components/FeedbackSystem';
import { KeyStorageService } from './utils/encryption';
import { Lock, Wallet, LogOut, Sun, Moon, Send, MessageSquare, Gamepad2, Brain, Link, Star } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './components/Game2048.css';

function App() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userKeys, setUserKeys] = useState(null);
  const [activeTab, setActiveTab] = useState('public');
  const [userInfo, setUserInfo] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showGamesDropdown, setShowGamesDropdown] = useState(false);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.games-dropdown')) {
        setShowGamesDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Load saved keys from local storage
    const savedKeys = KeyStorageService.getKeys();
    if (savedKeys) {
      setUserKeys(savedKeys);
    }
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
            <img 
              src="/Fluent logo.png" 
              alt="Fluent Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            Gblend
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
            <img 
              src="/Fluent logo.png" 
              alt="Fluent Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            Gblend
          </h1>
        </div>
        
        <div className="header-right">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button 
            onClick={() => setActiveTab('discord')} 
            className={`discord-button ${activeTab === 'discord' ? 'active' : ''}`}
            title="Discord Binding"
          >
            <Link size={16} />
            Discord
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
          onClick={() => navigate('/private-chat')}
        >
          <Lock size={18} />
          Private Chat
        </button>
        <button 
          className={`tab-button ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => navigate('/onchain-transfer')}
        >
          <Send size={18} />
          OnChain Transfer
        </button>
        <div className="games-dropdown">
          <button 
            className={`tab-button ${(activeTab === 'game2048' || activeTab === 'mastermind') ? 'active' : ''}`}
            onClick={() => setShowGamesDropdown(!showGamesDropdown)}
          >
            <Gamepad2 size={18} />
            Games
            <span className={`dropdown-arrow ${showGamesDropdown ? 'open' : ''}`}>▼</span>
          </button>
          {showGamesDropdown && (
            <div className="dropdown-menu">
              <button 
                className="dropdown-item"
                onClick={() => {
                  navigate('/2048game');
                  setShowGamesDropdown(false);
                }}
              >
                <Gamepad2 size={16} />
                2048 Game
              </button>
              <button 
                className="dropdown-item"
                onClick={() => {
                  navigate('/mastermind');
                  setShowGamesDropdown(false);
                }}
              >
                <Brain size={16} />
                Master Mind
              </button>
            </div>
          )}
        </div>
        <button 
          className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => navigate('/feedback')}
        >
          <Star size={18} />
          Feedback
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'public' ? (
          <PublicChat account={account} />
        ) : activeTab === 'discord' ? (
          <DiscordBinding account={account} />
        ) : (
          <PublicChat account={account} /> // Default fallback
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
