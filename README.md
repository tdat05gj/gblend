# Fluent Messaging DApp

A decentralized messaging application built on Fluent Testnet with encrypted private messaging and public chat functionality.

## Features

- 🔗 **Wallet Connection**: Connect via MetaMask
- 💬 **Public Chat**: Send messages visible to everyone on-chain
- 🔒 **Private Encrypted Messages**: Send encrypted messages only readable by sender and receiver
- 🔐 **End-to-End Encryption**: Messages encrypted with recipient's public key
- 🌐 **Fluent Testnet Integration**: Built specifically for Fluent Testnet
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Network Details

- **Network Name**: Fluent Testnet  
- **RPC URL**: https://rpc.testnet.fluent.xyz/
- **Chain ID**: 20994
- **Symbol**: ETH
- **Explorer**: https://testnet.fluentscan.xyz/
- **Faucet**: https://testnet.gblend.xyz/

## Tech Stack

### Smart Contract
- Solidity ^0.8.19
- OpenZeppelin Contracts
- Hardhat for development

### Frontend
- React 18
- Vite
- Ethers.js v5
- CryptoJS for encryption
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- ETH on Fluent Testnet (get from faucet)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fluent-messaging-dapp
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure MetaMask**:
   - Add Fluent Testnet to MetaMask with the network details above
   - Get test ETH from the faucet: https://testnet.gblend.xyz/

### Deployment

1. **Compile the smart contract**:
   ```bash
   npm run compile
   ```

2. **Deploy to Fluent Testnet**:
   ```bash
   npm run deploy
   ```

3. **Update contract address**:
   After deployment, update the `CONTRACT_ADDRESS` in:
   - `frontend/src/utils/web3.js`

4. **Start the frontend**:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

### Testing

```bash
npm run test
```

## Usage

### First Time Setup

1. **Connect Wallet**: Click "Connect MetaMask" and approve the connection
2. **Add Network**: The app will automatically add Fluent Testnet to MetaMask
3. **Register**: Enter a nickname to register your account on the platform
4. **Get Test ETH**: If you need test ETH, visit the faucet

### Public Chat

- Messages are stored on-chain and visible to everyone
- Anyone can read these messages
- Perfect for general announcements and public discussions

### Private Messages

- Messages are encrypted with the recipient's public key
- Only the sender and receiver can decrypt and read the messages
- Requires the recipient's wallet address
- Messages are stored encrypted on-chain

## Smart Contract Functions

### User Registration
```solidity
function registerUser(string memory _publicKey, string memory _nickname)
```

### Public Messaging
```solidity
function sendPublicMessage(string memory _content)
function getPublicMessages(uint256 _offset, uint256 _limit)
```

### Private Messaging
```solidity
function sendPrivateMessage(address _receiver, string memory _encryptedContent)
function getPrivateMessages(uint256 _offset, uint256 _limit)
```

## Security Features

- **Wallet Authentication**: Users must connect their wallet to participate
- **Message Encryption**: Private messages use cryptographic encryption
- **On-Chain Storage**: All messages are permanently stored on the blockchain
- **Address Validation**: Ensures proper Ethereum address format for recipients

## Limitations & Considerations

- **Demo Encryption**: Current encryption is simplified for demonstration
- **Gas Costs**: Each message requires a transaction fee
- **Message Limits**: Public messages limited to 1000 characters, private to 500
- **Permanent Storage**: Messages cannot be deleted once sent

## Future Improvements

- [ ] Implement proper asymmetric encryption (RSA/ECDH)
- [ ] Add message reactions and replies
- [ ] Implement user profiles and avatars
- [ ] Add file/image sharing capabilities
- [ ] Create message search functionality
- [ ] Add notification system

## Development

### Project Structure

```
fluent-messaging-dapp/
├── contracts/
│   └── FluentMessaging.sol
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── scripts/
│   └── deploy.js
├── hardhat.config.js
└── package.json
```

### Available Scripts

- `npm run compile` - Compile smart contracts
- `npm run deploy` - Deploy to Fluent Testnet
- `npm run test` - Run contract tests
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Built on Fluent Testnet
- Uses OpenZeppelin contracts for security
- Inspired by decentralized communication protocols
