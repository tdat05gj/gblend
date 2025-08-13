// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GblendMessaging is ReentrancyGuard, Ownable {
    struct PublicMessage {
        address sender;
        string content;
        uint32 timestamp; // uint32 instead of uint256 saves gas
    }
    
    struct PrivateMessage {
        address sender;
        address receiver;
        string encryptedContent;
        uint32 timestamp; // uint32 instead of uint256 saves gas
    }
    
    struct User {
        string publicKey;
        string nickname;
        bool isRegistered;
    }
    
    // Pack counters to save storage slots
    uint128 private _publicMessageCounter;
    uint128 private _privateMessageCounter;
    
    // Use mappings with packed structs
    mapping(uint256 => PublicMessage) public publicMessages;
    mapping(uint256 => PrivateMessage) public privateMessages;
    mapping(address => User) public users;
    mapping(address => uint256[]) public userPrivateMessages;
    
    uint256[] public allPublicMessageIds;
    
    // Events - indexed parameters for efficient filtering
    event PublicMessageSent(
        uint256 indexed messageId,
        address indexed sender,
        uint32 timestamp
    );
    
    event PrivateMessageSent(
        uint256 indexed messageId,
        address indexed sender,
        address indexed receiver,
        uint32 timestamp
    );
    
    event UserRegistered(
        address indexed user,
        string nickname
    );
    
    // Custom errors save gas compared to require strings
    error UserNotRegistered();
    error EmptyMessage();
    error MessageTooLong();
    error InvalidReceiver();
    error ReceiverNotRegistered();
    error CannotMessageSelf();
    error EmptyPublicKey();
    error EmptyNickname();
    
    // Modifiers
    modifier onlyRegistered() {
        if (!users[msg.sender].isRegistered) revert UserNotRegistered();
        _;
    }
    
    // Constructor
    constructor() {}
    
    // Register user with public key for encryption
    function registerUser(string calldata _publicKey, string calldata _nickname) external {
        if (bytes(_publicKey).length == 0) revert EmptyPublicKey();
        if (bytes(_nickname).length == 0) revert EmptyNickname();
        
        users[msg.sender] = User({
            publicKey: _publicKey,
            nickname: _nickname,
            isRegistered: true
        });
        
        emit UserRegistered(msg.sender, _nickname);
    }
    
    // Send public message (optimized for L2)
    function sendPublicMessage(string calldata _content) external onlyRegistered nonReentrant {
        if (bytes(_content).length == 0) revert EmptyMessage();
        if (bytes(_content).length > 1000) revert MessageTooLong();
        
        unchecked {
            ++_publicMessageCounter;
        }
        
        uint32 timestamp = uint32(block.timestamp);
        
        publicMessages[_publicMessageCounter] = PublicMessage({
            sender: msg.sender,
            content: _content,
            timestamp: timestamp
        });
        
        allPublicMessageIds.push(_publicMessageCounter);
        
        emit PublicMessageSent(_publicMessageCounter, msg.sender, timestamp);
    }
    
    // Send private encrypted message (gas optimized)
    function sendPrivateMessage(
        address _receiver,
        string calldata _encryptedContent
    ) external onlyRegistered nonReentrant {
        if (_receiver == address(0)) revert InvalidReceiver();
        if (_receiver == msg.sender) revert CannotMessageSelf();
        if (!users[_receiver].isRegistered) revert ReceiverNotRegistered();
        if (bytes(_encryptedContent).length == 0) revert EmptyMessage();
        if (bytes(_encryptedContent).length > 2000) revert MessageTooLong();
        
        unchecked {
            ++_privateMessageCounter;
        }
        
        uint32 timestamp = uint32(block.timestamp);
        
        privateMessages[_privateMessageCounter] = PrivateMessage({
            sender: msg.sender,
            receiver: _receiver,
            encryptedContent: _encryptedContent,
            timestamp: timestamp
        });
        
        // Use unchecked for gas optimization
        unchecked {
            userPrivateMessages[msg.sender].push(_privateMessageCounter);
            userPrivateMessages[_receiver].push(_privateMessageCounter);
        }
        
        emit PrivateMessageSent(_privateMessageCounter, msg.sender, _receiver, timestamp);
    }
    
    // Gas-optimized batch message retrieval
    function getPublicMessages(
        uint256 _offset,
        uint256 _limit
    ) external view returns (
        address[] memory senders,
        string[] memory contents,
        uint32[] memory timestamps
    ) {
        uint256 totalMessages = allPublicMessageIds.length;
        
        if (_offset >= totalMessages) {
            return (new address[](0), new string[](0), new uint32[](0));
        }
        
        uint256 end = _offset + _limit;
        if (end > totalMessages) {
            end = totalMessages;
        }
        
        uint256 length = end - _offset;
        senders = new address[](length);
        contents = new string[](length);
        timestamps = new uint32[](length);
        
        unchecked {
            for (uint256 i = 0; i < length; i++) {
                uint256 messageId = allPublicMessageIds[totalMessages - 1 - (_offset + i)];
                PublicMessage storage message = publicMessages[messageId];
                senders[i] = message.sender;
                contents[i] = message.content;
                timestamps[i] = message.timestamp;
            }
        }
    }
    
    // Gas-optimized private message retrieval
    function getPrivateMessages(
        uint256 _offset,
        uint256 _limit
    ) external view onlyRegistered returns (
        address[] memory senders,
        address[] memory receivers,
        string[] memory encryptedContents,
        uint32[] memory timestamps
    ) {
        uint256[] storage messageIds = userPrivateMessages[msg.sender];
        uint256 totalMessages = messageIds.length;
        
        if (_offset >= totalMessages) {
            return (new address[](0), new address[](0), new string[](0), new uint32[](0));
        }
        
        uint256 end = _offset + _limit;
        if (end > totalMessages) {
            end = totalMessages;
        }
        
        uint256 length = end - _offset;
        senders = new address[](length);
        receivers = new address[](length);
        encryptedContents = new string[](length);
        timestamps = new uint32[](length);
        
        unchecked {
            for (uint256 i = 0; i < length; i++) {
                uint256 messageId = messageIds[totalMessages - 1 - (_offset + i)];
                PrivateMessage storage message = privateMessages[messageId];
                senders[i] = message.sender;
                receivers[i] = message.receiver;
                encryptedContents[i] = message.encryptedContent;
                timestamps[i] = message.timestamp;
            }
        }
    }
    
    // View functions (no gas cost for calls)
    function getUser(address _user) external view returns (User memory) {
        return users[_user];
    }
    
    function getTotalPublicMessages() external view returns (uint256) {
        return allPublicMessageIds.length;
    }
    
    function getTotalPrivateMessages() external view onlyRegistered returns (uint256) {
        return userPrivateMessages[msg.sender].length;
    }
    
    function isUserRegistered(address _user) external view returns (bool) {
        return users[_user].isRegistered;
    }
    
    // Batch operations for further gas savings
    function batchSendPublicMessages(string[] calldata _contents) external onlyRegistered nonReentrant {
        uint256 length = _contents.length;
        if (length > 10) revert MessageTooLong(); // Max 10 messages per batch
        
        unchecked {
            for (uint256 i = 0; i < length; i++) {
                if (bytes(_contents[i]).length == 0) revert EmptyMessage();
                if (bytes(_contents[i]).length > 1000) revert MessageTooLong();
                
                ++_publicMessageCounter;
                uint32 timestamp = uint32(block.timestamp);
                
                publicMessages[_publicMessageCounter] = PublicMessage({
                    sender: msg.sender,
                    content: _contents[i],
                    timestamp: timestamp
                });
                
                allPublicMessageIds.push(_publicMessageCounter);
                emit PublicMessageSent(_publicMessageCounter, msg.sender, timestamp);
            }
        }
    }
}
