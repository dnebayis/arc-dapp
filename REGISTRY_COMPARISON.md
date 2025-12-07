# ARC Name Registry Comparison: V1 vs V2 (ENS-Inspired)

## Problem with V1 Contract

After studying the ENS (Ethereum Name Service) architecture on GitHub, several critical issues were identified in the original ArcNameRegistry contract:

### 1. **One Name Per Address Limitation** ❌
```solidity
// V1 - Lines 48-50: Forces users to have only ONE name
if (bytes(ownerToName[msg.sender]).length > 0) {
    _release(ownerToName[msg.sender]);  // Auto-releases old name!
}
```
**Problem**: Users cannot own multiple .arc names simultaneously.

**ENS Approach**: Users can register unlimited names.

### 2. **No Namehash System** ❌
```solidity
// V1 uses plain strings as keys
mapping(string => address) public nameToOwner;  // Inefficient, no subdomain support
```
**Problem**: 
- String keys are gas-inefficient
- No hierarchical namespace support
- Cannot create subdomains (e.g., `api.alice.arc`)

**ENS Approach**: Uses `bytes32 namehash` for efficient lookups and subdomain hierarchy.

### 3. **No Resolver Pattern** ❌
```solidity
// V1 combines everything in one contract
mapping(string => address) public nameToOwner;  // Ownership + Data mixed
```
**Problem**: 
- Cannot extend functionality without redeploying
- All data stored in registry (rigid)
- No separation of concerns

**ENS Approach**: 
- **Registry**: Stores ownership only
- **Resolver**: Stores/resolves data (addresses, text records, avatars, etc.)
- Modular and upgradeable

### 4. **No Reverse Lookup for Multiple Names** ❌
```solidity
// V1 - Only stores ONE name per address
mapping(address => string) public ownerToName;  // Single value only!
```
**Problem**: Cannot query all names owned by an address.

**ENS Approach**: Track all records per owner.

---

## V2 Improvements (ENS-Inspired)

### ✅ 1. Multiple Names Per Address
```solidity
// V2 - Users can own unlimited names
mapping(address => bytes32[]) public ownerToNames;  // Array of all owned names
```

**Benefits**:
- Register `alice.arc`, `alice-dev.arc`, `alice-dao.arc` from same wallet
- No forced releases
- Query all names: `getOwnedNames(address)`

### ✅ 2. Namehash System
```solidity
// V2 - ENS-compatible namehash
function namehash(string memory name) public pure returns (bytes32) {
    bytes32 node = 0x0;
    node = keccak256(abi.encodePacked(node, keccak256(abi.encodePacked("arc"))));
    node = keccak256(abi.encodePacked(node, keccak256(abi.encodePacked(name))));
    return node;
}
```

**Benefits**:
- Gas-efficient `bytes32` storage
- Hierarchical namespace support (future: `api.alice.arc`)
- Compatible with ENS ecosystem tools
- Deterministic hashing

### ✅ 3. Resolver Pattern
```solidity
// V2 - Separates ownership from data
struct Record {
    address owner;      // Who owns the name
    address resolver;   // Where to find data
    uint64 ttl;        // Cache time
}
mapping(bytes32 => Record) records;
```

**Benefits**:
- Registry only stores ownership
- Resolvers can be upgraded without touching registry
- Future-proof: Add new record types (avatars, social profiles, etc.)
- Modular architecture

### ✅ 4. ENS-Compatible Functions
```solidity
// V2 implements ENS standard interface
function owner(bytes32 node) public view returns (address);
function resolver(bytes32 node) public view returns (address);
function setOwner(bytes32 node, address newOwner) public;
function setResolver(bytes32 node, address resolver) public;
function setApprovalForAll(address operator, bool approved) public;
```

**Benefits**:
- Compatible with ENS libraries (ensjs, wagmi, etc.)
- Familiar to Ethereum developers
- Standard events for indexing
- Operator approval system (delegate management)

