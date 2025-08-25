// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FeedbackSystem {
    struct Topic {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 timestamp;
        uint256 commentCount;
        bool isActive;
    }

    struct Comment {
        uint256 id;
        uint256 topicId;
        address commenter;
        string content;
        uint256 timestamp;
        bool isActive;
    }

    mapping(uint256 => Topic) public topics;
    mapping(uint256 => Comment) public comments;
    mapping(uint256 => uint256[]) public topicComments; // topicId => commentIds[]
    
    uint256 public nextTopicId = 1;
    uint256 public nextCommentId = 1;
    uint256 public totalTopics = 0;
    uint256 public totalComments = 0;

    event TopicCreated(uint256 indexed topicId, address indexed creator, string title);
    event CommentAdded(uint256 indexed commentId, uint256 indexed topicId, address indexed commenter);

    modifier validTopicId(uint256 _topicId) {
        require(_topicId > 0 && _topicId < nextTopicId, "Invalid topic ID");
        require(topics[_topicId].isActive, "Topic not active");
        _;
    }

    function createTopic(string memory _title, string memory _description) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_title).length <= 100, "Title too long");
        require(bytes(_description).length <= 500, "Description too long");

        uint256 topicId = nextTopicId++;
        
        topics[topicId] = Topic({
            id: topicId,
            creator: msg.sender,
            title: _title,
            description: _description,
            timestamp: block.timestamp,
            commentCount: 0,
            isActive: true
        });

        totalTopics++;
        emit TopicCreated(topicId, msg.sender, _title);
    }

    function addComment(uint256 _topicId, string memory _content) external validTopicId(_topicId) {
        require(bytes(_content).length > 0, "Comment cannot be empty");
        require(bytes(_content).length <= 1000, "Comment too long");

        uint256 commentId = nextCommentId++;
        
        comments[commentId] = Comment({
            id: commentId,
            topicId: _topicId,
            commenter: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            isActive: true
        });

        topicComments[_topicId].push(commentId);
        topics[_topicId].commentCount++;
        totalComments++;

        emit CommentAdded(commentId, _topicId, msg.sender);
    }

    function getAllTopics() external view returns (Topic[] memory) {
        Topic[] memory activeTopics = new Topic[](totalTopics);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextTopicId; i++) {
            if (topics[i].isActive) {
                activeTopics[index] = topics[i];
                index++;
            }
        }
        
        // Resize array to actual size
        Topic[] memory result = new Topic[](index);
        for (uint256 i = 0; i < index; i++) {
            result[i] = activeTopics[i];
        }
        
        return result;
    }

    function getTopicComments(uint256 _topicId) external view validTopicId(_topicId) returns (Comment[] memory) {
        uint256[] memory commentIds = topicComments[_topicId];
        Comment[] memory result = new Comment[](commentIds.length);
        
        uint256 activeCount = 0;
        for (uint256 i = 0; i < commentIds.length; i++) {
            if (comments[commentIds[i]].isActive) {
                result[activeCount] = comments[commentIds[i]];
                activeCount++;
            }
        }
        
        // Resize to actual active comments
        Comment[] memory activeComments = new Comment[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            activeComments[i] = result[i];
        }
        
        return activeComments;
    }

    function getTopic(uint256 _topicId) external view validTopicId(_topicId) returns (Topic memory) {
        return topics[_topicId];
    }

    function getTopicCount() external view returns (uint256) {
        return totalTopics;
    }

    function getCommentCount() external view returns (uint256) {
        return totalComments;
    }

    function getStats() external view returns (uint256 topicCount, uint256 commentCount, uint256 nextTopic, uint256 nextComment) {
        return (totalTopics, totalComments, nextTopicId, nextCommentId);
    }
}
