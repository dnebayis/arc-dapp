import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { ARC_TESTNET } from '../config';

interface WalletState {
  account: string | null;
  provider: any;
  signer: any;
  balance: string | null;
}

export function WalletConnect({ onConnect }: { onConnect: (state: WalletState) => void }) {
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    provider: null,
    signer: null,
    balance: null
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this dapp');
      }

      // Initialize Web3
      const web3 = new Web3(window.ethereum);

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Check if we're on ARC testnet
      const chainId = await web3.eth.getChainId();
      if (Number(chainId) !== 5042002) {
        // Try to switch to ARC testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ARC_TESTNET.chainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [ARC_TESTNET],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get balance
      const balanceWei = await web3.eth.getBalance(accounts[0]);
      const balanceInUsdc = web3.utils.fromWei(balanceWei, 'ether');

      const state = {
        account: accounts[0],
        provider: web3,
        signer: accounts[0], // In Web3.js, we use the account address directly
        balance: balanceInUsdc
      };

      setWalletState(state);
      onConnect(state);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    const emptyState = {
      account: null,
      provider: null,
      signer: null,
      balance: null
    };
    setWalletState(emptyState);
    onConnect(emptyState);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (walletState.account && accounts[0] !== walletState.account) {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [walletState.account]);

  return (
    <div className="wallet-connect">
      {!walletState.account ? (
        <button 
          onClick={connectWallet} 
          disabled={connecting}
          className="connect-button"
        >
          {connecting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span className="loading-spinner"></span>
              Connecting...
            </span>
          ) : '⛓ Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-info">
          <div className="account-display">
            <span className="address">
              {walletState.account.slice(0, 6)}...{walletState.account.slice(-4)}
            </span>
            <span className="balance">{parseFloat(walletState.balance || '0').toFixed(2)} USDC</span>
          </div>
          <button onClick={disconnectWallet} className="disconnect-button">
            <span>Disconnect</span>
          </button>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
