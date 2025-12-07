import { useState, useEffect } from 'react';
import Web3 from 'web3';

interface USDCTransferProps {
  signer: any;
  account: string | null;
}

// EURC is an ERC20 token on ARC Network
const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
];

export function USDCTransfer({ signer, account }: USDCTransferProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [eurcBalance, setEurcBalance] = useState<string>('0');
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'EURC'>('USDC');

  // Load balances when component mounts or account changes
  const loadBalances = async () => {
    if (!account || !window.ethereum) return;
    
    try {
      const web3 = new Web3(window.ethereum);
      
      // Load USDC balance (native currency)
      const usdcBalanceWei = await web3.eth.getBalance(account);
      const usdcBal = web3.utils.fromWei(usdcBalanceWei, 'ether');
      setUsdcBalance(usdcBal);
      
      // Load EURC balance (ERC20 token)
      const eurcContract = new web3.eth.Contract(ERC20_ABI, EURC_ADDRESS);
      const eurcBalanceRaw = await eurcContract.methods.balanceOf(account).call();
      // EURC uses 6 decimals
      const eurcBal = (Number(eurcBalanceRaw) / 1e6).toString();
      setEurcBalance(eurcBal);
    } catch (err) {
      console.error('Failed to load balances:', err);
    }
  };

  // Load balances on mount and when account changes
  useEffect(() => {
    loadBalances();
  }, [account]);

  // Handle recipient input change
  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    setError(null);
  };

  const sendToken = async () => {
    if (!signer || !recipient || !amount || !window.ethereum) {
      setError('Please fill in all fields');
      return;
    }

    const web3 = new Web3(window.ethereum);
    
    if (!web3.utils.isAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    // Check if user is trying to send too much
    const amountNum = parseFloat(amount);
    const balance = selectedToken === 'USDC' ? parseFloat(usdcBalance) : parseFloat(eurcBalance);
    
    if (amountNum > balance) {
      setError(`Insufficient ${selectedToken} balance`);
      return;
    }

    // For USDC, also check gas fees
    if (selectedToken === 'USDC') {
      if (amountNum >= balance) {
        setError('Amount must be less than your balance to leave room for gas fees (~0.01 USDC)');
        return;
      }
      if (balance - amountNum < 0.02) {
        setError('Please leave at least 0.02 USDC in your wallet for gas fees');
        return;
      }
    }

    setSending(true);
    setError(null);
    setTxHash(null);

    try {
      if (selectedToken === 'USDC') {
        // USDC: Send as native currency (18 decimals)
        const amountInWei = web3.utils.toWei(amount, 'ether');
        
        const receipt = await web3.eth.sendTransaction({
          from: signer,
          to: recipient,
          value: amountInWei
        });
        
        setTxHash(receipt.transactionHash as string);
      } else {
        // EURC: Send as ERC20 token (6 decimals)
        const eurcContract = new web3.eth.Contract(ERC20_ABI, EURC_ADDRESS);
        const amountWithDecimals = Math.floor(parseFloat(amount) * 1e6).toString();
        
        const receipt = await eurcContract.methods.transfer(recipient, amountWithDecimals).send({
          from: signer
        });
        
        setTxHash(receipt.transactionHash as string);
      }

      setRecipient('');
      setAmount('');
      loadBalances(); // Reload balances after transfer
      
      console.log(`${selectedToken} sent successfully!`);
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
      console.error('Transfer error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card">
      <h2>↗ Transfer Tokens</h2>
      <div className="balance-list">
        <div className="balance-item native">
          <div className="balance-header">
            <span className="token-symbol">USDC</span>
          </div>
          <div className="balance-amount">{parseFloat(usdcBalance).toFixed(4)}</div>
        </div>
        <div className="balance-item">
          <div className="balance-header">
            <span className="token-symbol">EURC</span>
            <a
              href={`https://testnet.arcscan.app/address/${EURC_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="token-address-short"
            >
              {EURC_ADDRESS.slice(0, 6)}...{EURC_ADDRESS.slice(-4)}
            </a>
          </div>
          <div className="balance-amount">{parseFloat(eurcBalance).toFixed(4)}</div>
        </div>
      </div>
      
      {/* Token Selector */}
      <div className="token-selector" style={{ marginBottom: '1rem' }}>
        <button
          className={`token-tab ${selectedToken === 'USDC' ? 'active' : ''}`}
          onClick={() => setSelectedToken('USDC')}
        >
          💵 USDC
        </button>
        <button
          className={`token-tab ${selectedToken === 'EURC' ? 'active' : ''}`}
          onClick={() => setSelectedToken('EURC')}
        >
          💶 EURC
        </button>
      </div>
      
      <div className="input-group">
        <label>Recipient Address:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => handleRecipientChange(e.target.value)}
          placeholder="0x..."
          className="input-field"
        />
      </div>

      <div className="input-group">
        <label>Amount ({selectedToken}):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="input-field"
        />
      </div>

      <button 
        onClick={sendToken} 
        disabled={!signer || sending || !recipient || !amount}
        className="action-button"
      >
        {sending ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="loading-spinner"></span>
            Sending...
          </span>
        ) : `↗ Send ${selectedToken}`}
      </button>

      {txHash && (
        <div className="success-message">
          <p>✓ Transfer successful!</p>
          <div className="contract-info">
            <strong>TX Hash:</strong>
            <code className="tx-hash">{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
            <a 
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Explorer
            </a>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="info-box">
        <p><strong>◈ Tips:</strong></p>
        <ul>
          <li>Get testnet tokens from <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">Circle Faucet</a></li>
        </ul>
      </div>
    </div>
  );
}
