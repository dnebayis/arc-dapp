import solc from 'solc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the contract
const contractPath = path.join(__dirname, '..', 'contracts', 'ArcNameRegistryV2.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Prepare input for compiler
const input = {
  language: 'Solidity',
  sources: {
    'ArcNameRegistryV2.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    }
  }
};

console.log('🔨 Compiling ArcNameRegistryV2.sol...');

// Compile
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
  const errors = output.errors.filter(e => e.severity === 'error');
  if (errors.length > 0) {
    console.error('❌ Compilation errors:');
    errors.forEach(err => console.error(err.formattedMessage));
    process.exit(1);
  }
}

// Extract bytecode and ABI
const contract = output.contracts['ArcNameRegistryV2.sol']['ArcNameRegistryV2'];
const bytecode = contract.evm.bytecode.object;
const abi = contract.abi;

// Save bytecode
const outputPath = path.join(__dirname, 'bytecode.txt');
fs.writeFileSync(outputPath, bytecode);

// Save ABI to src/contracts/
const abiPath = path.join(__dirname, '..', 'src', 'contracts', 'ArcNameRegistryV2.json');
fs.writeFileSync(abiPath, JSON.stringify({ abi }, null, 2));

console.log('✅ Compilation successful!');
console.log('📦 Bytecode saved to: scripts/bytecode.txt');
console.log('📄 ABI saved to: src/contracts/ArcNameRegistryV2.json');
console.log('📏 Bytecode length:', bytecode.length / 2, 'bytes');

export { bytecode, abi };
