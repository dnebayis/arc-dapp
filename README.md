# ArcHub — ARC Network dApp

A streamlined dApp for ARC Testnet: connect wallet, deploy contracts, transfer USDC, view transactions, and register simple `.arc` domains.

![ARC Network](https://img.shields.io/badge/ARC-Network-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-2.0-purple)

## ✨ Features

- 🔗 **Wallet Connection** - Seamless MetaMask integration
- ⚙️ **Contract Deployment** - Deploy smart contracts instantly
- 💸 **USDC Transfers** - Send USDC with sub-second finality
- 📊 **Transaction History** - Track all your on-chain activity
- ⚡ **Real-time Updates** - Live network status and balance
- ◈ **Arc Domains (MVP)** - Register labels like `alice.arc` on our minimal registry

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
# - VITE_REGISTRY_ADDRESS: Address of deployed ArcNameRegistryV3

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🌐 Network Configuration

### ARC Testnet
- **Chain ID:** 5042002
- **RPC URL:** https://rpc.testnet.arc.network
- **Currency:** USDC (native gas token)
- **Explorer:** https://testnet.arcscan.app
- **Faucet:** https://faucet.circle.com/

## 📁 Project Structure

```
arc-dapp/
├── contracts/              # Solidity smart contracts
│   ├── SimpleStorage.sol
│   └── ArcNameRegistryV3.sol
├── src/
│   ├── components/         # React components
│   │   ├── WalletConnect.tsx
│   │   ├── ContractDeploy.tsx
│   │   ├── USDCTransfer.tsx
│   │   ├── TransactionHistory.tsx
│   │   ├── NetworkStatus.tsx
│   │   └── ArcDomains.tsx
│   ├── contracts/          # Contract ABIs
│   ├── assets/             # Static assets
│   └── config/             # Network configuration
├── scripts/                # Deployment scripts
│   ├── compile.js
│   └── deploy.js
└── public/                 # Public assets
```

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Blockchain:** Web3.js
- **Styling:** CSS3 (Custom)
- **Network:** ARC Testnet (EVM-compatible)

## ◈ Arc Domains (MVP)

Minimal registry with owner, address record, and text record storage. The Domains tab UI is simplified to: enter label → check availability → register.

### Deploy Registry (ArcNameRegistryV3)

```bash
# Compile contract (writes ABI to src/contracts/ArcNameRegistryV3.json)
node scripts/compile.js

# Deploy with USDC-native gas (requires funded deployer)
# Set PRIVATE_KEY env var or .env DEPLOYER_PRIVATE_KEY
node scripts/deploy.js

# Update the app to use the new address
echo "VITE_REGISTRY_ADDRESS=0x..." >> .env
```

After deployment, restart dev server and use the Domains tab.

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
- [x] Arc Domains MVP (registry + simple UI)
- [x] USDC-native deploy script with gas estimation
- [ ] Domain record management UI (addr/text)
- [ ] Commit–reveal registration flow
- [ ] Pricing, expiry, and renewals
- [ ] Subdomain support (`sub.alice.arc`)
- [ ] Resolver integration and richer records
- [ ] Domain search and profile pages
- [ ] Unit/integration tests and CI
- [ ] Contract verification tooling
- [ ] Bundle size optimization and code splitting
- [ ] Multi-chain support

---

**Built by 0xshawtyy for the ARC Network community**
