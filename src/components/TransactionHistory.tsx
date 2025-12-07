import { useState, useEffect } from 'react';
import Web3 from 'web3';

interface TransactionHistoryProps {
  account: string | null;
  provider: any;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  status: boolean;
  type: string;
  methodId?: string;
}

export function TransactionHistory({ account, provider }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_KEY = import.meta.env.VITE_ARCSCAN_API_KEY;
      const API_URL = 'https://testnet.arcscan.app/api';
      
      // Fetch transactions using ArcScan API (Blockscout-compatible)
      const response = await fetch(
        `${API_URL}?module=account&action=txlist&address=${account}&sort=desc&apikey=${API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && Array.isArray(data.result)) {
        const web3 = new Web3(provider);
        const txList: Transaction[] = data.result.slice(0, 20).map((tx: any) => {
          const gasCostWei = BigInt(tx.gasUsed || '0') * BigInt(tx.gasPrice || '0');
          const gasCostUsdc = web3.utils.fromWei(gasCostWei.toString(), 'ether');
          
          // Determine transaction type
          let txType = 'Transfer';
          const methodId = tx.methodId || tx.input?.slice(0, 10) || '0x';
          
          if (!tx.to || tx.to === '') {
            txType = 'Contract Creation';
          } else if (tx.input && tx.input !== '0x' && tx.input.length > 10) {
            // Contract interaction
            if (methodId === '0xa9059cbb') {
              txType = 'Token Transfer';
            } else if (methodId === '0x095ea7b3') {
              txType = 'Token Approval';
            } else if (methodId === '0x23b872dd') {
              txType = 'Transfer From';
            } else if (methodId === '0x6057361d') {
              txType = 'Store Value';
            } else if (methodId === '0x3590b49f') {
              txType = 'Store Text';
            } else {
              txType = 'Contract Interaction';
            }
          } else if (tx.value && tx.value !== '0') {
            txType = 'USDC Transfer';
          }
          
          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || 'Contract Creation',
            value: web3.utils.fromWei(tx.value || '0', 'ether'),
            gasUsed: gasCostUsdc,
            gasPrice: web3.utils.fromWei(tx.gasPrice || '0', 'gwei'),
            timestamp: parseInt(tx.timeStamp),
            status: tx.isError === '0' || tx.txreceipt_status === '1',
            type: txType,
            methodId: methodId
          };
        });
        
        setTransactions(txList);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
      console.error('Transaction history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && provider) {
      loadTransactions();
    }
  }, [account, provider]);

  return (
    <div className="card">
      <h2>⋮ Transaction History</h2>
      
      <button 
        onClick={loadTransactions} 
        disabled={loading || !account}
        className="action-button secondary"
        style={{ marginBottom: '1rem' }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="loading-spinner"></span>
            Loading...
          </span>
        ) : '↻ Refresh'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {transactions.length > 0 ? (
        <div className="tx-list">
          {transactions.map((tx, index) => (
            <div key={index} className="tx-item">
              <div className="tx-content">
                <div className="tx-main">
                  <span className={`tx-status-badge ${tx.status ? 'success' : 'failed'}`}>
                    {tx.status ? '✓ Success' : '✕ Failed'}
                  </span>
                  <div className="tx-info">
                    <div className="tx-addresses">
                      <span className="tx-value-large">{parseFloat(tx.value).toFixed(4)} USDC</span>
                    </div>
                    <div className="tx-time-small">{new Date(tx.timestamp * 1000).toLocaleString()}</div>
                  </div>
                </div>
                <a 
                  href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link-button"
                >
                  View Details →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="info-box">
          <p>No transactions found for this address.</p>
        </div>
      )}
    </div>
  );
}
