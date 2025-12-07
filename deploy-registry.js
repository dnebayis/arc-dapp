/**
 * Deployment script for ArcNameRegistry contract
 * 
 * Usage:
 *   node deploy-registry.js
 * 
 * Requirements:
 *   - MetaMask connected to ARC Testnet
 *   - USDC for gas fees
 *   - Web3.js installed
 */

import Web3 from 'web3';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the contract
const contractPath = join(__dirname, 'contracts', 'ArcNameRegistry.sol');
console.log('📄 Reading contract from:', contractPath);

// For deployment, you'll need the compiled bytecode
// This script assumes you have the bytecode from Remix or another compiler
console.log(`
╔════════════════════════════════════════════════════════════════╗
║         ARC Name Registry Deployment Script                    ║
╚════════════════════════════════════════════════════════════════╝

📋 Deployment Steps:

1. Compile the contract:
   - Open contracts/ArcNameRegistry.sol in Remix IDE
   - Or use: npx hardhat compile
   
2. Get the bytecode from compilation output

3. Update this script with the bytecode

4. Run: node deploy-registry.js

═══════════════════════════════════════════════════════════════

Alternative: Deploy via Remix IDE

1. Go to https://remix.ethereum.org
2. Create new file: ArcNameRegistry.sol
3. Copy contract code from contracts/ArcNameRegistry.sol
4. Compile (Ctrl+S)
5. Switch to "Deploy & Run Transactions" tab
6. Select "Injected Provider - MetaMask"
7. Ensure MetaMask is on ARC Testnet
8. Click "Deploy"
9. Copy deployed contract address
10. Add to .env file:
    VITE_REGISTRY_ADDRESS=0xYourContractAddress

═══════════════════════════════════════════════════════════════
`);

// Example deployment function (requires bytecode)
async function deployContract() {
  if (!window.ethereum) {
    console.error('❌ MetaMask not found. Please install MetaMask.');
    return;
  }

  const web3 = new Web3(window.ethereum);
  
  // Request account access
  const accounts = await web3.eth.requestAccounts();
  const deployer = accounts[0];
  
  console.log('👤 Deploying from:', deployer);
  
  // Read ABI
  const abiPath = join(__dirname, 'src', 'contracts', 'ArcNameRegistry.json');
  const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  
  // TODO: Add bytecode here after compilation
  const bytecode = '0x...'; // Replace with actual bytecode
  
  if (bytecode === '0x...') {
    console.log('⚠️  Please compile the contract first and add the bytecode to this script.');
    return;
  }
  
  const contract = new web3.eth.Contract(artifact.abi);
  
  const deployTx = contract.deploy({
    data: bytecode
  });
  
  const gas = await deployTx.estimateGas({ from: deployer });
  const gasPrice = await web3.eth.getGasPrice();
  
  console.log('⛽ Estimated gas:', gas);
  console.log('💰 Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
  
  console.log('🚀 Deploying contract...');
  
  const deployedContract = await deployTx.send({
    from: deployer,
    gas: String(gas)
  });
  
  const address = deployedContract.options.address;
  
  console.log('✅ Contract deployed at:', address);
  console.log('🔗 View on Explorer:', `https://testnet.arcscan.app/address/${address}`);
  console.log('');
  console.log('📝 Add this to your .env file:');
  console.log(`VITE_REGISTRY_ADDRESS=${address}`);
  
  return address;
}

// Export for use
export { deployContract };
