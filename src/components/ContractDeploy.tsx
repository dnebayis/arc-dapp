import { useState } from 'react';
import Web3 from 'web3';
import SimpleStorageArtifact from '../contracts/SimpleStorage.json';

interface ContractDeployProps {
  signer: any;
}

export function ContractDeploy({ signer }: ContractDeployProps) {
  const [deploying, setDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deployContract = async () => {
    if (!signer || !window.ethereum) {
      setError('Please connect your wallet first');
      return;
    }

    setDeploying(true);
    setError(null);
    setDeployedAddress(null);
    setTxHash(null);

    try {
      const web3 = new Web3(window.ethereum);
      
      const artifact = SimpleStorageArtifact;
      const contract = new web3.eth.Contract(artifact.abi as any);

      console.log('Deploying SimpleStorage...');
      
      // Deploy the contract
      const deployTx = contract.deploy({
        data: artifact.bytecode,
        arguments: []
      });

      // Estimate gas
      const gas = await deployTx.estimateGas({ from: signer });
      
      // Send the deployment transaction
      const deployedContract = await deployTx.send({
        from: signer,
        gas: String(gas)
      });

      const address = deployedContract.options.address;
      const txHash = deployedContract.options.address;

      setDeployedAddress(address!);
      setTxHash(txHash!);
      
      console.log('SimpleStorage deployed to:', address);
    } catch (err: any) {
      setError(err.message || 'Deployment failed');
      console.error('Deployment error:', err);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="card">
      <h2>⚙ Deploy Contract</h2>
      
      <button 
        onClick={deployContract} 
        disabled={!signer || deploying}
        className="action-button"
      >
        {deploying ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="loading-spinner"></span>
            Deploying...
          </span>
        ) : '⚙ Deploy Contract'}
      </button>

      

      {deployedAddress && (
        <div className="success-message">
          <p>✓ Contract deployed successfully!</p>
          <div className="contract-info">
            <strong>Address:</strong>
            <code>{deployedAddress}</code>
            <a 
              href={`https://testnet.arcscan.app/address/${deployedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Explorer
            </a>
          </div>
          {txHash && (
            <div className="contract-info">
              <strong>TX Hash:</strong>
              <code className="tx-hash">{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
            </div>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
