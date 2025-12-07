# 🚀 Quick Start - ARC Name Registry

## Get Your `.arc` Name in 3 Minutes!

---

## Step 1: Deploy the Contract (2 minutes)

### Easy Way: Using Remix IDE

1. **Open Remix**: https://remix.ethereum.org

2. **Create File**: 
   - Click "+" to create new file
   - Name it: `ArcNameRegistry.sol`

3. **Copy Contract Code**:
   - Open `/contracts/ArcNameRegistry.sol` in your project
   - Copy all the code (Ctrl+A, Ctrl+C)
   - Paste into Remix

4. **Compile**:
   - Press `Ctrl+S` or click compile button
   - Wait for green checkmark ✓

5. **Deploy**:
   - Click "Deploy & Run" tab (left sidebar)
   - Select "Injected Provider - MetaMask"
   - **Make sure MetaMask is on ARC Testnet!**
   - Click orange "Deploy" button
   - Confirm in MetaMask (~$0.02 gas)

6. **Copy Address**:
   - After deploy, copy the contract address
   - It looks like: `0x1234567890abcdef...`

---

## Step 2: Configure Your App (30 seconds)

1. **Open `.env` file** in your project root

2. **Add the contract address**:
   ```bash
   VITE_REGISTRY_ADDRESS=0xYourContractAddressHere
   ```
   (Replace with actual address from Step 1)

3. **Restart the dev server**:
   - Stop the server (Ctrl+C)
   - Start again: `npm run dev`

---

## Step 3: Register Your First Name (30 seconds)

1. **Open the App**:
   - Click the preview button or go to http://localhost:5173

2. **Connect Wallet**:
   - Click "Connect Wallet"
   - Approve in MetaMask

3. **Go to Name Registry**:
   - Click 🏷 "Name Registry" in sidebar

4. **Register**:
   - Enter your desired name (e.g., "alice")
   - Click "Check Availability"
   - Click "Register for 0.1 USDC"
   - Confirm in MetaMask

5. **Done!** 🎉
   - You now own `yourname.arc`!

---

## Usage Examples

### Use Your Name in Transfers

1. Go to "Transfer" tab
2. Instead of `0x1234...`, enter `alice.arc`
3. System auto-resolves to address
4. Send USDC/EURC as normal

### Generate Creative Names

1. Go to "Name Generator" tab
2. Select a style (Combo, Prefix, Suffix, Random)
3. Click "Generate Names"
4. Click "Register" on any available name

---

## Troubleshooting

### "Registry Not Deployed" Message
- Make sure you added `VITE_REGISTRY_ADDRESS` to `.env`
- Restart dev server after editing `.env`

### "Insufficient USDC"
- Get testnet USDC: https://faucet.circle.com
- Select "ARC Testnet" and request USDC

### Transaction Fails
- Check you're on ARC Testnet (Chain ID: 5042002)
- Ensure you have ~$0.02 USDC for gas

---

## What You Can Do

✅ Register `.arc` names for 0.1 USDC
✅ Use names instead of addresses in transfers
✅ Generate creative domain names
✅ Transfer names to other addresses
✅ Release names to make them available again

---

## Cost Summary

- **Deploy Contract**: ~$0.02 (one-time)
- **Register Name**: 0.1 USDC + ~$0.01 gas
- **Use Name**: Free (no gas for resolution)
- **Transfer Name**: ~$0.005

---

## Need Help?

- 📖 See `DEPLOYMENT.md` for detailed guide
- 📊 See `ARC_NAME_REGISTRY_SUMMARY.md` for full documentation
- 🔍 Check contract on: https://testnet.arcscan.app
- 💧 Get testnet USDC: https://faucet.circle.com

---

Enjoy your `.arc` name! 🎉