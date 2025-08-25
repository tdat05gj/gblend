import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast, ToastContainer } from 'react-toastify';
import { 
  MessageCircle, 
  User, 
  Clock, 
  Send, 
  Plus, 
  Loader2, 
  MessageSquare,
  ArrowLeft,
  Hash,
  Calendar
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import './FeedbackSystem.css';

// Contract ABI - Human readable format
const FEEDBACK_ABI = [
  "function createTopic(string memory _title, string memory _description) external",
  "function addComment(uint256 _topicId, string memory _content) external",
  "function getAllTopics() external view returns (tuple(uint256 id, address creator, string title, string description, uint256 timestamp, uint256 commentCount, bool isActive)[])",
  "function getTopicComments(uint256 _topicId) external view returns (tuple(uint256 id, uint256 topicId, address commenter, string content, uint256 timestamp, bool isActive)[])",
  "function getTopic(uint256 _topicId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 timestamp, uint256 commentCount, bool isActive))",
  "function getStats() external view returns (uint256 topicCount, uint256 commentCount, uint256 nextTopic, uint256 nextComment)",
  "function getTopicCount() external view returns (uint256)",
  "function getCommentCount() external view returns (uint256)",
  "event TopicCreated(uint256 indexed topicId, address indexed creator, string title)",
  "event CommentAdded(uint256 indexed commentId, uint256 indexed topicId, address indexed commenter)"
];

const CONTRACT_ADDRESS = "0x2Eb7e8f39fd440a7c2bb0015d2DDe1aA7f5bfA87";
const GBLEND_CHAIN_ID = 20994;

const FeedbackSystem = ({ account }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Data state
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ topicCount: 0, commentCount: 0 });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Form state
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [newComment, setNewComment] = useState('');

  // Initialize when account is available
  useEffect(() => {
    if (account && window.ethereum) {
      initializeProvider();
    }
  }, [account]);

  // Load data when contract is ready
  useEffect(() => {
    if (contract && isConnected) {
      loadInitialData();
      setupEventListeners();
    }
  }, [contract, isConnected]);

  const initializeProvider = async () => {
    try {
      setIsLoading(true);
      
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      // Since account is already connected via App.jsx, initialize contract directly
      await initializeContract(web3Provider);
    } catch (error) {
      console.error('Error initializing provider:', error);
      toast.error('Failed to initialize connection');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeContract = async (web3Provider) => {
    try {
      const network = await web3Provider.getNetwork();
      
      // Just warn if wrong network, don't block
      if (network.chainId !== GBLEND_CHAIN_ID) {
        toast.warn('Please switch to Gblend Testnet for full functionality');
      }

      const web3Signer = web3Provider.getSigner();
      setSigner(web3Signer);

      const feedbackContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FEEDBACK_ABI,
        web3Signer
      );

      setContract(feedbackContract);
      setIsConnected(true);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize contract');
    }
  };

  const switchToGblendNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${GBLEND_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${GBLEND_CHAIN_ID.toString(16)}`,
              chainName: 'Gblend Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://rpc.testnet.fluent.xyz/'],
              blockExplorerUrls: ['https://blockscout.testnet.fluent.xyz/'],
            },
          ],
        });
      }
    }
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([loadTopics(), loadStats()]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const contractStats = await contract.getStats();
      // getStats returns (topicCount, commentCount, nextTopic, nextComment)
      setStats({
        topicCount: contractStats[0].toNumber(),
        commentCount: contractStats[1].toNumber()
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTopics = async () => {
    try {
      setIsLoading(true);
      const allTopics = await contract.getAllTopics();
      
      const formattedTopics = allTopics
        .filter(topic => topic.isActive)
        .map(topic => ({
          id: topic.id.toNumber(),
          creator: topic.creator,
          title: topic.title,
          description: topic.description,
          timestamp: topic.timestamp.toNumber(),
          commentCount: topic.commentCount.toNumber(),
          isActive: topic.isActive
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

      setTopics(formattedTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (topicId) => {
    try {
      setLoadingComments(true);
      const topicComments = await contract.getTopicComments(topicId);
      
      const formattedComments = topicComments
        .filter(comment => comment.isActive)
        .map(comment => ({
          id: comment.id.toNumber(),
          topicId: comment.topicId.toNumber(),
          commenter: comment.commenter,
          content: comment.content,
          timestamp: comment.timestamp.toNumber(),
          isActive: comment.isActive
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort by oldest first

      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const createTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newTopic.title.length > 100) {
      toast.error('Title too long (max 100 characters)');
      return;
    }

    if (newTopic.description.length > 500) {
      toast.error('Description too long (max 500 characters)');
      return;
    }

    try {
      setIsLoading(true);
      
      const tx = await contract.createTopic(newTopic.title.trim(), newTopic.description.trim());
      toast.info('Creating topic...');
      
      const receipt = await tx.wait();
      toast.success('Topic created successfully!');
      
      // Reset form
      setNewTopic({ title: '', description: '' });
      setShowCreateForm(false);
      
      // Reload data
      await loadInitialData();
      
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic: ' + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (newComment.length > 1000) {
      toast.error('Comment too long (max 1000 characters)');
      return;
    }

    try {
      setIsLoading(true);
      
      const tx = await contract.addComment(selectedTopic.id, newComment.trim());
      toast.info('Adding comment...');
      
      await tx.wait();
      toast.success('Comment added successfully!');
      
      // Reset form
      setNewComment('');
      
      // Reload comments and topics (to update comment count)
      await Promise.all([
        loadComments(selectedTopic.id),
        loadTopics(),
        loadStats()
      ]);
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment: ' + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    if (!contract) return;

    // Listen for new topics
    contract.on('TopicCreated', (topicId, creator, title) => {
      console.log('New topic created:', { topicId: topicId.toNumber(), creator, title });
      // Reload topics when new topic is created by others
      if (creator.toLowerCase() !== account.toLowerCase()) {
        loadInitialData();
      }
    });

    // Listen for new comments
    contract.on('CommentAdded', (commentId, topicId, commenter) => {
      console.log('New comment added:', { commentId: commentId.toNumber(), topicId: topicId.toNumber(), commenter });
      // Reload comments if viewing the topic that received a comment
      if (selectedTopic && selectedTopic.id === topicId.toNumber() && commenter.toLowerCase() !== account.toLowerCase()) {
        loadComments(topicId.toNumber());
        loadTopics(); // Update comment count
      }
    });

    // Cleanup function
    return () => {
      contract.removeAllListeners('TopicCreated');
      contract.removeAllListeners('CommentAdded');
    };
  };

  const selectTopic = async (topic) => {
    setSelectedTopic(topic);
    await loadComments(topic.id);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const time = timestamp * 1000;
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Show loading if account is not available or contract not connected
  if (!account || !isConnected) {
    return (
      <div className="feedback-container">
        <div className="feedback-connect-wallet">
          <MessageSquare size={64} className="connect-icon" />
          <h2>Loading Feedback System</h2>
          <p>Initializing connection...</p>
          <Loader2 className="animate-spin" size={32} />
        </div>
        <ToastContainer position="top-right" />
      </div>
    );
  }

  return (
    <div className="feedback-container">
      {/* Header */}
      <div className="feedback-header">
        <div className="header-content">
          <h1>
            <MessageSquare className="icon" />
            Feedback System
          </h1>
          <div className="stats-row">
            <div className="stat-item">
              <Hash size={16} />
              <span>{stats.topicCount} Topics</span>
            </div>
            <div className="stat-item">
              <MessageCircle size={16} />
              <span>{stats.commentCount} Comments</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="account-info">
            <User size={16} />
            <span>{formatAddress(account)}</span>
          </div>
          {!selectedTopic && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              New Topic
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {selectedTopic ? (
        /* Topic Detail View */
        <div className="topic-detail">
          <div className="topic-detail-header">
            <button
              onClick={() => setSelectedTopic(null)}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} />
              Back to Topics
            </button>
          </div>

          {/* Selected Topic Card */}
          <div className="topic-card featured">
            <div className="topic-header">
              <div className="topic-meta">
                <span className="creator">
                  <User size={14} />
                  {formatAddress(selectedTopic.creator)}
                </span>
                <span className="timestamp">
                  <Calendar size={14} />
                  {formatDate(selectedTopic.timestamp)}
                </span>
                <span className="topic-id">
                  <Hash size={14} />
                  #{selectedTopic.id}
                </span>
              </div>
            </div>
            <h2>{selectedTopic.title}</h2>
            <p className="topic-description">{selectedTopic.description}</p>
            <div className="topic-stats">
              <span className="comment-count">
                <MessageCircle size={14} />
                {selectedTopic.commentCount} comments
              </span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="comments-section">
            <div className="comments-header">
              <h3>
                Discussion ({comments.length})
              </h3>
            </div>
            
            {/* Add Comment Form */}
            <div className="comment-form">
              <div className="form-header">
                <User size={16} />
                <span>{formatAddress(account)}</span>
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this topic..."
                rows={3}
                maxLength={1000}
                className="comment-input"
              />
              <div className="form-footer">
                <span className="char-count">
                  {newComment.length}/1000
                </span>
                <button
                  onClick={addComment}
                  disabled={isLoading || !newComment.trim()}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  Post Comment
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="comments-list">
              {loadingComments ? (
                <div className="loading-state">
                  <Loader2 className="animate-spin" size={24} />
                  <p>Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-card">
                    <div className="comment-header">
                      <div className="commenter-info">
                        <User size={14} />
                        <span className="commenter-address">
                          {formatAddress(comment.commenter)}
                        </span>
                        {comment.commenter.toLowerCase() === selectedTopic.creator.toLowerCase() && (
                          <span className="author-badge">Author</span>
                        )}
                      </div>
                      <div className="comment-meta">
                        <span className="timestamp">
                          <Clock size={12} />
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                        <span className="comment-id">
                          <Hash size={12} />
                          #{comment.id}
                        </span>
                      </div>
                    </div>
                    <div className="comment-content">
                      <p>{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <MessageCircle size={48} />
                  <h4>No comments yet</h4>
                  <p>Be the first to share your thoughts on this topic!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Topics List View */
        <div className="topics-list">
          <div className="topics-grid">
            {isLoading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={32} />
                <p>Loading topics...</p>
              </div>
            ) : topics.length > 0 ? (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="topic-card"
                  onClick={() => selectTopic(topic)}
                >
                  <div className="topic-header">
                    <div className="topic-meta">
                      <span className="creator">
                        <User size={14} />
                        {formatAddress(topic.creator)}
                      </span>
                      <span className="timestamp">
                        <Clock size={14} />
                        {formatTimeAgo(topic.timestamp)}
                      </span>
                      <span className="topic-id">
                        <Hash size={14} />
                        #{topic.id}
                      </span>
                    </div>
                  </div>
                  <h3>{topic.title}</h3>
                  <p className="topic-description">{topic.description}</p>
                  <div className="topic-footer">
                    <div className="topic-stats">
                      <span className="comment-count">
                        <MessageCircle size={14} />
                        {topic.commentCount} comments
                      </span>
                    </div>
                    <span className="view-link">View Discussion →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <MessageSquare size={64} />
                <h3>No topics yet</h3>
                <p>Start the conversation by creating the first topic!</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-primary btn-large"
                >
                  <Plus size={20} />
                  Create First Topic
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Topic</h2>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="topic-title">Title *</label>
                <input
                  id="topic-title"
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  placeholder="Enter an engaging topic title..."
                  maxLength={100}
                  className="form-input"
                />
                <span className="char-count">{newTopic.title.length}/100</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="topic-description">Description *</label>
                <textarea
                  id="topic-description"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  placeholder="Describe your topic in detail..."
                  rows={5}
                  maxLength={500}
                  className="form-textarea"
                />
                <span className="char-count">{newTopic.description.length}/500</span>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createTopic}
                disabled={isLoading || !newTopic.title.trim() || !newTopic.description.trim()}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Topic
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
};

export default FeedbackSystem;
