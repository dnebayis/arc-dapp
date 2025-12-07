# ArcHub - Your Gateway to ARC Network

A modern, feature-rich dApp for interacting with the ARC Network testnet. Deploy contracts and transfer USDC!

![ARC Network](https://img.shields.io/badge/ARC-Network-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-2.0-purple)

## ✨ Features

- 🔗 **Wallet Connection** - Seamless MetaMask integration
- ⚙️ **Contract Deployment** - Deploy smart contracts instantly
- 💸 **USDC Transfers** - Send USDC with sub-second finality
- 📊 **Transaction History** - Track all your on-chain activity
- ⚡ **Real-time Updates** - Live network status and balance

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- MetaMask browser extension
- ARC Testnet USDC ([Get from faucet](https://faucet.circle.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/arc-dapp.git
cd arc-dapp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your configuration
# - VITE_ARCSCAN_API_KEY: Get from https://testnet.arcscan.app

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🌐 Network Configuration

### ARC Testnet
- **Chain ID:** 5042002
- **RPC URL:** https://rpc.testnet.arc.network
- **Currency:** USDC (used for gas fees)
- **Explorer:** https://testnet.arcscan.app
- **Faucet:** https://faucet.circle.com/

## 📁 Project Structure

```
arc-dapp/
├── contracts/              # Solidity smart contracts
│   └── SimpleStorage.sol
├── src/
│   ├── components/         # React components
│   │   ├── WalletConnect.tsx
│   │   ├── ContractDeploy.tsx
│   │   ├── USDCTransfer.tsx
│   │   ├── TransactionHistory.tsx
│   │   └── NetworkStatus.tsx
│   ├── contracts/          # Contract ABIs
│   ├── assets/             # Static assets
│   └── config.ts           # Network configuration
├── scripts/                # Deployment scripts
│   └── compile.js
└── public/                 # Public assets
```

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Blockchain:** Web3.js
- **Styling:** CSS3 (Custom)
- **Network:** ARC Testnet (EVM-compatible)

## 📚 Documentation

- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and fixes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ARC Network](https://www.arc.network/) - The blockchain platform
- [Circle](https://www.circle.com/) - USDC infrastructure
- Built by [@0xshawtyy](https://x.com/0xshawtyy)

## 📞 Support

- **Twitter:** [@0xshawtyy](https://x.com/0xshawtyy)
- **ARC Network:** [Official Website](https://www.arc.network/)
- **Issues:** [GitHub Issues](https://github.com/yourusername/arc-dapp/issues)

## 🎯 Roadmap

- [x] Basic wallet connection
- [x] Contract deployment
- [x] USDC transfers
- [x] Transaction history
- [ ] Subdomain support
- [ ] Custom resolvers
- [ ] Name marketplace
- [ ] Multi-chain support

---

**Made with 0xshawtyy for the ARC Network community**
