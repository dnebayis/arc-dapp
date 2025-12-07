# Troubleshooting Guide - ARC Name Registry V2

## Issue: Names Show as "unknown.arc"

### Root Cause
The frontend was incorrectly decoding event data from ArcScan API.

### The Problem
```solidity
// Contract event signature:
event NameRegistered(string name, bytes32 indexed node, address indexed owner, uint256 timestamp);
```

**Event Structure:**
- `topics[0]` = Event signature hash
- `topics[1]` = node (indexed)
- `topics[2]` = owner (indexed)
- `data` = name (NOT indexed) + timestamp (NOT indexed)

**Wrong Decoding (caused "unknown"):**
```typescript
// ❌ This was WRONG - tried to decode indexed params from data
const decodedData = web3.eth.abi.decodeParameters(
  ['string', 'bytes32', 'uint256'],  // bytes32 is in topics, not data!
  log.data
);
```

**Correct Decoding:**
```typescript
// ✅ This is CORRECT - only decode non-indexed params from data
const decodedData = web3.eth.abi.decodeParameters(
  ['string', 'uint256'],  // Only name and timestamp are in data
  log.data
);

const name = String(decodedData[0]);
const node = String(log.topics[1]); // Get node from topics!
```

### Solution Applied
Updated [`ArcNameRegistryV2.tsx`](./src/components/ArcNameRegistryV2.tsx) line ~78-88 to:
1. Decode only non-indexed parameters from `data`
2. Extract `node` from `topics[1]`
3. Build a cache mapping `node` → `name`
4. Match owned nodes with cached names

### How to Verify the Fix

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Reload the page**
3. **Check for logs:**
   ```
   Fetching events from: https://testnet.arcscan.app/api?...
   ArcScan response: {status: "1", result: [...]}
   Found 2 registration events
   Processing log: {topics: [...], data: "0x..."}
   Decoded: {name: "alice", node: "0x..."}
   Decoded: {name: "bob", node: "0x..."}
   ```
4. **Verify names display correctly:**
   ```
   Your ARC Names (2):
   
   alice.arc
   Registered: Dec 7, 2025
   
   bob.arc
   Registered: Dec 7, 2025
   ```

### If Names Still Show as "unknown"

#### Check 1: ArcScan API Response
Open console and check the API response:
```javascript
// Should see this in console:
ArcScan response: {
  status: "1",
  result: [
    {
      topics: ["0x...", "0x...", "0x..."],
      data: "0x..."
    }
  ]
}
```

If `status !== "1"` or `result` is empty:
- API key might be invalid
- Events haven't been indexed yet (wait 1-2 minutes)
- Wrong contract address

#### Check 2: Event Decoding
Look for decode errors:
```javascript
// Should NOT see:
Failed to decode event: Error: ...
```

If you see decode errors:
- Event signature might be wrong
- ABI mismatch between contract and frontend

#### Check 3: Node Matching
Check if owned nodes match event nodes:
```javascript
// In console, after page loads:
contract.methods.getOwnedNames(account).call().then(console.log)
// Should return array of bytes32 hashes

// These should match the nodes from events
```

### Manual Fix: Register Names Again

If names are still unknown:
1. Click "Release" on unknown names
2. Register them again with the updated code
3. New registrations will cache names correctly

### Prevention

The fix includes:
- ✅ Immediate local caching when registering
- ✅ Persistent cache across reloads
- ✅ Correct event decoding
- ✅ Debug logging in console

---

## Other Common Issues

### Issue: "Contract Not Found"

**Symptoms:**
```
⚠️ Registry Not Deployed
The ARC Name Registry V2 contract needs to be deployed first.
```

**Solution:**
1. Check `.env` file:
   ```
   VITE_REGISTRY_ADDRESS=0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19
   ```
2. Restart dev server:
   ```bash
   npm run dev
   ```

### Issue: "Name Already Taken"

**Symptoms:**
```
✗ alice.arc is already taken
```

**Possible Causes:**
1. Someone else registered it
2. You registered it with a different wallet
3. You're checking the wrong network

**Solution:**
1. Try a different name
2. Check you're on ARC Testnet (Chain ID: 5042002)
3. Verify contract address in `.env`

### Issue: Transaction Fails

**Symptoms:**
```
Registration failed
User denied transaction signature
```

**Solutions:**
1. **Insufficient balance:**
   ```
   Need: 0.1 USDC + gas
   Get testnet USDC from: https://faucet.circle.com/
   ```

2. **Wrong network:**
   ```
   Switch to ARC Testnet in MetaMask
   Chain ID: 5042002
   RPC: https://rpc.testnet.arc.network
   ```

3. **Gas too low:**
   ```
   Try increasing gas limit in MetaMask
   Recommended: 300,000
   ```

### Issue: Names Not Loading

**Symptoms:**
```
Your ARC Names: (loading forever)
```

**Solutions:**
1. **Check console for errors:**
   ```
   F12 → Console tab
   Look for red errors
   ```

2. **Verify wallet connection:**
   ```
   Disconnect and reconnect wallet
   Refresh page
   ```

3. **Clear cache:**
   ```
   Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

---

## Debug Checklist

When something goes wrong:

- [ ] Open browser console (F12)
- [ ] Check for red errors
- [ ] Verify contract address in `.env`
- [ ] Confirm you're on ARC Testnet
- [ ] Check wallet has USDC balance
- [ ] Try registering a new name
- [ ] Check ArcScan API logs in console
- [ ] Verify event decoding logs
- [ ] Hard reload page (Cmd+Shift+R)
- [ ] Disconnect and reconnect wallet

---

## Event Decoding Reference

### Solidity Event
```solidity
event NameRegistered(
  string name,              // data[0]
  bytes32 indexed node,     // topics[1]
  address indexed owner,    // topics[2]
  uint256 timestamp         // data[1]
);
```

### Topics Structure
```javascript
topics[0] = keccak256("NameRegistered(string,bytes32,address,uint256)")
topics[1] = node (bytes32 - indexed)
topics[2] = owner (address - indexed, padded to 32 bytes)
```

### Data Structure
```javascript
data = abi.encode(name, timestamp)
     = abi.encode(string, uint256)
```

### Decoding Code
```typescript
// Extract from topics
const eventSignature = topics[0];
const node = topics[1];
const owner = topics[2];

// Decode from data
const decoded = web3.eth.abi.decodeParameters(
  ['string', 'uint256'],
  data
);
const name = decoded[0];
const timestamp = decoded[1];
```

---

## Contact & Resources

- **Contract Explorer:** https://testnet.arcscan.app/address/0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19
- **ArcScan API Docs:** https://testnet.arcscan.app/apis
- **ARC Network Docs:** https://docs.arc.network/
- **Web3.js ABI Docs:** https://web3js.readthedocs.io/en/v1.10.0/web3-eth-abi.html

---

**Last Updated:** December 7, 2025  
**Version:** V2.0.1 (Event Decoding Fix)
