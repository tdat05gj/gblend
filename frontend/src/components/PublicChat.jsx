import React, { useState, useEffect, useRef } from 'react';
import { web3Service } from '../utils/web3';
import { Send, MessageSquare, RefreshCw } from 'lucide-react';

const PublicChat = ({ account }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const result = await web3Service.getPublicMessages(0, 50);
      
      // New format: separate arrays for senders, contents, timestamps
      const [senders, contents, timestamps] = result;
      
      // Convert to message objects with auto-generated IDs
      const formattedMessages = senders.map((sender, index) => ({
        id: index.toString(),
        sender: sender,
        content: contents[index],
        timestamp: parseInt(timestamps[index]) * 1000, // Convert uint32 to milliseconds
        isOwn: sender.toLowerCase() === account.toLowerCase()
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading public messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await web3Service.sendPublicMessage(newMessage.trim());
      setNewMessage('');
      // Reload messages after sending
      setTimeout(loadMessages, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="public-chat">
      <div className="chat-header">
        <MessageSquare size={20} />
        <h3>Public Board</h3>
        <button 
          onClick={loadMessages} 
          className="refresh-button"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="messages-container">
        {isLoading ? (
          <div className="loading">Loading posts...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No public posts yet. Be the first to share!</div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.isOwn ? 'own-message' : ''}`}
              >
                <div className="message-header">
                  <span className="sender">
                    {message.isOwn ? 'You' : formatAddress(message.sender)}
                  </span>
                  <span className="timestamp">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="message-input-container">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Share your thoughts publicly... (Press Enter to send)"
          className="message-input"
          rows={2}
          maxLength={1000}
        />
        <button 
          onClick={sendMessage}
          disabled={isSending || !newMessage.trim()}
          className="send-button"
        >
          <Send size={18} />
        </button>
      </div>

      <div className="character-count">
        {newMessage.length}/1000 characters
      </div>
    </div>
  );
};

export default PublicChat;
