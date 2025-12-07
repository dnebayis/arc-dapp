import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONTRACT_ADDRESS = process.env.VITE_REGISTRY_ADDRESS || '0x7F0768f96b2bc1CE19ED27D14c664078BBde3f19';
const ARCSCAN_API_KEY = process.env.VITE_ARCSCAN_API_KEY || 'cfb394f7-0a49-4202-9986-c6f52ebe0744';

// Read contract source code
const contractPath = path.join(__dirname, '../contracts/ArcNameRegistryV2.sol');
const sourceCode = fs.readFileSync(contractPath, 'utf8');

// Verification payload
const verificationData = {
  apikey: ARCSCAN_API_KEY,
  module: 'contract',
  action: 'verifysourcecode',
  contractaddress: CONTRACT_ADDRESS,
  sourceCode: sourceCode,
  codeformat: 'solidity-single-file',
  contractname: 'ArcNameRegistryV2',
  compilerversion: 'v0.8.20+commit.a1b79de6', // Match your Solidity version
  optimizationUsed: '0', // 0 = No, 1 = Yes
  runs: '200',
  constructorArguements: '', // Empty if no constructor arguments
  evmversion: '', // Leave empty for default
  licenseType: '3', // 3 = MIT
};

// Convert to URL-encoded form data
const formData = Object.entries(verificationData)
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join('&');

// Make the API request
const options = {
  hostname: 'testnet.arcscan.app',
  path: '/api',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(formData)
  }
};

console.log('🔍 Verifying contract on ArcScan...');
console.log(`📄 Contract: ${CONTRACT_ADDRESS}`);
console.log(`📝 Contract Name: ArcNameRegistryV2`);
console.log(`⚙️  Compiler: Solidity 0.8.20\n`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📡 Response from ArcScan:');
      console.log(JSON.stringify(response, null, 2));

      if (response.status === '1') {
        console.log('\n✅ Verification submitted successfully!');
        console.log(`🔗 GUID: ${response.result}`);
        console.log('\n⏳ Verification is processing. Check status in a few moments at:');
        console.log(`   https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}#code`);
      } else {
        console.log('\n❌ Verification failed!');
        console.log(`   Error: ${response.result}`);
      }
    } catch (err) {
      console.error('❌ Failed to parse response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(formData);
req.end();
