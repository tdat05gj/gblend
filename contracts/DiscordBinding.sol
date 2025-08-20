// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IGame2048 {
    function getLeaderboard() external view returns (address[] memory players, uint256[] memory scores, uint256[] memory timestamps);
    function getPlayerStats(address player) external view returns (uint256 bestScore, uint256 lastUpdated, bool exists);
}

interface IMasterMind {
    function getLeaderboard() external view returns (address[] memory players, uint256[] memory scores, uint256[] memory totalGames);
    function getPlayerRecord(address player) external view returns (uint256 bestScore, uint256 totalGames, uint256 lastPlayed, bool exists);
}

contract DiscordBinding {
    struct PlayerProfile {
        address wallet;
        string discordUsername;
        uint256 registeredAt;
        bool isRegistered;
    }
    
    // Main mappings
    mapping(address => PlayerProfile) public walletToProfile;
    mapping(string => address) public discordUsernameToWallet;
    mapping(string => bool) public discordUsernameExists;
    
    // Arrays for iteration
    address[] public registeredWallets;
    
    // Game contract addresses
    address public game2048Contract;
    address public masterMindContract;
    
    // Events
    event ProfileRegistered(address indexed wallet, string discordUsername);
    event ProfileUpdated(address indexed wallet, string newDiscordUsername);
    event ContractsUpdated(address game2048, address masterMind);
    
    constructor(address _game2048Contract, address _masterMindContract) {
        game2048Contract = _game2048Contract;
        masterMindContract = _masterMindContract;
    }
    
    // Register Discord username with wallet
    function registerDiscord(string calldata _discordUsername) external {
        require(bytes(_discordUsername).length > 0, "Discord username cannot be empty");
        require(!discordUsernameExists[_discordUsername], "Discord username already registered");
        require(!walletToProfile[msg.sender].isRegistered, "Wallet already registered");
        
        // Create profile
        walletToProfile[msg.sender] = PlayerProfile({
            wallet: msg.sender,
            discordUsername: _discordUsername,
            registeredAt: block.timestamp,
            isRegistered: true
        });
        
        // Update mappings
        discordUsernameToWallet[_discordUsername] = msg.sender;
        discordUsernameExists[_discordUsername] = true;
        registeredWallets.push(msg.sender);
        
        emit ProfileRegistered(msg.sender, _discordUsername);
    }
    
    // Update Discord username
    function updateDiscordUsername(string calldata _newDiscordUsername) external {
        require(walletToProfile[msg.sender].isRegistered, "Wallet not registered");
        require(bytes(_newDiscordUsername).length > 0, "Username cannot be empty");
        require(!discordUsernameExists[_newDiscordUsername], "Username already taken");
        
        // Remove old username from mapping
        string memory oldUsername = walletToProfile[msg.sender].discordUsername;
        discordUsernameExists[oldUsername] = false;
        delete discordUsernameToWallet[oldUsername];
        
        // Set new username
        walletToProfile[msg.sender].discordUsername = _newDiscordUsername;
        discordUsernameToWallet[_newDiscordUsername] = msg.sender;
        discordUsernameExists[_newDiscordUsername] = true;
        
        emit ProfileUpdated(msg.sender, _newDiscordUsername);
    }
    
    // Admin function to update game contracts
    function updateGameContracts(address _game2048Contract, address _masterMindContract) external {
        // Simple admin check - only deployer can update
        require(msg.sender == address(0xD7d59789d24100F878aD187ec6891F3aa1666666), "Only owner can update");
        
        game2048Contract = _game2048Contract;
        masterMindContract = _masterMindContract;
        
        emit ContractsUpdated(_game2048Contract, _masterMindContract);
    }
    
    // Get Game2048 leaderboard with Discord info
    function getGame2048LeaderboardWithDiscord() external view returns (
        address[] memory wallets,
        string[] memory discordUsernames,
        uint256[] memory scores,
        uint256[] memory timestamps
    ) {
        if (game2048Contract == address(0)) {
            return (new address[](0), new string[](0), new uint256[](0), new uint256[](0));
        }
        
        try IGame2048(game2048Contract).getLeaderboard() returns (
            address[] memory players,
            uint256[] memory gameScores,
            uint256[] memory gameTimestamps
        ) {
            uint256 length = players.length;
            wallets = new address[](length);
            discordUsernames = new string[](length);
            scores = new uint256[](length);
            timestamps = new uint256[](length);
            
            for (uint256 i = 0; i < length; i++) {
                wallets[i] = players[i];
                scores[i] = gameScores[i];
                timestamps[i] = gameTimestamps[i];
                
                PlayerProfile memory profile = walletToProfile[players[i]];
                if (profile.isRegistered) {
                    discordUsernames[i] = profile.discordUsername;
                } else {
                    discordUsernames[i] = "Anonymous";
                }
            }
            
            return (wallets, discordUsernames, scores, timestamps);
        } catch {
            return (new address[](0), new string[](0), new uint256[](0), new uint256[](0));
        }
    }
    
    // Get MasterMind leaderboard with Discord info
    function getMasterMindLeaderboardWithDiscord() external view returns (
        address[] memory wallets,
        string[] memory discordUsernames,
        uint256[] memory scores,
        uint256[] memory totalGames
    ) {
        if (masterMindContract == address(0)) {
            return (new address[](0), new string[](0), new uint256[](0), new uint256[](0));
        }
        
        try IMasterMind(masterMindContract).getLeaderboard() returns (
            address[] memory players,
            uint256[] memory gameScores,
            uint256[] memory gamesTotalGames
        ) {
            uint256 length = players.length;
            wallets = new address[](length);
            discordUsernames = new string[](length);
            scores = new uint256[](length);
            totalGames = new uint256[](length);
            
            for (uint256 i = 0; i < length; i++) {
                wallets[i] = players[i];
                scores[i] = gameScores[i];
                totalGames[i] = gamesTotalGames[i];
                
                PlayerProfile memory profile = walletToProfile[players[i]];
                if (profile.isRegistered) {
                    discordUsernames[i] = profile.discordUsername;
                } else {
                    discordUsernames[i] = "Anonymous";
                }
            }
            
            return (wallets, discordUsernames, scores, totalGames);
        } catch {
            return (new address[](0), new string[](0), new uint256[](0), new uint256[](0));
        }
    }
    
    // Get player's Game2048 stats only
    function getPlayerGame2048Stats(address _wallet) external view returns (
        uint256 bestScore,
        uint256 lastUpdated,
        bool exists
    ) {
        if (game2048Contract == address(0)) {
            return (0, 0, false);
        }
        
        try IGame2048(game2048Contract).getPlayerStats(_wallet) returns (
            uint256 score,
            uint256 updated,
            bool playerExists
        ) {
            return (score, updated, playerExists);
        } catch {
            return (0, 0, false);
        }
    }
    
    // Get player's MasterMind stats only
    function getPlayerMasterMindStats(address _wallet) external view returns (
        uint256 bestScore,
        uint256 totalGames,
        uint256 lastPlayed,
        bool exists
    ) {
        if (masterMindContract == address(0)) {
            return (0, 0, 0, false);
        }
        
        try IMasterMind(masterMindContract).getPlayerRecord(_wallet) returns (
            uint256 score,
            uint256 games,
            uint256 played,
            bool playerExists
        ) {
            return (score, games, played, playerExists);
        } catch {
            return (0, 0, 0, false);
        }
    }
    
    // Get player's basic profile (no game stats)
    function getPlayerBasicProfile(address _wallet) external view returns (
        string memory discordUsername,
        uint256 registeredAt,
        bool isRegistered
    ) {
        PlayerProfile memory profile = walletToProfile[_wallet];
        return (
            profile.discordUsername,
            profile.registeredAt,
            profile.isRegistered
        );
    }
    
    // Get Discord info by wallet
    function getDiscordByWallet(address _wallet) external view returns (
        string memory discordUsername,
        bool isRegistered
    ) {
        PlayerProfile memory profile = walletToProfile[_wallet];
        return (profile.discordUsername, profile.isRegistered);
    }
    
    // Get wallet by Discord username
    function getWalletByDiscordUsername(string calldata _discordUsername) external view returns (
        address wallet,
        bool exists
    ) {
        address walletAddr = discordUsernameToWallet[_discordUsername];
        if (walletAddr != address(0)) {
            return (walletAddr, true);
        }
        return (address(0), false);
    }
    
    // Get total registered users count
    function getTotalRegisteredUsers() external view returns (uint256) {
        return registeredWallets.length;
    }
    
    // Get all registered users (paginated)
    function getRegisteredUsers(uint256 _offset, uint256 _limit) external view returns (
        address[] memory wallets,
        string[] memory discordUsernames
    ) {
        uint256 totalUsers = registeredWallets.length;
        
        if (_offset >= totalUsers) {
            return (new address[](0), new string[](0));
        }
        
        uint256 end = _offset + _limit;
        if (end > totalUsers) {
            end = totalUsers;
        }
        
        uint256 resultLength = end - _offset;
        wallets = new address[](resultLength);
        discordUsernames = new string[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            address wallet = registeredWallets[_offset + i];
            PlayerProfile memory profile = walletToProfile[wallet];
            
            wallets[i] = wallet;
            discordUsernames[i] = profile.discordUsername;
        }
        
        return (wallets, discordUsernames);
    }
}
