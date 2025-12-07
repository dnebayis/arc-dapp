# Contract Verification Guide

This guide explains how to verify your ArcNameRegistryV2 contract on ArcScan block explorer.

## Contract Information

- **Contract Address**: `0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19`
- **Contract Name**: `ArcNameRegistryV2`
- **Compiler Version**: Solidity 0.8.20
- **Network**: ARC Testnet

## Why Verify?

✅ Makes your contract source code publicly readable  
✅ Increases trust and transparency  
✅ Allows users to interact directly via block explorer  
✅ Shows contract functions and events clearly  

---

## Method 1: Automated Script (Recommended)

We've created a Node.js script that automatically submits your contract for verification.

### Run the Script:

```bash
node scripts/verify-contract.js
```

### What it does:
1. Reads your contract source code from `contracts/ArcNameRegistryV2.sol`
2. Submits it to ArcScan API with proper compilation settings
3. Returns a GUID (verification identifier)
4. You can check verification status on ArcScan

### Expected Output:
```
🔍 Verifying contract on ArcScan...
📄 Contract: 0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19
📝 Contract Name: ArcNameRegistryV2
⚙️  Compiler: Solidity 0.8.20

✅ Verification submitted successfully!
🔗 GUID: xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx
```

---

## Method 2: Manual Verification via Web UI

If the script doesn't work, you can verify manually on the ArcScan website:

### Steps:

1. **Go to your contract page:**
   ```
   https://testnet.arcscan.app/address/0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19#code
   ```

2. **Click "Verify & Publish"** button

3. **Fill in the form:**
   - **Contract Address**: `0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19` (auto-filled)
   - **Compiler Type**: `Solidity (Single file)`
   - **Compiler Version**: `v0.8.20+commit.a1b79de6`
   - **Open Source License Type**: `MIT License (MIT)`
   - **Optimization**: `No`
   - **Runs**: `200` (default)

4. **Paste Source Code:**
   - Copy entire contents of `contracts/ArcNameRegistryV2.sol`
   - Paste into the "Enter the Solidity Contract Code" field

5. **Constructor Arguments** (if needed):
   - Leave empty (ArcNameRegistryV2 has no constructor arguments)

6. **Click "Verify and Publish"**

---

## Method 3: Using Hardhat (If Available)

If you deployed using Hardhat, you can use the hardhat-verify plugin:

### Install plugin:
```bash
npm install --save-dev @nomiclabs/hardhat-etherscan
```

### Add to `hardhat.config.js`:
```javascript
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  // ... other config
  etherscan: {
    apiKey: {
      arcTestnet: "cfb394f7-0a49-4202-9986-c6f52ebe0744"
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app"
        }
      }
    ]
  }
};
```

### Run verification:
```bash
npx hardhat verify --network arcTestnet 0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19
```

---

## Troubleshooting

### ❌ "Already Verified"
- Your contract is already verified! Check the contract page.

### ❌ "Compilation Failed"
- Double-check compiler version matches exactly
- Ensure source code is complete and valid
- Try without optimization if you didn't use it during deployment

### ❌ "Bytecode Mismatch"
- Ensure you're using the exact same compiler version used for deployment
- Check that optimization settings match
- Verify you're submitting the correct source code

### ❌ "Invalid API Key"
- Check that your ArcScan API key is correct in `.env`
- Get a new key from ArcScan if needed

### ⏳ "Pending Verification"
- Verification can take 1-5 minutes
- Refresh the contract page to see updated status

---

## Checking Verification Status

After submitting, check your contract page:
```
https://testnet.arcscan.app/address/0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19#code
```

**When verified, you'll see:**
- ✅ Green checkmark next to "Contract Source Code Verified"
- Full source code displayed
- "Read Contract" and "Write Contract" tabs
- ABI and bytecode visible

---

## Next Steps After Verification

Once verified, users can:
- 📖 Read all public functions
- ✍️ Write to contract functions directly from ArcScan
- 🔍 See all events and transactions
- 📊 View contract ABI and bytecode
- 🔗 Share readable contract code with community

---

## Support

- **ArcScan Documentation**: https://docs.arc.network
- **Contract Address**: https://testnet.arcscan.app/address/0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19
- **API Key**: Check your `.env` file for `VITE_ARCSCAN_API_KEY`
