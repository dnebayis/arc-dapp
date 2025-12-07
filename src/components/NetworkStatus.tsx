import { useState, useEffect } from 'react';
import Web3 from 'web3';

interface NetworkStatusProps {
  provider: any;
}

export function NetworkStatus({ provider }: NetworkStatusProps) {
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [blockTime, setBlockTime] = useState<number>(0);
  const [gasPrice, setGasPrice] = useState<string>('0');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchNetworkStats = async () => {
    if (!provider) return;

    try {
      const web3 = new Web3(provider);
      
      // Get current block number
      const currentBlock = await web3.eth.getBlockNumber();
      setBlockNumber(Number(currentBlock));

      // Get current block and previous block to calculate block time
      const block = await web3.eth.getBlock(currentBlock);
      const prevBlock = await web3.eth.getBlock(Number(currentBlock) - 1);
      
      if (block && prevBlock) {
        const timeDiff = Number(block.timestamp) - Number(prevBlock.timestamp);
        setBlockTime(timeDiff);
      }

      // Get current gas price
      const currentGasPrice = await web3.eth.getGasPrice();
      const gasPriceUsdc = web3.utils.fromWei(currentGasPrice, 'ether');
      setGasPrice(gasPriceUsdc);

      // Check connection
      const connected = await web3.eth.net.isListening();
      setIsConnected(connected);

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Network status error:', err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (!provider) return;
    
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [provider]);

  return (
    <div className="card network-status">
      <h2>◈ Network Status</h2>
      
      <div className="status-grid">
        <div className="status-item">
          <div className="status-icon">⛓</div>
          <div className="status-info">
            <span className="status-label">Latest Block</span>
            <span className="status-value">#{blockNumber.toLocaleString()}</span>
          </div>
        </div>

        <div className="status-item">
          <div className="status-icon">⚡︎</div>
          <div className="status-info">
            <span className="status-label">Block Time</span>
            <span className="status-value">{blockTime}s</span>
          </div>
        </div>

        <div className="status-item">
          <div className="status-icon">◈</div>
          <div className="status-info">
            <span className="status-label">Gas Price</span>
            <span className="status-value">${parseFloat(gasPrice).toFixed(6)}</span>
          </div>
        </div>

        <div className="status-item">
          <div className="status-icon">{isConnected ? '✓' : '✕'}</div>
          <div className="status-info">
            <span className="status-label">Network</span>
            <span className={`status-value ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="network-footer">
        <span className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
        <button 
          onClick={fetchNetworkStats} 
          className="refresh-btn"
          disabled={!provider}
        >
          ↻
        </button>
      </div>
    </div>
  );
}
