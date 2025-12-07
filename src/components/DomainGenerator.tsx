import { useState } from 'react';
import Web3 from 'web3';
import ArcNameRegistryArtifact from '../contracts/ArcNameRegistry.json';

interface DomainGeneratorProps {
  signer: any;
  account: string | null;
}

interface DomainSuggestion {
  name: string;
  available: boolean | null;
  checking: boolean;
}

const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || '';

// Word lists for generation
const WORD_LISTS = {
  adjectives: [
    'swift', 'quantum', 'stellar', 'nova', 'arc', 'crypto', 'defi', 'ultra', 'mega',
    'pro', 'smart', 'rapid', 'flash', 'prime', 'solid', 'pure', 'bright', 'clear',
    'fast', 'safe', 'true', 'core', 'zen', 'flux', 'volt', 'neon', 'iron', 'blue'
  ],
  nouns: [
    'pay', 'vault', 'chain', 'hub', 'dao', 'wallet', 'finance', 'coin', 'token',
    'protocol', 'lab', 'network', 'cash', 'fund', 'bank', 'swap', 'trade', 'node',
    'link', 'bridge', 'portal', 'stack', 'pool', 'zone', 'spot', 'base', 'forge'
  ],
  crypto: [
    'btc', 'eth', 'defi', 'web3', 'nft', 'dao', 'dex', 'cefi', 'stablecoin',
    'hodl', 'moon', 'gem', 'alpha', 'beta', 'gwei', 'gas', 'stake', 'yield'
  ]
};

