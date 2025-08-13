import React, { useState, useEffect, useRef } from 'react';
import { web3Service } from '../utils/web3';
import { EncryptionService } from '../utils/encryption';
import { Send, Lock, RefreshCw, Users, Plus, X, UserCheck, MessageCircle } from 'lucide-react';

const PrivateChat = ({ account, userKeys }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactNickname, setNewContactNickname] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [showContactList, setShowContactList] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadContacts();
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  useEffect(() => {
    filterMessagesForContact();
  }, [messages, selectedContact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = () => {
    const saved = localStorage.getItem(`contacts_${account}`);
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  };

  const saveContacts = (contactList) => {
    localStorage.setItem(`contacts_${account}`, JSON.stringify(contactList));
  };

  const addContact = async () => {
    if (!newContactAddress.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newContactAddress)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    if (newContactAddress.toLowerCase() === account.toLowerCase()) {
      alert('Cannot add yourself as a contact');
      return;
    }

    try {
      const userInfo = await web3Service.getUser(newContactAddress);
      if (!userInfo.isRegistered) {
        alert('This address is not registered on the platform');
        return;
      }

      const contactExists = contacts.find(
        c => c.address.toLowerCase() === newContactAddress.toLowerCase()
      );

      if (contactExists) {
        alert('This contact already exists');
        return;
      }

      const newContact = {
        address: newContactAddress,
        nickname: newContactNickname.trim() || userInfo.nickname || formatAddress(newContactAddress),
        onChainNickname: userInfo.nickname,
        lastMessage: null,
        unreadCount: 0
      };

      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      saveContacts(updatedContacts);

      setNewContactAddress('');
      setNewContactNickname('');
      setShowAddContact(false);

      alert('Contact added successfully!');
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Failed to add contact: ' + error.message);
    }
  };

  const selectContact = (contact) => {
    setSelectedContact(contact);
    setRecipientAddress(contact.address);
    setShowContactList(false);
    
    const updatedContacts = contacts.map(c => 
      c.address === contact.address ? { ...c, unreadCount: 0 } : c
    );
    setContacts(updatedContacts);
    saveContacts(updatedContacts);
  };

  const filterMessagesForContact = () => {
    if (!selectedContact) {
      setFilteredMessages([]);
      return;
    }

    const contactMessages = messages.filter(msg => 
      (msg.sender.toLowerCase() === selectedContact.address.toLowerCase()) ||
      (msg.receiver.toLowerCase() === selectedContact.address.toLowerCase())
    );

    setFilteredMessages(contactMessages);
  };

  const loadMessages = async () => {
    try {
      const privateMessages = await web3Service.getPrivateMessages(0, 50);
      
      // Handle new contract response format with separate arrays
      const messages = [];
      if (privateMessages && privateMessages.length === 4) {
        const [senders, receivers, encryptedContents, timestamps] = privateMessages;
        
        for (let i = 0; i < senders.length; i++) {
          messages.push({
            sender: senders[i],
            receiver: receivers[i],
            encryptedContent: encryptedContents[i],
            timestamp: timestamps[i],
            id: i
          });
        }
      }
      
      const processedMessages = await Promise.all(
        messages.map(async (msg) => {
          let decryptedContent;
          
          try {
            console.log('Processing message from:', msg.sender, 'to:', msg.receiver);
            console.log('Current user:', account);
            
            // Use shared secret between sender and receiver for both encryption and decryption
            decryptedContent = EncryptionService.decryptMessage(
              msg.encryptedContent,
              msg.sender,
              msg.receiver
            );
            
            console.log('Decryption result:', decryptedContent || 'FAILED');
            
            if (!decryptedContent || decryptedContent === '[Unable to decrypt message]') {
              decryptedContent = '[Unable to decrypt message]';
            }
          } catch (error) {
            console.error('Error decrypting message:', error);
            decryptedContent = '[Unable to decrypt message]';
          }

          return {
            id: msg.id.toString(),
            sender: msg.sender,
            receiver: msg.receiver,
            content: decryptedContent,
            timestamp: parseInt(msg.timestamp.toString()) * 1000,
            isOwn: msg.sender.toLowerCase() === account.toLowerCase(),
            isIncoming: msg.receiver.toLowerCase() === account.toLowerCase() && 
                       msg.sender.toLowerCase() !== account.toLowerCase()
          };
        })
      );

      setMessages(processedMessages);
      updateContactsFromMessages(processedMessages);

    } catch (error) {
      console.error('Error loading private messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContactsFromMessages = async (messageList) => {
    const contactMap = new Map();
    
    for (const msg of messageList) {
      const otherAddress = msg.isOwn ? msg.receiver : msg.sender;
      
      if (!contactMap.has(otherAddress.toLowerCase())) {
        try {
          const userInfo = await web3Service.getUser(otherAddress);
          contactMap.set(otherAddress.toLowerCase(), {
            address: otherAddress,
            nickname: userInfo.nickname || formatAddress(otherAddress),
            onChainNickname: userInfo.nickname,
            lastMessage: msg,
            unreadCount: 0
          });
        } catch (error) {
          console.error('Error getting user info:', error);
        }
      } else {
        const existing = contactMap.get(otherAddress.toLowerCase());
        if (msg.timestamp > (existing.lastMessage?.timestamp || 0)) {
          existing.lastMessage = msg;
        }
      }
    }

    const existingContactsMap = new Map(
      contacts.map(c => [c.address.toLowerCase(), c])
    );

    const mergedContacts = Array.from(contactMap.values()).map(newContact => {
      const existing = existingContactsMap.get(newContact.address.toLowerCase());
      return existing ? {
        ...newContact,
        nickname: existing.nickname,
        unreadCount: selectedContact?.address.toLowerCase() === newContact.address.toLowerCase() 
          ? 0 
          : existing.unreadCount
      } : newContact;
    });

    contacts.forEach(existingContact => {
      if (!contactMap.has(existingContact.address.toLowerCase())) {
        mergedContacts.push(existingContact);
      }
    });

    setContacts(mergedContacts);
    saveContacts(mergedContacts);
  };

  const sendPrivateMessage = async () => {
    if (!newMessage.trim() || !recipientAddress.trim()) {
      alert('Please select a contact or enter recipient address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    if (recipientAddress.toLowerCase() === account.toLowerCase()) {
      alert('Cannot send message to yourself');
      return;
    }

    setIsSending(true);
    try {
      const recipientInfo = await web3Service.getUser(recipientAddress);
      
      if (!recipientInfo.isRegistered) {
        alert('Recipient is not registered on the platform');
        return;
      }

      console.log('Encrypting message for recipient:', recipientAddress);
      console.log('Message to encrypt:', newMessage.trim());
      
      const encryptedMessage = EncryptionService.encryptMessage(
        newMessage.trim(),
        account,  // sender address
        recipientAddress  // receiver address
      );
      
      console.log('Encrypted message:', encryptedMessage.substring(0, 50) + '...');

      await web3Service.sendPrivateMessage(recipientAddress, encryptedMessage);
      
      // Auto-add as contact if not exists
      const contactExists = contacts.find(
        c => c.address.toLowerCase() === recipientAddress.toLowerCase()
      );
      
      if (!contactExists) {
        const newContact = {
          address: recipientAddress,
          nickname: recipientInfo.nickname || formatAddress(recipientAddress),
          onChainNickname: recipientInfo.nickname,
          lastMessage: null,
          unreadCount: 0
        };
        const updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);
        saveContacts(updatedContacts);
      }
      
      setNewMessage('');
      setTimeout(loadMessages, 2000);
    } catch (error) {
      console.error('Error sending private message:', error);
      alert('Failed to send private message: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrivateMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Contact list view
  if (showContactList) {
    return (
      <div className="private-chat">
        <div className="chat-header">
          <Lock size={20} />
          <h3>Private Chat</h3>
          <button 
            onClick={loadMessages} 
            className="refresh-button"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>

        <div className="contacts-container">
          <div className="contacts-header">
            <h4>Contacts</h4>
            <button 
              onClick={() => setShowAddContact(true)}
              className="add-contact-button"
            >
              <Plus size={16} />
              Add Contact
            </button>
          </div>

          {showAddContact && (
            <div className="add-contact-form">
              <div className="form-row">
                <input
                  type="text"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  placeholder="Wallet address (0x...)"
                  className="contact-input"
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  value={newContactNickname}
                  onChange={(e) => setNewContactNickname(e.target.value)}
                  placeholder="Custom nickname (optional)"
                  className="contact-input"
                />
              </div>
              <div className="form-actions">
                <button onClick={addContact} className="save-contact-button">
                  <UserCheck size={16} />
                  Add Contact
                </button>
                <button 
                  onClick={() => {
                    setShowAddContact(false);
                    setNewContactAddress('');
                    setNewContactNickname('');
                  }}
                  className="cancel-button"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="contacts-list">
            {contacts.length === 0 ? (
              <div className="no-contacts">
                <MessageCircle size={48} />
                <p>No contacts yet. Add someone to start messaging!</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div 
                  key={contact.address}
                  className="contact-item"
                  onClick={() => selectContact(contact)}
                >
                  <div className="contact-info">
                    <div className="contact-name">{contact.nickname}</div>
                    <div className="contact-address">{formatAddress(contact.address)}</div>
                    {contact.lastMessage && (
                      <div className="last-message">
                        {contact.lastMessage.content.length > 50 
                          ? contact.lastMessage.content.substring(0, 50) + '...'
                          : contact.lastMessage.content
                        }
                        <span className="message-time">
                          {formatTime(contact.lastMessage.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                  {contact.unreadCount > 0 && (
                    <div className="unread-badge">{contact.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="manual-input-section">
          <div className="section-header">
            <h4>Send to Address</h4>
          </div>
          <div className="manual-input-form">
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter wallet address manually..."
              className="manual-address-input"
            />
            <button 
              onClick={() => {
                if (recipientAddress) {
                  setShowContactList(false);
                }
              }}
              disabled={!recipientAddress}
              className="continue-button"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="private-chat">
      <div className="chat-header">
        <button 
          onClick={() => setShowContactList(true)}
          className="back-button"
        >
          ←
        </button>
        <Lock size={20} />
        <h3>
          {selectedContact 
            ? selectedContact.nickname 
            : formatAddress(recipientAddress)
          }
        </h3>
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
          <div className="loading">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <div 
                key={message.id} 
                className={`message private-message ${
                  message.isOwn ? 'own-message' : 'received-message'
                }`}
              >
                <div className="message-header">
                  <span className="sender">
                    {message.isOwn ? 'You' : (selectedContact?.nickname || formatAddress(message.sender))}
                  </span>
                  <span className="timestamp">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="message-content encrypted">
                  <Lock size={12} className="lock-icon" />
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
          placeholder="Type your encrypted message..."
          className="message-input"
          rows={2}
          maxLength={500}
        />
        <button 
          onClick={sendPrivateMessage}
          disabled={isSending || !newMessage.trim()}
          className="send-button private"
        >
          <Lock size={14} />
          <Send size={16} />
        </button>
      </div>

      <div className="character-count">
        {newMessage.length}/500 characters
      </div>
    </div>
  );
};

export default PrivateChat;
