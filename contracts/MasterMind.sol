// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MasterMind {
    struct Game {
        uint256 secretNumber;      // 4-digit secret number
        uint256 currentScore;      // Current score (starts at 66)
        uint256[] guesses;         // All guesses made
        string[] hints;            // Hints for each guess
        bool isCompleted;          // Game completion status
        uint256 finalScore;        // Final score achieved
    }
    
    struct PlayerRecord {
        address player;
        uint256 bestScore;
        uint256 totalGames;
        uint256 lastPlayed;
        bool exists;
    }
    
    mapping(address => Game) public currentGames;
    mapping(address => PlayerRecord) public playerRecords;
    address[] public leaderboardPlayers;
    
    address public constant OWNER = 0xD7d59789d24100F878aD187ec6891F3aa1666666;
    uint256 public constant RETRY_FEE = 0.001 ether;  // Fee for playing again
    uint256 public constant STARTING_SCORE = 66;
    uint256 public constant PENALTY_PER_GUESS = 6;
    uint256 public constant MINIMUM_SCORE = 6;
    
    event GameStarted(address indexed player, uint256 gameId);
    event GuessMade(address indexed player, uint256 guess, string hint, uint256 newScore);
    event GameCompleted(address indexed player, uint256 finalScore, uint256 totalGuesses);
    event ScoreSubmitted(address indexed player, uint256 score);
    
    modifier gameInProgress() {
        require(currentGames[msg.sender].secretNumber != 0, "No active game");
        require(!currentGames[msg.sender].isCompleted, "Game already completed");
        _;
    }
    
    modifier noActiveGame() {
        require(currentGames[msg.sender].secretNumber == 0 || currentGames[msg.sender].isCompleted, "Complete current game first");
        _;
    }
    
    function startNewGame() external payable noActiveGame {
        // If player has played before and wants to play again, charge fee
        if (playerRecords[msg.sender].exists && playerRecords[msg.sender].totalGames > 0) {
            require(msg.value >= RETRY_FEE, "Insufficient retry fee");
            // Send fee to owner
            payable(OWNER).transfer(msg.value);
        }
        
        // Generate random 4-digit number (1000-9999)
        uint256 secretNumber = _generateSecretNumber();
        
        // Initialize new game
        currentGames[msg.sender] = Game({
            secretNumber: secretNumber,
            currentScore: STARTING_SCORE,
            guesses: new uint256[](0),
            hints: new string[](0),
            isCompleted: false,
            finalScore: 0
        });
        
        emit GameStarted(msg.sender, secretNumber); // Note: In production, don't emit secret!
    }
    
    function makeGuess(uint256 guess) external gameInProgress {
        require(guess >= 1000 && guess <= 9999, "Guess must be 4-digit number");
        
        Game storage game = currentGames[msg.sender];
        
        // Generate hint
        string memory hint = _generateHint(game.secretNumber, guess);
        
        // Add guess and hint to arrays
        game.guesses.push(guess);
        game.hints.push(hint);
        
        // Check if guess is correct
        if (guess == game.secretNumber) {
            // Game completed successfully
            game.isCompleted = true;
            game.finalScore = game.currentScore;
            
            // Update player record
            _updatePlayerRecord(game.finalScore);
            
            emit GameCompleted(msg.sender, game.finalScore, game.guesses.length);
        } else {
            // Deduct points for wrong guess
            if (game.currentScore > PENALTY_PER_GUESS) {
                game.currentScore -= PENALTY_PER_GUESS;
            } else {
                game.currentScore = MINIMUM_SCORE;
            }
            
            emit GuessMade(msg.sender, guess, hint, game.currentScore);
        }
    }
    
    function _generateSecretNumber() internal view returns (uint256) {
        // Generate pseudo-random 4-digit number
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            block.number
        ))) % 9000 + 1000; // Range: 1000-9999
        
        return randomNumber;
    }
    
    function _generateHint(uint256 secret, uint256 guess) internal pure returns (string memory) {
        // Convert numbers to arrays for comparison
        uint256[4] memory secretDigits = _numberToDigits(secret);
        uint256[4] memory guessDigits = _numberToDigits(guess);
        
        string memory hint = "";
        
        for (uint256 i = 0; i < 4; i++) {
            if (secretDigits[i] == guessDigits[i]) {
                // Correct digit in correct position
                hint = string(abi.encodePacked(hint, _digitToString(secretDigits[i])));
            } else {
                // Wrong digit
                hint = string(abi.encodePacked(hint, "*"));
            }
        }
        
        return hint;
    }
    
    function _numberToDigits(uint256 number) internal pure returns (uint256[4] memory) {
        uint256[4] memory digits;
        digits[0] = number / 1000;           // First digit
        digits[1] = (number / 100) % 10;     // Second digit
        digits[2] = (number / 10) % 10;      // Third digit
        digits[3] = number % 10;             // Fourth digit
        return digits;
    }
    
    function _digitToString(uint256 digit) internal pure returns (string memory) {
        if (digit == 0) return "0";
        if (digit == 1) return "1";
        if (digit == 2) return "2";
        if (digit == 3) return "3";
        if (digit == 4) return "4";
        if (digit == 5) return "5";
        if (digit == 6) return "6";
        if (digit == 7) return "7";
        if (digit == 8) return "8";
        if (digit == 9) return "9";
        return "";
    }
    
    function _updatePlayerRecord(uint256 score) internal {
        PlayerRecord storage record = playerRecords[msg.sender];
        
        if (!record.exists) {
            // First time player
            record.player = msg.sender;
            record.bestScore = score;
            record.totalGames = 1;
            record.lastPlayed = block.timestamp;
            record.exists = true;
            
            // Add to leaderboard
            _insertIntoLeaderboard(msg.sender);
        } else {
            // Existing player
            record.totalGames++;
            record.lastPlayed = block.timestamp;
            
            // Update best score if better
            if (score > record.bestScore) {
                record.bestScore = score;
                
                // Update leaderboard position
                _removeFromLeaderboard(msg.sender);
                _insertIntoLeaderboard(msg.sender);
            }
        }
        
        emit ScoreSubmitted(msg.sender, score);
    }
    
    function _removeFromLeaderboard(address player) internal {
        for (uint256 i = 0; i < leaderboardPlayers.length; i++) {
            if (leaderboardPlayers[i] == player) {
                leaderboardPlayers[i] = leaderboardPlayers[leaderboardPlayers.length - 1];
                leaderboardPlayers.pop();
                break;
            }
        }
    }
    
    function _insertIntoLeaderboard(address player) internal {
        uint256 score = playerRecords[player].bestScore;
        
        // Find correct position (descending order)
        uint256 insertPos = leaderboardPlayers.length;
        for (uint256 i = 0; i < leaderboardPlayers.length; i++) {
            if (score > playerRecords[leaderboardPlayers[i]].bestScore) {
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
        
        // Keep only top 20
        if (leaderboardPlayers.length > 20) {
            leaderboardPlayers.pop();
        }
    }
    
    // View functions
    function getCurrentGame(address player) external view returns (
        uint256 currentScore,
        uint256[] memory guesses,
        string[] memory hints,
        bool isCompleted,
        uint256 finalScore
    ) {
        Game memory game = currentGames[player];
        return (
            game.currentScore,
            game.guesses,
            game.hints,
            game.isCompleted,
            game.finalScore
        );
    }
    
    function getPlayerRecord(address player) external view returns (
        uint256 bestScore,
        uint256 totalGames,
        uint256 lastPlayed,
        bool exists
    ) {
        PlayerRecord memory record = playerRecords[player];
        return (record.bestScore, record.totalGames, record.lastPlayed, record.exists);
    }
    
    function getLeaderboard() external view returns (
        address[] memory players,
        uint256[] memory scores,
        uint256[] memory totalGames
    ) {
        uint256 length = leaderboardPlayers.length;
        players = new address[](length);
        scores = new uint256[](length);
        totalGames = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            address player = leaderboardPlayers[i];
            players[i] = player;
            scores[i] = playerRecords[player].bestScore;
            totalGames[i] = playerRecords[player].totalGames;
        }
        
        return (players, scores, totalGames);
    }
}
