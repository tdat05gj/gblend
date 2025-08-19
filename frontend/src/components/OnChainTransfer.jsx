import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Send, ArrowUpRight, ArrowDownLeft, Clock, User, DollarSign, MessageCircle } from 'lucide-react';
import './OnChainTransfer.css';

const OnChainTransfer = ({ account }) => {
  const [contract, setContract] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [userTransfers, setUserTransfers] = useState({ sent: [], received: [] });
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('send');
  const [gasEstimate, setGasEstimate] = useState(null);
  
  // Form states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Contract configuration
  // Contract address on Gblend Testnet - OPTIMIZED VERSION
const CONTRACT_ADDRESS = '0xc06f6f920532166BA0DF160eE679e7BC2677F0e7';
  const CONTRACT_ABI = [
    "function sendETHWithMessage(address payable _to, string calldata _message) external payable",
    "function getTransfer(uint256 _transferId) external view returns (tuple(address from, address to, uint256 amount, string message, uint256 timestamp, uint256 transferId))",
    "function getUserSentTransfers(address _user) external view returns (uint256[] memory)",
    "function getUserReceivedTransfers(address _user) external view returns (uint256[] memory)",
    "function getRecentTransfers(uint256 _limit) external view returns (tuple(address from, address to, uint256 amount, string message, uint256 timestamp, uint256 transferId)[] memory)",
    "function getTransfersByUser(address _user, uint256 _offset, uint256 _limit) external view returns (tuple(address from, address to, uint256 amount, string message, uint256 timestamp, uint256 transferId)[] memory sent, tuple(address from, address to, uint256 amount, string message, uint256 timestamp, uint256 transferId)[] memory received)",
    "function getStats() external view returns (uint256 totalTransfers, uint256 volume, uint256 fees, uint256 averageTransfer)",
    "function getUserTransferCount(address _user) external view returns (uint256 sent, uint256 received)",
    "function hasTransfers(address _user) external view returns (bool)",
    "event TransferWithMessage(uint256 indexed transferId, address indexed from, address indexed to, uint256 amount, string message, uint256 timestamp)"
  ];

  useEffect(() => {
    if (account && CONTRACT_ADDRESS) {
      initializeContract();
    }
  }, [account]);

  const initializeContract = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const transferContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        setContract(transferContract);
        loadData(transferContract);
        setupEventListeners(transferContract);
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };

  const loadData = async (transferContract) => {
    try {
      // Load recent transfers
      const recentTransfers = await transferContract.getRecentTransfers(20);
      setTransfers(recentTransfers);

      // Load user transfers
      const [sent, received] = await transferContract.getTransfersByUser(account, 0, 50);
      setUserTransfers({ sent, received });

      // Load stats
      const stats = await transferContract.getStats();
      setStats({
        totalTransfers: stats.totalTransfers.toNumber(),
        volume: ethers.utils.formatEther(stats.volume),
        fees: ethers.utils.formatEther(stats.fees),
        averageTransfer: ethers.utils.formatEther(stats.averageTransfer)
      });

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const setupEventListeners = (transferContract) => {
    transferContract.on('TransferWithMessage', (transferId, from, to, amount, message, timestamp) => {

      // Reload data after new transfer
      loadData(transferContract);
    });
  };

  // Estimate gas when form is filled
  useEffect(() => {
    if (contract && recipient && amount && message && ethers.utils.isAddress(recipient)) {
      estimateGas();
    } else {
      setGasEstimate(null);
    }
  }, [contract, recipient, amount, message]);

  const estimateGas = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const gasPrice = await provider.getGasPrice();
      
      const estimatedGas = await contract.estimateGas.sendETHWithMessage(
        recipient,
        message,
        { value: ethers.utils.parseEther(amount) }
      );
      
      const gasCost = estimatedGas.mul(gasPrice);
      
      setGasEstimate({
        gasLimit: estimatedGas.toString(),
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        gasCost: ethers.utils.formatEther(gasCost)
      });
    } catch (error) {
      console.error('Gas estimation failed:', error);
      setGasEstimate(null);
    }
  };

  const sendTransfer = async () => {
    if (!contract || !recipient || !amount || !message) {
      alert('Please fill all fields');
      return;
    }

    if (!ethers.utils.isAddress(recipient)) {
      alert('Invalid recipient address');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current gas price
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const gasPrice = await provider.getGasPrice();
      
      // Estimate gas limit
      const estimatedGas = await contract.estimateGas.sendETHWithMessage(
        recipient,
        message,
        { value: ethers.utils.parseEther(amount) }
      );
      
      // Add 10% buffer to gas limit
      const gasLimit = estimatedGas.mul(110).div(100);
      
      // Use standard gas price (not fast) to save costs
      const optimizedGasPrice = gasPrice.mul(90).div(100); // 10% lower than standard
      

      
      const tx = await contract.sendETHWithMessage(
        recipient,
        message,
        { 
          value: ethers.utils.parseEther(amount),
          gasLimit: gasLimit,
          gasPrice: optimizedGasPrice
        }
      );
      

      await tx.wait();
      
      alert('Transfer sent successfully!');
      
      // Clear form
      setRecipient('');
      setAmount('');
      setMessage('');
      
      // Reload data
      loadData(contract);
      
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const renderSendForm = () => (
    <div className="send-form">
      <h3><Send size={20} /> Send ETH with Message</h3>
      
      <div className="form-group">
        <label>Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="address-input"
        />
      </div>
      
      <div className="form-group">
        <label>Amount (ETH)</label>
        <input
          type="number"
          step="0.0001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.001"
          className="amount-input"
        />
        <small>Fee: 0.05% (min 0.00005 ETH) - Gas Optimized!</small>
      </div>
      
      <div className="form-group">
        <label>Message (max 280 characters)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your on-chain message..."
          maxLength={280}
          rows={3}
          className="message-input"
        />
        <small>{message.length}/280 characters</small>
      </div>
      
      {gasEstimate && (
        <div className="gas-estimate">
          <h4>⛽ Gas Estimate (Optimized)</h4>
          <div className="gas-info">
            <span>Gas Cost: ~{parseFloat(gasEstimate.gasCost).toFixed(6)} ETH</span>
            <span>Gas Price: {parseFloat(gasEstimate.gasPrice).toFixed(2)} gwei</span>
            <span>Gas Limit: {gasEstimate.gasLimit}</span>
          </div>
        </div>
      )}
      
      <button 
        onClick={sendTransfer} 
        disabled={isLoading || !recipient || !amount || !message}
        className="send-button"
      >
        {isLoading ? 'Sending...' : 'Send ETH + Message (Low Gas)'}
      </button>
    </div>
  );

  const renderTransferList = (transferList, title, type) => (
    <div className="transfer-list">
      <h3>
        {type === 'sent' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
        {title}
      </h3>
      
      {transferList.length === 0 ? (
        <p className="no-transfers">No transfers found</p>
      ) : (
        <div className="transfers">
          {transferList.map((transfer, index) => (
            <div key={index} className="transfer-item">
              <div className="transfer-header">
                <div className="addresses">
                  <span className="from">
                    <User size={14} />
                    {formatAddress(transfer.from)}
                    {transfer.from === account && ' (You)'}
                  </span>
                  <span className="arrow">→</span>
                  <span className="to">
                    <User size={14} />
                    {formatAddress(transfer.to)}
                    {transfer.to === account && ' (You)'}
                  </span>
                </div>
                <div className="amount">
                  <DollarSign size={14} />
                  {ethers.utils.formatEther(transfer.amount)} ETH
                </div>
              </div>
              
              <div className="message-content">
                <MessageCircle size={14} />
                <span>"{transfer.message}"</span>
              </div>
              
              <div className="timestamp">
                <Clock size={12} />
                {formatTime(transfer.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="stats-section">
      <h3>📊 Platform Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Transfers</span>
          <span className="stat-value">{stats.totalTransfers || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Volume</span>
          <span className="stat-value">{stats.volume || '0'} ETH</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Transfer</span>
          <span className="stat-value">{stats.averageTransfer || '0'} ETH</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Fees</span>
          <span className="stat-value">{stats.fees || '0'} ETH</span>
        </div>
      </div>
    </div>
  );

  if (!account) {
    return (
      <div className="connect-wallet">
        <h2>Connect your wallet to use OnChain Transfer</h2>
      </div>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="connect-wallet">
        <h2>Contract not deployed yet</h2>
        <p>Please deploy the OnChain Transfer contract first</p>
      </div>
    );
  }

  return (
    <div className="onchain-transfer">
      <div className="transfer-header">
        <h2>💸 OnChain Transfer</h2>
        <p>Send ETH with permanent on-chain messages</p>
      </div>

      <nav className="transfer-nav">
        <button 
          className={`nav-button ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          <Send size={16} />
          Send
        </button>
        <button 
          className={`nav-button ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <ArrowUpRight size={16} />
          Sent ({userTransfers.sent.length})
        </button>
        <button 
          className={`nav-button ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          <ArrowDownLeft size={16} />
          Received ({userTransfers.received.length})
        </button>
        <button 
          className={`nav-button ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <Clock size={16} />
          Recent
        </button>
      </nav>

      <div className="transfer-content">
        {activeTab === 'send' && renderSendForm()}
        {activeTab === 'sent' && renderTransferList(userTransfers.sent, 'Sent Transfers', 'sent')}
        {activeTab === 'received' && renderTransferList(userTransfers.received, 'Received Transfers', 'received')}
        {activeTab === 'recent' && (
          <>
            {renderStats()}
            {renderTransferList(transfers, 'Recent Transfers', 'recent')}
          </>
        )}
      </div>
    </div>
  );
};

export default OnChainTransfer;
