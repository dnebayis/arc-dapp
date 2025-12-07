# 🏷 ARC Name Registry - Deployment Guide

## Overview
The ARC Name Registry allows users to register human-readable `.arc` names that resolve to wallet addresses, similar to ENS but built specifically for ARC Network.

---

## 📋 Quick Start

### Option 1: Deploy via Remix IDE (Recommended - Easiest)

1. **Open Remix**
   - Go to https://remix.ethereum.org

2. **Create Contract File**
   - In Remix, create a new file: `ArcNameRegistry.sol`
   - Copy the entire content from `/contracts/ArcNameRegistry.sol`
   - Paste it into Remix

3. **Compile Contract**
   - Press `Ctrl+S` or click the "Solidity Compiler" tab
   - Click "Compile ArcNameRegistry.sol"
   - Ensure compiler version is `0.8.x`
   - Wait for green checkmark

4. **Deploy Contract**
   - Click "Deploy & Run Transactions" tab (left sidebar)
   - In "Environment" dropdown, select **"Injected Provider - MetaMask"**
   - MetaMask will pop up - make sure you're connected to **ARC Testnet**
   - Click **"Deploy"** button (orange)
   - Confirm transaction in MetaMask (~$0.02 USDC for gas)
   - Wait for deployment confirmation

5. **Copy Contract Address**
   - After deployment, you'll see the contract under "Deployed Contracts"
   - Click the copy icon next to the contract address
   - It will look like: `0x1234567890abcdef...`

6. **Update .env File**
   ```bash
   # In your project root, create or edit .env file
   VITE_REGISTRY_ADDRESS=0xYourDeployedContractAddress
   ```

7. **Restart Dev Server**
   ```bash
   npm run dev
   ```

8. **Done!** 🎉
   - The Name Registry and Domain Generator tabs are now active
   - You can register `.arc` names immediately

---

### Option 2: Deploy via Hardhat (Advanced)

If you prefer using Hardhat:

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init
   ```

2. **Configure Hardhat**
   Create `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");

   module.exports = {
     solidity: "0.8.20",
     networks: {
       arcTestnet: {
         url: "https://rpc.testnet.arc.network",
         chainId: 5042002,
         accounts: [process.env.PRIVATE_KEY] // Add your private key to .env
       }
     }
   };
   ```

3. **Create Deployment Script**
   Create `scripts/deploy.js`:
   ```javascript
   async function main() {
     const ArcNameRegistry = await ethers.getContractFactory("ArcNameRegistry");
     const registry = await ArcNameRegistry.deploy();
     await registry.waitForDeployment();
     
     console.log("ArcNameRegistry deployed to:", await registry.getAddress());
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

4. **Deploy**
   ```bash
   npx hardhat run scripts/deploy.js --network arcTestnet
   ```

5. **Update .env**
   ```bash
   VITE_REGISTRY_ADDRESS=<deployed_address>
   ```

---

## 🧪 Testing the Registry

Once deployed, you can test the following features:

### 1. Register a Name
- Go to "Name Registry" tab
- Enter a name (e.g., "alice")
- Click "Check Availability"
- If available, click "Register for 0.1 USDC"
- Confirm transaction in MetaMask

### 2. Generate Names
- Go to "Name Generator" tab
- Select a generation style
- Click "Generate Names"
- System will auto-check availability
- Click "Register" on any available name

### 3. Use .arc Names in Transfers
- Go to "Transfer" tab
- Enter a recipient as: `alice.arc`
- System will automatically resolve to the address
- Complete the transfer

### 4. View Your Name
- Your registered `.arc` name appears in the Name Registry tab
- You can release it anytime to make it available again

---

## 💰 Cost Breakdown

| Action | Gas Cost | USDC Cost |
|--------|----------|-----------|
| Deploy contract | ~2M gas | ~$0.02 |
| Register name | ~100k gas | 0.1 USDC + ~$0.01 gas |
| Transfer name | ~50k gas | ~$0.005 |
| Release name | ~30k gas | ~$0.003 |
| Check availability | 0 (view) | Free |

---

## 🔧 Contract Functions

The deployed contract provides these functions:

### Read Functions (Free)
- `isAvailable(name)` - Check if a name is available
- `resolve(name)` - Get address for a name
- `reverseResolve(address)` - Get name for an address
- `getNameInfo(name)` - Get full details about a name
- `registrationFee()` - Get current registration fee

### Write Functions (Cost Gas)
- `register(name)` - Register a new name (payable)
- `transfer(toAddress)` - Transfer your name to another address
- `release()` - Release your name (make available)
- `setRegistrationFee(newFee)` - Update fee (owner only)
- `withdraw()` - Withdraw collected fees (owner only)

---

## 🐛 Troubleshooting

### "Registry Not Deployed" Message
- Contract hasn't been deployed yet
- Or `VITE_REGISTRY_ADDRESS` not set in `.env`
- Solution: Follow deployment steps above

### "Name already taken" Error
- Someone else registered this name first
- Try a different name or use the generator

### "Insufficient fee" Error
- Your wallet doesn't have enough USDC
- Get testnet USDC from: https://faucet.circle.com/

### Transaction Failed
- Make sure you're on ARC Testnet (Chain ID: 5042002)
- Check you have enough USDC for gas (~$0.02 buffer)
- Name might be invalid (use only a-z, 0-9, hyphen)

### MetaMask Not Connecting
- Refresh page
- Make sure MetaMask is unlocked
- Manually add ARC Testnet to MetaMask if needed

---

## 📊 Verifying the Contract

After deployment, verify on ArcScan:

1. Go to https://testnet.arcscan.app
2. Paste your contract address
3. Click "Verify & Publish"
4. Enter contract details:
   - Compiler: Solidity 0.8.x
   - Optimization: No
   - License: MIT
5. Paste contract code
6. Submit for verification

---

## 🚀 Next Steps

After successful deployment:

1. **Register your first name** - Try registering a name for yourself
2. **Share with friends** - Let others register names too
3. **Use in transfers** - Send USDC using `.arc` names
4. **Monitor usage** - Watch registrations in the explorer

---

## 📞 Support

- **Documentation**: Check the contract code comments
- **Explorer**: https://testnet.arcscan.app
- **ARC Docs**: https://docs.arc.network
- **Faucet**: https://faucet.circle.com (for testnet USDC)

---

## ⚠️ Important Notes

- This is a **testnet deployment** - do not use with real funds
- Names are **case-insensitive** (stored as lowercase)
- Each address can only own **one name** at a time
- Names are **permanent** unless released by owner
- Registration fee goes to contract owner (can be withdrawn)

---

Enjoy your `.arc` naming system! 🎉