export function DomainGenerator({ signer, account }: DomainGeneratorProps) {
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'combo' | 'prefix' | 'suffix' | 'random'>('combo');

  // Generate domain names
  const generateNames = () => {
    setGenerating(true);
    const generated: DomainSuggestion[] = [];
    const count = 10;

    for (let i = 0; i < count; i++) {
      let name = '';

      switch (selectedStyle) {
        case 'combo':
          // Adjective + Noun
          const adj = WORD_LISTS.adjectives[Math.floor(Math.random() * WORD_LISTS.adjectives.length)];
          const noun = WORD_LISTS.nouns[Math.floor(Math.random() * WORD_LISTS.nouns.length)];
          name = `${adj}${noun}`;
          break;

        case 'prefix':
          // Word + Crypto term
          const word1 = WORD_LISTS.nouns[Math.floor(Math.random() * WORD_LISTS.nouns.length)];
          const prefix = WORD_LISTS.crypto[Math.floor(Math.random() * WORD_LISTS.crypto.length)];
          name = `${prefix}${word1}`;
          break;

        case 'suffix':
          // Crypto term + fi/hub/pay/dao
          const crypto = WORD_LISTS.crypto[Math.floor(Math.random() * WORD_LISTS.crypto.length)];
          const suffixes = ['fi', 'hub', 'pay', 'dao', 'swap'];
          const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          name = `${crypto}${suffix}`;
          break;

        case 'random':
          // Mix of all
          const allWords = [...WORD_LISTS.adjectives, ...WORD_LISTS.nouns, ...WORD_LISTS.crypto];
          const word1Random = allWords[Math.floor(Math.random() * allWords.length)];
          const word2Random = allWords[Math.floor(Math.random() * allWords.length)];
          name = `${word1Random}${word2Random}`;
          break;
      }

      // If keyword provided, try to incorporate it
      if (keyword && Math.random() > 0.5) {
        const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKeyword) {
          const randomWord = WORD_LISTS.adjectives[Math.floor(Math.random() * WORD_LISTS.adjectives.length)];
          name = Math.random() > 0.5 ? `${cleanKeyword}${randomWord}` : `${randomWord}${cleanKeyword}`;
        }
      }

      // Ensure uniqueness in current batch
      if (!generated.find(g => g.name === name)) {
        generated.push({
          name,
          available: null,
          checking: false
        });
      }
    }

    setSuggestions(generated);
    setGenerating(false);

    // Auto-check availability
    checkAllAvailability(generated);
  };

  // Check availability for all generated names
  const checkAllAvailability = async (domains: DomainSuggestion[]) => {
    if (!window.ethereum || !REGISTRY_ADDRESS) return;

    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(ArcNameRegistryArtifact.abi as any, REGISTRY_ADDRESS);

    // Mark all as checking
    setSuggestions(prev => prev.map(d => ({ ...d, checking: true })));

    // Check each domain
    const results = await Promise.all(
      domains.map(async (domain) => {
        try {
          const available = await contract.methods.isAvailable(domain.name).call();
          return {
            ...domain,
            available: Boolean(available),
            checking: false
          };
        } catch (err) {
          console.error(`Failed to check ${domain.name}:`, err);
          return {
            ...domain,
            available: null,
            checking: false
          };
        }
      })
    );

    setSuggestions(results);
  };

  // Register a specific name
  const registerName = async (name: string) => {
    if (!signer || !window.ethereum || !REGISTRY_ADDRESS) return;

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ArcNameRegistryArtifact.abi as any, REGISTRY_ADDRESS);

      const fee = await contract.methods.registrationFee().call();

      await contract.methods.register(name).send({
        from: signer,
        value: String(fee || '0')
      });

      alert(`Successfully registered ${name}.arc!`);

      // Refresh suggestions
      checkAllAvailability(suggestions);
    } catch (err: any) {
      alert(err.message || 'Registration failed');
      console.error('Registration error:', err);
    }
  };

  if (!REGISTRY_ADDRESS) {
    return (
      <div className="card">
        <h2>🎲 Domain Generator</h2>
        <div className="info-box">
          <p>Registry contract not deployed. Please deploy the contract first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🎲 ARC Name Generator</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
        Generate creative .arc domain names instantly
      </p>

      <div className="input-group">
        <label>Keyword (optional):</label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
          placeholder="e.g., crypto, finance, my-project"
          className="input-field"
          maxLength={20}
        />
      </div>

      <div className="input-group">
        <label>Generation Style:</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'combo', label: '🎯 Combo' },
            { key: 'prefix', label: '⚡ Prefix' },
            { key: 'suffix', label: '🔥 Suffix' },
            { key: 'random', label: '🎲 Random' }
          ].map(style => (
            <button
              key={style.key}
              onClick={() => setSelectedStyle(style.key as any)}
              className={`action-button ${selectedStyle === style.key ? '' : 'secondary'}`}
              style={{ flex: 1, minWidth: '100px', fontSize: '0.875rem', padding: '0.5rem' }}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={generateNames} 
        disabled={generating}
        className="action-button"
        style={{ marginBottom: '1.5rem' }}
      >
        {generating ? 'Generating...' : '🎲 Generate Names'}
      </button>

      {suggestions.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Suggestions:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {suggestion.name}.arc
                  </span>
                  {suggestion.checking && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Checking...
                    </span>
                  )}
                  {!suggestion.checking && suggestion.available !== null && (
                    <span 
                      style={{ 
                        marginLeft: '0.5rem', 
                        fontSize: '0.875rem',
                        color: suggestion.available ? 'var(--success)' : 'var(--error)'
                      }}
                    >
                      {suggestion.available ? '✓ Available' : '✗ Taken'}
                    </span>
                  )}
                </div>
                {suggestion.available && (
                  <button
                    onClick={() => registerName(suggestion.name)}
                    className="action-button"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Register
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '1.5rem' }}>
        <p><strong>💡 Tips:</strong></p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
          <li><strong>Combo:</strong> Combines adjectives + nouns (e.g., swiftpay)</li>
          <li><strong>Prefix:</strong> Crypto terms + words (e.g., defihub)</li>
          <li><strong>Suffix:</strong> Words + common endings (e.g., btcfi)</li>
          <li><strong>Random:</strong> Mix of all styles for creativity</li>
        </ul>
      </div>
    </div>
  );
}
