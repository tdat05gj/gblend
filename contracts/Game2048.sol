// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Game2048 {
    struct PlayerScore {
        address player;
        uint256 bestScore;
        uint256 lastUpdated;
        bool exists;
    }
    
    mapping(address => PlayerScore) public playerScores;
    address[] public leaderboardPlayers;
    
    uint256 public constant ENTRY_FEE = 0.0001 ether;
    uint256 public constant CLAIM_THRESHOLD = 0.1 ether;
    uint256 public totalPool;
    uint256 public entryCount;
    
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    event RewardClaimed(address indexed player, uint256 amount);
    event PoolReset(uint256 timestamp);
    
    function submitScore(uint256 score) external payable {
        require(msg.value >= ENTRY_FEE, "Insufficient entry fee");
        require(score > 0, "Score must be greater than 0");
        
        // Add to pool
        totalPool += msg.value;
        entryCount++;
        
        PlayerScore storage playerScore = playerScores[msg.sender];
        
        // If player doesn't exist or new score is better
        if (!playerScore.exists || score > playerScore.bestScore) {
            // Remove old entry from leaderboard if exists
            if (playerScore.exists) {
                _removeFromLeaderboard(msg.sender);
            } else {
                playerScore.exists = true;
                playerScore.player = msg.sender;
            }
            
            // Update score
            playerScore.bestScore = score;
            playerScore.lastUpdated = block.timestamp;
            
            // Add to leaderboard in correct position
            _insertIntoLeaderboard(msg.sender);
        }
        
        emit ScoreSubmitted(msg.sender, score, block.timestamp);
    }
    
    function _removeFromLeaderboard(address player) internal {
        for (uint256 i = 0; i < leaderboardPlayers.length; i++) {
            if (leaderboardPlayers[i] == player) {
                // Move last element to current position and pop
                leaderboardPlayers[i] = leaderboardPlayers[leaderboardPlayers.length - 1];
                leaderboardPlayers.pop();
                break;
            }
        }
    }
    
    function _insertIntoLeaderboard(address player) internal {
        uint256 score = playerScores[player].bestScore;
        
        // Find correct position (descending order)
        uint256 insertPos = leaderboardPlayers.length;
        for (uint256 i = 0; i < leaderboardPlayers.length; i++) {
            if (score > playerScores[leaderboardPlayers[i]].bestScore) {
                insertPos = i;
                break;
            }
        }
        
        // Insert at position
        leaderboardPlayers.push(address(0));
        for (uint256 i = leaderboardPlayers.length - 1; i > insertPos; i--) {
            leaderboardPlayers[i] = leaderboardPlayers[i - 1];
        }
        leaderboardPlayers[insertPos] = player;
        
        // Keep only top 10
        if (leaderboardPlayers.length > 10) {
            leaderboardPlayers.pop();
        }
    }
    
    function claimReward() external {
        require(totalPool >= CLAIM_THRESHOLD, "Pool threshold not reached");
        require(leaderboardPlayers.length > 0, "No players in leaderboard");
        require(leaderboardPlayers[0] == msg.sender, "Only top player can claim");
        
        uint256 reward = totalPool;
        totalPool = 0;
        entryCount = 0;
        
        // Reset leaderboard
        delete leaderboardPlayers;
        
        // Clear all player scores
        for (uint256 i = 0; i < leaderboardPlayers.length; i++) {
            address player = leaderboardPlayers[i];
            delete playerScores[player];
        }
        
        payable(msg.sender).transfer(reward);
        
        emit RewardClaimed(msg.sender, reward);
        emit PoolReset(block.timestamp);
    }
    
    function getLeaderboard() external view returns (address[] memory players, uint256[] memory scores, uint256[] memory timestamps) {
        uint256 length = leaderboardPlayers.length;
        players = new address[](length);
        scores = new uint256[](length);
        timestamps = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            address player = leaderboardPlayers[i];
            players[i] = player;
            scores[i] = playerScores[player].bestScore;
            timestamps[i] = playerScores[player].lastUpdated;
        }
        
        return (players, scores, timestamps);
    }
    
    function getPlayerStats(address player) external view returns (uint256 bestScore, uint256 lastUpdated, bool exists) {
        PlayerScore memory playerScore = playerScores[player];
        return (playerScore.bestScore, playerScore.lastUpdated, playerScore.exists);
    }
    
    function getPoolInfo() external view returns (uint256 currentPool, uint256 threshold, bool canClaim, address topPlayer) {
        address top = leaderboardPlayers.length > 0 ? leaderboardPlayers[0] : address(0);
        return (totalPool, CLAIM_THRESHOLD, totalPool >= CLAIM_THRESHOLD && top != address(0), top);
    }
}
