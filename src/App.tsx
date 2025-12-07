import { useState } from 'react'
import { WalletConnect } from './components/WalletConnect';
import { ContractDeploy } from './components/ContractDeploy';
import { USDCTransfer } from './components/USDCTransfer';
import { TransactionHistory } from './components/TransactionHistory';
import { NetworkStatus } from './components/NetworkStatus';
import { ArcNameRegistryV2 } from './components/ArcNameRegistryV2';
import arcLogo from './assets/arc-logo.svg'
import './App.css'

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'deploy' | 'transfer' | 'history' | 'registry'>('home');

  const handleWalletConnect = (state: any) => {
    setAccount(state.account);
    setSigner(state.signer);
  };

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
            {account && (
              <a 
                href="https://faucet.circle.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="faucet-link"
              >
                ◉ Get Testnet USDC
              </a>
            )}
            <WalletConnect onConnect={handleWalletConnect} />
          </div>
        </div>
      </header>

      <main className="app-main">
        {!account ? (
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
                    <div className="feature-card">
                      <span className="feature-icon">🏷</span>
                      <span className="feature-text">Name Registry</span>
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
                  className={`nav-item ${activeTab === 'registry' ? 'active' : ''}`}
                  onClick={() => setActiveTab('registry')}
                >
                  <span className="nav-icon">🏷</span>
                  <span className="nav-label">Name Registry</span>
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
                  <ContractDeploy signer={signer} />
                </div>
              )}

              {activeTab === 'transfer' && (
                <div className="single-view">
                  <USDCTransfer signer={signer} account={account} />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="single-view">
                  <TransactionHistory account={account} provider={window.ethereum} />
                </div>
              )}

              {activeTab === 'registry' && (
                <div className="single-view">
                  <ArcNameRegistryV2 signer={signer} account={account} />
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

export default App
