import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Clock, 
  User, 
  MessageCircle,
  ChevronRight,
  ArrowLeft,
  Edit3,
  Trash2
} from 'lucide-react';
import './Feedback.css';

// Import ABI
import FeedbackABI from '../../../artifacts/contracts/Feedback.sol/Feedback.json';

const FEEDBACK_CONTRACT_ADDRESS = import.meta.env.VITE_FEEDBACK_CONTRACT_ADDRESS || "";

const Feedback = ({ account }) => {
  // Debug contract address
  console.log('FEEDBACK_CONTRACT_ADDRESS:', FEEDBACK_CONTRACT_ADDRESS);
  console.log('import.meta.env:', import.meta.env);
  
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form states
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: ''
  });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    initializeContract();
  }, [account]);

  useEffect(() => {
    if (contract) {
      loadTopics();
    }
  }, [contract]);

  const addGblendNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x5202', // 20994 in hex
            chainName: 'Gblend Testnet',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://rpc.testnet.fluent.xyz/'],
            blockExplorerUrls: ['https://testnet.fluentscan.xyz/'],
          },
        ],
      });
      toast.success('Gblend Testnet added to MetaMask!');
    } catch (error) {
      console.error('Error adding network:', error);
      toast.error('Failed to add Gblend Testnet');
    }
  };

  const initializeContract = async () => {
    console.log('Initializing contract...');
    console.log('window.ethereum:', !!window.ethereum);
    console.log('account:', account);
    console.log('FEEDBACK_CONTRACT_ADDRESS:', FEEDBACK_CONTRACT_ADDRESS);
    
    if (!window.ethereum || !account) {
      console.log('Missing ethereum or account');
      return;
    }

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check network
      const network = await web3Provider.getNetwork();
      console.log('Current network:', network);
      console.log('Expected chainId: 20994, Current chainId:', network.chainId);
      
      if (network.chainId !== 20994) {
        console.log('Wrong network detected');
        toast.error(
          <div>
            Wrong network! Please connect to Gblend Testnet (Chain ID: 20994). 
            <br/>Current: {network.chainId}
            <br/>
            <button 
              onClick={addGblendNetwork}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Gblend Testnet
            </button>
          </div>,
          { autoClose: false }
        );
        return;
      }
      
      const signer = web3Provider.getSigner();
      setProvider(web3Provider);

      if (FEEDBACK_CONTRACT_ADDRESS) {
        console.log('Creating contract instance...');
        const feedbackContract = new ethers.Contract(
          FEEDBACK_CONTRACT_ADDRESS,
          FeedbackABI.abi,
          signer
        );
        console.log('Contract instance created:', feedbackContract);
        
        // Test contract exists
        try {
          const code = await web3Provider.getCode(FEEDBACK_CONTRACT_ADDRESS);
          console.log('Contract code length:', code.length);
          console.log('Contract code (first 100 chars):', code.substring(0, 100));
          
          if (code === '0x') {
            console.log('❌ Contract not found! Possible reasons:');
            console.log('1. MetaMask connected to wrong network');
            console.log('2. Contract not deployed to this network');
            console.log('3. RPC connection issue');
            
            // Try to get network info again
            const networkInfo = await web3Provider.getNetwork();
            console.log('Network info:', networkInfo);
            
            toast.error(
              <div>
                Contract not found! Please ensure MetaMask is using the correct RPC.
                <br/>
                <button 
                  onClick={addGblendNetwork}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add/Update Gblend Testnet
                </button>
              </div>,
              { autoClose: false }
            );
            return;
          } else {
            console.log('✅ Contract found with code length:', code.length);
          }
        } catch (codeError) {
          console.error('Error checking contract code:', codeError);
        }
        
        setContract(feedbackContract);
      } else {
        console.error('Contract address is empty!');
        toast.error('Feedback contract address not configured');
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize feedback contract');
    }
  };

  const loadTopics = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const topicsData = await contract.getAllTopics();
      
      const formattedTopics = topicsData.map(topic => ({
        id: topic.id.toNumber(),
        creator: topic.creator,
        title: topic.title,
        description: topic.description,
        timestamp: new Date(topic.timestamp.toNumber() * 1000),
        commentCount: topic.commentCount.toNumber(),
        isActive: topic.isActive
      }));

      setTopics(formattedTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (topicId) => {
    if (!contract) return;

    try {
      setLoading(true);
      const commentsData = await contract.getTopicComments(topicId);
      
      const formattedComments = commentsData.map(comment => ({
        id: comment.id.toNumber(),
        topicId: comment.topicId.toNumber(),
        commenter: comment.commenter,
        content: comment.content,
        timestamp: new Date(comment.timestamp.toNumber() * 1000),
        isActive: comment.isActive
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async () => {
    if (!contract || !newTopic.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.createTopic(
        newTopic.title.trim(),
        newTopic.description.trim()
      );
      await tx.wait();
      
      setNewTopic({ title: '', description: '' });
      setShowCreateForm(false);
      await loadTopics();
      toast.success('Topic created successfully!');
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!contract || !newComment.trim() || !selectedTopic) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.addComment(selectedTopic.id, newComment.trim());
      await tx.wait();
      
      setNewComment('');
      await loadComments(selectedTopic.id);
      await loadTopics(); // Refresh to update comment count
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    return date.toLocaleString();
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    loadComments(topic.id);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setComments([]);
  };

  if (selectedTopic) {
    return (
      <div className="feedback-container">
        <div className="feedback-header">
          <button onClick={handleBackToTopics} className="back-button">
            <ArrowLeft size={20} />
            Back to Topics
          </button>
          <h2>Topic Discussion</h2>
        </div>

        <div className="topic-detail">
          <div className="topic-header">
            <h3>{selectedTopic.title}</h3>
            <div className="topic-meta">
              <span className="creator">
                <User size={16} />
                {formatAddress(selectedTopic.creator)}
              </span>
              <span className="timestamp">
                <Clock size={16} />
                {formatDate(selectedTopic.timestamp)}
              </span>
              <span className="comment-count">
                <MessageCircle size={16} />
                {selectedTopic.commentCount} comments
              </span>
            </div>
          </div>
          
          {selectedTopic.description && (
            <div className="topic-description">
              <p>{selectedTopic.description}</p>
            </div>
          )}
        </div>

        <div className="comments-section">
          <h4>Comments ({comments.length})</h4>
          
          <div className="comment-form">
            <textarea
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <div className="comment-form-actions">
              <span className="char-count">{newComment.length}/500</span>
              <button 
                onClick={addComment} 
                disabled={loading || !newComment.trim()}
                className="add-comment-btn"
              >
                <Send size={16} />
                {loading ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>

          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="commenter">
                    <User size={14} />
                    {formatAddress(comment.commenter)}
                  </span>
                  <span className="comment-time">
                    <Clock size={14} />
                    {formatDate(comment.timestamp)}
                  </span>
                </div>
                <div className="comment-content">
                  <p>{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && !loading && (
              <div className="empty-comments">
                <MessageCircle size={48} />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <div className="header-left">
          <h2>
            <MessageSquare size={24} />
            Feedback & Discussions
          </h2>
          <p>Share your thoughts and engage with the community.</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)} 
          className="create-topic-btn"
        >
          <Plus size={20} />
          Create Topic
        </button>
      </div>

      {showCreateForm && (
        <div className="create-topic-form">
          <div className="form-header">
            <h3>Create New Topic</h3>
            <button 
              onClick={() => setShowCreateForm(false)}
              className="close-form-btn"
            >
              ×
            </button>
          </div>
          
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="Enter topic title"
              value={newTopic.title}
              onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
              maxLength={200}
            />
            <span className="char-count">{newTopic.title.length}/200</span>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Enter topic description (optional)"
              value={newTopic.description}
              onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
              maxLength={1000}
              rows={4}
            />
            <span className="char-count">{newTopic.description.length}/1000</span>
          </div>
          
          <div className="form-actions">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button 
              onClick={createTopic} 
              disabled={loading || !newTopic.title.trim()}
              className="create-btn"
            >
              {loading ? 'Creating...' : 'Create Topic'}
            </button>
          </div>
        </div>
      )}

      <div className="topics-list">
        {loading && topics.length === 0 ? (
          <div className="loading">Loading topics...</div>
        ) : topics.length === 0 ? (
          <div className="empty-topics">
            <MessageSquare size={48} />
            <h3>No topics yet</h3>
            <p>Be the first to create a discussion topic!</p>
          </div>
        ) : (
          topics.map((topic) => (
            <div 
              key={topic.id} 
              className="topic-item"
              onClick={() => handleTopicClick(topic)}
            >
              <div className="topic-content">
                <h3>{topic.title}</h3>
                {topic.description && (
                  <p className="topic-description">{topic.description}</p>
                )}
                <div className="topic-meta">
                  <span className="creator">
                    <User size={14} />
                    {formatAddress(topic.creator)}
                  </span>
                  <span className="timestamp">
                    <Clock size={14} />
                    {formatDate(topic.timestamp)}
                  </span>
                  <span className="comment-count">
                    <MessageCircle size={14} />
                    {topic.commentCount} comments
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="arrow-icon" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feedback;
