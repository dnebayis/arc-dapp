import { useState } from 'react'
import { WagmiProvider, useAccount, useSwitchChain } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { config } from './config/wagmi'
import { ContractDeploy } from './components/ContractDeploy';
import { USDCTransfer } from './components/USDCTransfer';
import { TransactionHistory } from './components/TransactionHistory';
import { NetworkStatus } from './components/NetworkStatus';
import ArcDomains from './components/ArcDomains';
import ArcDomainsPro from './components/ArcDomainsPro';
import arcLogo from './assets/arc-logo.svg'
import { ARC_TESTNET } from './config/index'
import { arcTestnet } from './config/wagmi'
import '@rainbow-me/rainbowkit/styles.css'
import './App.css'

const queryClient = new QueryClient()

function AppContent() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'home' | 'deploy' | 'transfer' | 'history' | 'domains' | 'domainsPro'>('home');
  const [networkAddFailed, setNetworkAddFailed] = useState(false)
  const { switchChain } = useSwitchChain()
  const dappUrl = typeof window !== 'undefined' ? window.location.href : ''
  const metamaskDeepLink = dappUrl ? `https://metamask.app.link/dapp/${encodeURIComponent(dappUrl)}` : ''
  const metamaskAddNetworkLink = `https://metamask.app.link/addNetwork?rpcUrl=${encodeURIComponent('https://rpc.testnet.arc.network')}&chainId=5042002&chainName=${encodeURIComponent('Arc Network Testnet')}&symbol=${encodeURIComponent('USDC')}&blockExplorerUrl=${encodeURIComponent('https://testnet.arcscan.app')}`

  const addArcNetwork = async () => {
    try {
      await switchChain({ chainId: arcTestnet.id })
      setNetworkAddFailed(false)
      return
    } catch {
      try {
        const eth = (window as any).ethereum
        if (!eth) throw new Error('no provider')
        await eth.request({ method: 'wallet_addEthereumChain', params: [ARC_TESTNET] })
        setNetworkAddFailed(false)
        return
      } catch {
        setNetworkAddFailed(true)
      }
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>
              <img src={arcLogo} alt="ARC Logo" className="arc-logo" />
              ArcHub
            </h1>
            <p className="tagline">Your Gateway to ARC Network</p>
          </div>
          <div className="header-right">
            <button 
              onClick={addArcNetwork}
              className="faucet-link"
            >
              ＋ Add Arc Network
            </button>
            <a 
              href="https://faucet.circle.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="faucet-link"
            >
              ◉ Get Testnet USDC
            </a>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="app-main">
        {networkAddFailed && (
          <div className="info-box">
            <p>Unable to add network automatically. Add it manually in your wallet:</p>
            <ul>
              <li>Name: Arc Network Testnet</li>
              <li>RPC: <code>https://rpc.testnet.arc.network</code></li>
              <li>Chain ID: <code>5042002</code></li>
              <li>Currency: <code>USDC</code></li>
              <li>Explorer: <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer">https://testnet.arcscan.app</a></li>
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {metamaskDeepLink && (
                <a href={metamaskDeepLink} target="_blank" rel="noopener noreferrer" className="faucet-link">Open in MetaMask</a>
              )}
              <a href={metamaskAddNetworkLink} target="_blank" rel="noopener noreferrer" className="faucet-link">MetaMask Add Network</a>
            </div>
          </div>
        )}
        {!isConnected ? (
          <div className="welcome-section">
            <div className="welcome-hero">
              <div className="hero-content">
                <div className="hero-left">
                  <h2 className="hero-title">Welcome to ArcHub</h2>
                  <p className="hero-subtitle">Your Gateway to ARC Network</p>
                  <p className="connect-message">Connect your wallet to get started</p>
                </div>
                <div className="hero-right">
                  <div className="hero-features">
                    <div className="feature-card">
                      <span className="feature-icon">⚙️</span>
                      <span className="feature-text">Deploy Contracts</span>
                    </div>
                    <div className="feature-card">
                      <span className="feature-icon">↗</span>
                      <span className="feature-text">Transfer Tokens</span>
                    </div>
                    <div className="feature-card">
                      <span className="feature-icon">⚡︎</span>
                      <span className="feature-text">Sub-Second Finality</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="app-container">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
              <nav className="sidebar-nav">
                <button 
                  className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => setActiveTab('home')}
                >
                  <span className="nav-icon">◆</span>
                  <span className="nav-label">Home</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === 'deploy' ? 'active' : ''}`}
                  onClick={() => setActiveTab('deploy')}
                >
                  <span className="nav-icon">⚙</span>
                  <span className="nav-label">Deploy Contract</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === 'transfer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transfer')}
                >
                  <span className="nav-icon">↗</span>
                  <span className="nav-label">Transfer</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <span className="nav-icon">⋮</span>
                  <span className="nav-label">Transactions</span>
                </button>
              <button 
                className={`nav-item ${activeTab === 'domains' ? 'active' : ''}`}
                onClick={() => setActiveTab('domains')}
              >
                <span className="nav-icon">◈</span>
                <span className="nav-label">Domains</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'domainsPro' ? 'active' : ''}`}
                onClick={() => setActiveTab('domainsPro')}
              >
                <span className="nav-icon">◇</span>
                <span className="nav-label">Domains Pro</span>
              </button>
              </nav>
            </aside>

            {/* Main Content Area */}
            <div className="content-area">
              {activeTab === 'home' && (
                <div className="full-width-section">
                  <NetworkStatus provider={window.ethereum} />
                </div>
              )}

              {activeTab === 'deploy' && (
                <div className="single-view">
                  <ContractDeploy signer={address || null} />
                </div>
              )}

              {activeTab === 'transfer' && (
                <div className="single-view">
                  <USDCTransfer signer={address || null} account={address || null} />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="single-view">
                  <TransactionHistory account={address || null} provider={window.ethereum} />
                </div>
              )}

              {activeTab === 'domains' && (
                <div className="single-view">
                  <ArcDomains account={address || null} />
                </div>
              )}

              {activeTab === 'domainsPro' && (
                <div className="single-view">
                  <ArcDomainsPro account={address || null} />
                </div>
              )}


            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built by <a href="https://x.com/0xshawtyy" target="_blank" rel="noopener noreferrer" className="twitter-link">0xshawtyy</a> - <a href="https://www.arc.network/" target="_blank" rel="noopener noreferrer">Arc Network</a>
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
