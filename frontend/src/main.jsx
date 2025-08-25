import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import App from './App.jsx'
import Game2048 from './components/Game2048.jsx'
import FeedbackSystem from './components/FeedbackSystem.jsx'
import MasterMind from './components/MasterMind.jsx'
import DiscordBinding from './components/DiscordBinding.jsx'
import OnChainTransfer from './components/OnChainTransfer.jsx'
import PrivateChat from './components/PrivateChat.jsx'
import WalletConnect from './components/WalletConnect.jsx'
import { KeyStorageService } from './utils/encryption'
import { MessageSquare, Lock, Send, Gamepad2, Brain, Star, Link as LinkIcon, Wallet, LogOut, Sun, Moon } from 'lucide-react'
import './index.css'
import './App.css'

// Standalone pages with wallet connection
const StandalonePage = ({ children, title }) => {
  const navigate = useNavigate();
  const [account, setAccount] = React.useState(null);
  const [userKeys, setUserKeys] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState(title.toLowerCase().replace(' ', ''));
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');
  const [showGamesDropdown, setShowGamesDropdown] = React.useState(false);

  React.useEffect(() => {
    // Apply theme to document  
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    // Load saved keys from local storage
    const savedKeys = KeyStorageService.getKeys();
    if (savedKeys) {
      setUserKeys(savedKeys);
    }
  }, []);

  React.useEffect(() => {
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

  const handleWalletConnected = (walletAccount, isRegistered) => {
    setAccount(walletAccount);
  };

  const handleUserRegistered = (walletAccount, nickname, keys) => {
    setAccount(walletAccount);
    setUserKeys(keys);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const disconnect = () => {
    setAccount(null);
    setUserKeys(null);
    KeyStorageService.clearKeys();
  };

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
            onClick={() => navigate('/discord')}
            className="discord-button"
            title="Discord Binding"
          >
            <LinkIcon size={16} />
            Discord
          </button>
          {account && (
            <>
              <div className="user-info">
                <Wallet size={16} />
                <span>{formatAddress(account)}</span>
              </div>
              <button onClick={disconnect} className="disconnect-button">
                <LogOut size={16} />
                Disconnect
              </button>
            </>
          )}
        </div>
      </header>

      <nav className="tab-navigation">
        <Link 
          className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
          to="/"
        >
          <MessageSquare size={18} />
          Public Board
        </Link>
        <Link 
          className={`tab-button ${activeTab === 'private' ? 'active' : ''}`}
          to="/private-chat"
        >
          <Lock size={18} />
          Private Chat
        </Link>
        <Link 
          className={`tab-button ${activeTab === 'transfer' ? 'active' : ''}`}
          to="/onchain-transfer"
        >
          <Send size={18} />
          OnChain Transfer
        </Link>
        <div className="games-dropdown">
          <button 
            className={`tab-button ${(activeTab === '2048game' || activeTab === 'mastermind') ? 'active' : ''}`}
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
        {!account ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h2 style={{ color: 'var(--text-primary)' }}>Connect Wallet to Continue</h2>
            <WalletConnect 
              onWalletConnected={handleWalletConnected}
              onUserRegistered={handleUserRegistered} 
            />
          </div>
        ) : (
          React.cloneElement(children, { 
            account, 
            userKeys: title === 'Private Chat' ? userKeys : undefined 
          })
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
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Main app route */}
        <Route path="/" element={<App />} />
        
        {/* Standalone pages */}
        <Route 
          path="/2048game" 
          element={
            <StandalonePage title="2048 Game">
              <Game2048 />
            </StandalonePage>
          } 
        />
        <Route 
          path="/feedback" 
          element={
            <StandalonePage title="Feedback System">
              <FeedbackSystem />
            </StandalonePage>
          } 
        />
        <Route 
          path="/mastermind" 
          element={
            <StandalonePage title="Master Mind Game">
              <MasterMind />
            </StandalonePage>
          } 
        />
        <Route 
          path="/onchain-transfer" 
          element={
            <StandalonePage title="OnChain Transfer">
              <OnChainTransfer />
            </StandalonePage>
          } 
        />
        <Route 
          path="/private-chat" 
          element={
            <StandalonePage title="Private Chat">
              <PrivateChat />
            </StandalonePage>
          } 
        />
        <Route 
          path="/discord" 
          element={
            <StandalonePage title="Discord Binding">
              <DiscordBinding />
            </StandalonePage>
          } 
        />
        
        {/* Catch all route - redirect to main app */}
        <Route path="*" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)