### ✅ 5. Efficient Multi-Name Tracking
```solidity
// V2 - Fast lookup and removal
mapping(address => bytes32[]) public ownerToNames;           // All owned names
mapping(bytes32 => uint256) private nameIndexInOwner;        // O(1) removal

function _removeNameFromOwner(address owner, bytes32 node) private {
    // Efficient swap-and-pop pattern
}
```

**Benefits**:
- Query all names: `getOwnedNames(0x123...)`
- Count names: `getOwnedNamesCount(0x123...)`
- Gas-efficient removal

---

## Feature Comparison Table

| Feature | V1 (Original) | V2 (ENS-Inspired) |
|---------|---------------|-------------------|
| Multiple names per address | ❌ No (1 only) | ✅ Yes (unlimited) |
| Namehash system | ❌ Plain strings | ✅ bytes32 namehash |
| Resolver pattern | ❌ Monolithic | ✅ Separated |
| Subdomain support | ❌ No | ✅ Ready (future) |
| ENS compatibility | ❌ No | ✅ Yes |
| Get all owned names | ❌ No | ✅ Yes |
| Operator approval | ❌ No | ✅ Yes |
| Gas efficiency | ⚠️ Medium | ✅ High |
| Extensibility | ❌ Limited | ✅ Modular |

---

## Migration Path

### Option 1: Deploy V2 as New Contract
- Deploy `ArcNameRegistryV2.sol`
- Update frontend to use V2
- Keep V1 for historical records
- Users re-register on V2

### Option 2: Data Migration Script
- Deploy V2
- Write migration script to transfer all V1 names to V2
- Snapshot V1 state
- Batch register in V2
- Airdrop names to original owners

### Option 3: Gradual Migration
- Deploy V2
- Support both contracts in UI
- Show V1 names as "legacy"
- Incentivize migration (e.g., free transfer to V2)

---

## Frontend Updates Needed

### 1. Update Contract ABI
```typescript
// Import V2 ABI
import ArcNameRegistryV2 from '../contracts/ArcNameRegistryV2.json';
```

### 2. Handle Multiple Names
```typescript
// Fetch all owned names
const ownedNodes = await contract.methods.getOwnedNames(account).call();

// Display all names
const names = await Promise.all(
  ownedNodes.map(async (node) => {
    // Reverse lookup: node → name (requires indexing or off-chain mapping)
    return { node, owner: await contract.methods.owner(node).call() };
  })
);
```

### 3. Namehash Calculation
```typescript
import { namehash } from '@ensdomains/eth-ens-namehash';

// Generate namehash for registration
const node = namehash(`${name}.arc`);
```

### 4. ArcScan API Updates
```typescript
// Query by namehash instead of plain string
const arcscanUrl = `https://testnet.arcscan.app/api?module=logs&action=getLogs&address=${REGISTRY_ADDRESS}&topic0=${Web3.utils.sha3('Transfer(bytes32,address)')}&topic1=${node}&apikey=${API_KEY}`;
```

---

## Recommendation

**Deploy V2** for the following reasons:

1. ✅ **Future-proof**: Supports growth and new features
2. ✅ **ENS-compatible**: Leverage existing tools and libraries
3. ✅ **Multiple names**: Core user expectation (like owning multiple domains)
4. ✅ **Modular**: Easier to extend and maintain
5. ✅ **Industry standard**: Follows proven ENS architecture

The V1 contract was a great starting point, but V2 aligns with industry standards and provides the flexibility needed for a production naming service.

---

## Next Steps

1. ✅ **Created**: `ArcNameRegistryV2.sol` contract
2. ⏳ **Compile**: Compile V2 contract
3. ⏳ **Test**: Write comprehensive tests
4. ⏳ **Deploy**: Deploy to ARC Testnet
5. ⏳ **Update UI**: Modify frontend to support multiple names
6. ⏳ **Migrate**: Transfer existing V1 names to V2

---

## References

- [ENS Contracts GitHub](https://github.com/ensdomains/ens-contracts)
- [ENS Documentation](https://docs.ens.domains/)
- [ENS Registry Spec (EIP-137)](https://eips.ethereum.org/EIPS/eip-137)
- [ENS Resolver Spec (EIP-181)](https://eips.ethereum.org/EIPS/eip-181)
