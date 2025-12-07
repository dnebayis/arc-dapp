/**
 * ARC Name Registry V2 Deployment Script
 * 
 * Usage: node scripts/deploy.js
 * 
 * This script deploys the ArcNameRegistryV2 contract to ARC Testnet
 */

import Web3 from 'web3';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const RPC_URL = 'https://rpc.testnet.arc.network';
const CHAIN_ID = 5042002;

// IMPORTANT: Add your private key to .env file
// Never commit private keys to git!
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env file');
  console.log('Please add: DEPLOYER_PRIVATE_KEY=your_private_key_here');
  process.exit(1);
}

// Contract bytecode - Read from compiled output  
const bytecodePath = join(__dirname, 'bytecode.txt');
const BYTECODE = '0x' + fs.readFileSync(bytecodePath, 'utf8').trim();

async function deploy() {
  console.log('🚀 Starting ARC Name Registry Deployment...\n');
  
  // Initialize Web3
  const web3 = new Web3(RPC_URL);
  
  // Add account from private key
  const account = web3.eth.accounts.privateKeyToAccount('0x' + PRIVATE_KEY.replace('0x', ''));
  web3.eth.accounts.wallet.add(account);
  
  const deployer = account.address;
  console.log('👤 Deployer Address:', deployer);
  
  // Check balance
  const balance = await web3.eth.getBalance(deployer);
  const balanceUSDC = web3.utils.fromWei(balance, 'ether');
  console.log('💰 Balance:', balanceUSDC, 'USDC');
  
  if (parseFloat(balanceUSDC) < 0.02) {
    console.error('❌ Insufficient balance. Need at least 0.02 USDC for deployment.');
    console.log('Get testnet USDC from: https://faucet.circle.com/');
    process.exit(1);
  }
  
  // Read ABI
  const abiPath = join(__dirname, '..', 'src', 'contracts', 'ArcNameRegistryV2.json');
  const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  
  console.log('\n📋 Contract Info:');
  console.log('   Name: ArcNameRegistryV2');
  console.log('   Network: ARC Network Testnet');
  console.log('   Chain ID:', CHAIN_ID);
  
  // Create contract instance
  const contract = new web3.eth.Contract(artifact.abi);
  
  // Prepare deployment
  const deployTx = contract.deploy({
    data: BYTECODE
  });
  
  // Estimate gas
  console.log('\n⛽ Estimating gas...');
  const gas = await deployTx.estimateGas({ from: deployer });
  const gasPrice = await web3.eth.getGasPrice();
  const gasCost = web3.utils.fromWei((BigInt(gas) * BigInt(gasPrice)).toString(), 'ether');
  
  console.log('   Gas Limit:', gas);
  console.log('   Gas Price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
  console.log('   Estimated Cost:', gasCost, 'USDC');
  
  // Deploy
  console.log('\n🔄 Deploying contract...');
  console.log('   (This may take a few seconds)');
  
  const deployedContract = await deployTx.send({
    from: deployer,
    gas: String(gas),
    gasPrice: String(gasPrice)
  });
  
  const contractAddress = deployedContract.options.address;
  
  console.log('\n✅ DEPLOYMENT SUCCESSFUL!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 Contract Address:', contractAddress);
  console.log('🔗 Explorer:', `https://testnet.arcscan.app/address/${contractAddress}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Update .env file
  const envPath = join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('VITE_REGISTRY_ADDRESS=')) {
    envContent = envContent.replace(/VITE_REGISTRY_ADDRESS=.*/, `VITE_REGISTRY_ADDRESS=${contractAddress}`);
  } else {
    envContent += `\nVITE_REGISTRY_ADDRESS=${contractAddress}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('📝 Updated .env file with contract address');
  console.log('\n🎉 Next Steps:');
  console.log('   1. Restart dev server: npm run dev');
  console.log('   2. Open app in browser');
  console.log('   3. Go to "Name Registry" tab');
  console.log('   4. Register your first .arc name!\n');
  
  return contractAddress;
}

// Run deployment
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment Failed:');
    console.error(error.message);
    process.exit(1);
  });
