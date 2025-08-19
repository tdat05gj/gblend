import { ethers } from 'ethers';

// Gblend Testnet configuration
export const GBLEND_TESTNET_CONFIG = {
  chainId: '0x51F2', // 20994 in hex
  chainName: 'Gblend Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.testnet.fluent.xyz/'],
  blockExplorerUrls: ['https://testnet.fluentscan.xyz/'],
};

// Contract ABI (optimized for gas-efficient contract)
export const CONTRACT_ABI = [
  "function registerUser(string calldata _publicKey, string calldata _nickname) external",
  "function sendPublicMessage(string calldata _content) external",
  "function sendPrivateMessage(address _receiver, string calldata _encryptedContent) external",
  "function batchSendPublicMessages(string[] calldata _contents) external",
  "function getPublicMessages(uint256 _offset, uint256 _limit) external view returns (address[] memory senders, string[] memory contents, uint32[] memory timestamps)",
  "function getPrivateMessages(uint256 _offset, uint256 _limit) external view returns (address[] memory senders, address[] memory receivers, string[] memory encryptedContents, uint32[] memory timestamps)",
  "function getUser(address _user) external view returns (tuple(string publicKey, string nickname, bool isRegistered))",
  "function getTotalPublicMessages() external view returns (uint256)",
  "function getTotalPrivateMessages() external view returns (uint256)",
  "function isUserRegistered(address _user) external view returns (bool)",
  "event PublicMessageSent(uint256 indexed messageId, address indexed sender, uint32 timestamp)",
  "event PrivateMessageSent(uint256 indexed messageId, address indexed sender, address indexed receiver, uint32 timestamp)",
  "event UserRegistered(address indexed user, string nickname)"
];

// Game 2048 Contract ABI
export const GAME2048_ABI = [
  "function submitScore(uint256 _score, string memory _playerName) external payable",
  "function claimReward() external",
  "function getLeaderboard(uint256 _start, uint256 _limit) external view returns (address[] memory players, uint256[] memory scores, uint256[] memory timestamps, string[] memory names)",
  "function getPlayerRank(address _player) external view returns (uint256 rank, bool found)",
  "function getPlayerStats(address _player) external view returns (uint256 bestScore, string memory playerName, uint256 rank, bool hasPlayed)",
  "function getPoolInfo() external view returns (uint256 currentPool, uint256 threshold, bool canClaim, address topPlayer)",
  "function getLeaderboardLength() external view returns (uint256)",
  "function GAME_FEE() external view returns (uint256)",
  "function POOL_THRESHOLD() external view returns (uint256)",
  "function rewardPool() external view returns (uint256)",
  "event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)",
  "event RewardClaimed(address indexed winner, uint256 amount, uint256 timestamp)",
  "event PoolThresholdReached(uint256 poolAmount, address indexed topPlayer)"
];

// Contract addresses (deployed on Gblend Testnet)
const CONTRACT_ADDRESS = '0xe658d00F63Ccc52CF8EC831Dc18E2Db715510F35';
const GAME2048_CONTRACT_ADDRESS = '0xA073E68bfC2f5C796E7842ABc3fD76E6e12A32F5';

export class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.game2048Contract = null;
    this.account = null;
    
    // Listen for network changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
    }
  }

  handleChainChanged(chainId) {
    // Reload the page when network changes to ensure clean state
    window.location.reload();
  }

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {

      // Handle disconnection
      this.account = null;
      this.provider = null;
      this.signer = null;
      this.contract = null;
    } else if (accounts[0] !== this.account) {

      this.account = accounts[0];
      // Reinitialize with new account
      this.initializeContract();
    }
  }

  async connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        this.account = accounts[0];
        
        // Initialize provider first
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Check current network
        const network = await this.provider.getNetwork();
        
        // If not on Gblend Testnet, try to switch
        if (network.chainId !== 20994) {
          try {
            // Try to switch first
            await this.switchToGblendTestnet();
          } catch (switchError) {
            // If switch fails, try to add the network then switch
            try {
              await this.addGblendTestnet();
              await this.switchToGblendTestnet();
            } catch (addError) {
              console.warn('Could not automatically switch to Gblend Testnet:', addError);
              // Continue anyway, let user know they need to switch manually
            }
          }
          
          // Re-initialize provider after network change
          this.provider = new ethers.providers.Web3Provider(window.ethereum);
        }
        
        // Initialize contract
        await this.initializeContract();
        
        return this.account;
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
      }
    } else {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }
  }

  async addGblendTestnet() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [GBLEND_TESTNET_CONFIG],
      });

    } catch (error) {
      console.error('Error adding Gblend Testnet:', error);
      // Chain might already be added or user rejected
      if (error.code !== 4001) { // 4001 is user rejected
        throw error;
      }
    }
  }

  async switchToGblendTestnet() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GBLEND_TESTNET_CONFIG.chainId }],
      });

    } catch (error) {
      console.error('Error switching to Gblend Testnet:', error);
      // If the chain has not been added to the wallet, add it
      if (error.code === 4902) {
        await this.addGblendTestnet();
        // Try to switch again after adding
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: GBLEND_TESTNET_CONFIG.chainId }],
        });
      } else {
        throw error;
      }
    }
  }

  async initializeContract() {
    if (!this.provider) {
      throw new Error('Provider not initialized. Please connect wallet first.');
    }
    
    try {
      this.signer = this.provider.getSigner();
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      
      // Test contract connection
      const network = await this.provider.getNetwork();
      
      // Warn if not on correct network but still allow initialization
      if (network.chainId !== 20994) {
        console.warn('Warning: Not connected to Gblend Testnet. Some features may not work properly.');
        console.warn('Please switch to Gblend Testnet (Chain ID: 20994) for full functionality.');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing contract:', error);
      throw error;
    }
  }

  async initializeGame2048Contract() {
    try {
      if (!this.provider || !this.signer) {
        await this.connectWallet();
      }
      
      this.game2048Contract = new ethers.Contract(GAME2048_CONTRACT_ADDRESS, GAME2048_ABI, this.signer);
      return true;
    } catch (error) {
      console.error('Error initializing Game2048 contract:', error);
      throw error;
    }
  }

  async registerUser(publicKey, nickname) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.registerUser(publicKey, nickname);
    await tx.wait();
    return tx;
  }

  async sendPublicMessage(content) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.sendPublicMessage(content);
    await tx.wait();
    return tx;
  }

  async sendPrivateMessage(receiverAddress, encryptedContent) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.sendPrivateMessage(receiverAddress, encryptedContent);
    await tx.wait();
    return tx;
  }

  async getPublicMessages(offset = 0, limit = 20) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.getPublicMessages(offset, limit);
  }

  async getPrivateMessages(offset = 0, limit = 20) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.getPrivateMessages(offset, limit);
  }

  async getUser(address) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.getUser(address);
  }

  async isUserRegistered(address) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    return await this.contract.isUserRegistered(address);
  }

  async getTotalPublicMessages() {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const total = await this.contract.getTotalPublicMessages();
    return total.toNumber();
  }

  async getTotalPrivateMessages() {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const total = await this.contract.getTotalPrivateMessages();
    return total.toNumber();
  }
}

export const web3Service = new Web3Service();

// Export the provider function for game contract
export const getWeb3Provider = async () => {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  throw new Error('MetaMask not found');
};
