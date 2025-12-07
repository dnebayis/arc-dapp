import { useState } from 'react'
import { WagmiProvider, useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { config } from './config/wagmi'
import { ContractDeploy } from './components/ContractDeploy';
import { USDCTransfer } from './components/USDCTransfer';
import { TransactionHistory } from './components/TransactionHistory';
import { NetworkStatus } from './components/NetworkStatus';
import arcLogo from './assets/arc-logo.svg'
import '@rainbow-me/rainbowkit/styles.css'
import './App.css'

const queryClient = new QueryClient()

function AppContent() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'home' | 'deploy' | 'transfer' | 'history'>('home');

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
