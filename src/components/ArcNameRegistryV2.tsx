import { useState, useEffect } from 'react';
import Web3 from 'web3';
import ArcNameRegistryV2Artifact from '../contracts/ArcNameRegistryV2.json';

interface ArcNameRegistryV2Props {
  signer: any;
  account: string | null;
}

const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || '0x7b08A2A0CE6BC1f4D325529aBf26E0A6Bc83dBff';

// Debug: Log which address is being used
console.log('🔍 Registry Address:', REGISTRY_ADDRESS);
console.log('🔍 Env Variable:', import.meta.env.VITE_REGISTRY_ADDRESS);

export function ArcNameRegistryV2({ signer }: ArcNameRegistryV2Props) {
  const [searchName, setSearchName] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registrationFee, setRegistrationFee] = useState<string>('0.1');

  // Store registered names locally in localStorage
  const STORAGE_KEY = 'arc_names_cache';
  
  // Load name cache from localStorage
  const loadNameCache = (): Map<string, string> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const obj = JSON.parse(stored);
        return new Map(Object.entries(obj));
      }
    } catch (e) {
      console.error('Failed to load name cache:', e);
    }
    return new Map();
  };
  
  // Save name cache to localStorage
  const saveNameCache = (cache: Map<string, string>) => {
    try {
      const obj = Object.fromEntries(cache);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error('Failed to save name cache:', e);
    }
  };

  const [nameCache, setNameCache] = useState<Map<string, string>>(loadNameCache());

  // Calculate namehash (ENS-compatible)
  const checkAvailability = async () => {
    if (!searchName || !REGISTRY_ADDRESS) {
      setError('Please enter a name to check');
      return;
    }

    setChecking(true);
    setError(null);
    setSuccess(null);
    setIsAvailable(null);

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ArcNameRegistryV2Artifact.abi as any, REGISTRY_ADDRESS);

      const available = await contract.methods.isAvailable(searchName.toLowerCase()).call();
      setIsAvailable(Boolean(available));
    } catch (err: any) {
      setError(err.message || 'Failed to check availability');
      console.error('Availability check error:', err);
    } finally {
      setChecking(false);
    }
  };

  // Register name
  const registerName = async () => {
    if (!searchName || !signer || !window.ethereum || !REGISTRY_ADDRESS) {
      setError('Please connect your wallet and enter a name');
      return;
    }

    setRegistering(true);
    setError(null);
    setSuccess(null);

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ArcNameRegistryV2Artifact.abi as any, REGISTRY_ADDRESS);

      const fee = await contract.methods.registrationFee().call();

      await contract.methods.register(searchName.toLowerCase()).send({
        from: signer,
        value: String(fee || '0')
      });

      // Cache the name immediately in memory and localStorage
      const updatedCache = new Map(nameCache);
      updatedCache.set(searchName.toLowerCase(), searchName.toLowerCase());
      setNameCache(updatedCache);
      saveNameCache(updatedCache);

      setSuccess(`Successfully registered ${searchName.toLowerCase()}.arc!`);
      setSearchName('');
      setIsAvailable(null);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    // Load registration fee when component mounts
    const loadFee = async () => {
      if (!REGISTRY_ADDRESS || !window.ethereum) return;
      try {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(ArcNameRegistryV2Artifact.abi as any, REGISTRY_ADDRESS);
        const fee = await contract.methods.registrationFee().call();
        const feeInUsdc = web3.utils.fromWei(String(fee || '0'), 'ether');
        setRegistrationFee(feeInUsdc);
      } catch (err) {
        console.error('Failed to load registration fee:', err);
      }
    };
    loadFee();
  }, [REGISTRY_ADDRESS]);

  // Validate input in real-time
  const handleNameInput = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSearchName(sanitized);
    setIsAvailable(null);
  };

  if (!REGISTRY_ADDRESS) {
    return (
      <div className="card">
        <h2>🏷 ARC Name Registry V2</h2>
        <div className="info-box">
          <p><strong>⚠️ Registry Not Deployed</strong></p>
          <p>The ARC Name Registry V2 contract needs to be deployed first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🏷 ARC Name Registry V2</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        Register unlimited .arc names • ENS-compatible architecture
      </p>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '0', 
          alignItems: 'stretch',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <input
            type="text"
            value={searchName}
            onChange={(e) => handleNameInput(e.target.value)}
            placeholder="yourname"
            style={{
              flex: 1,
              padding: '1rem 1.25rem',
              border: 'none',
              background: 'transparent',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 500,
              outline: 'none',
              minWidth: 0
            }}
            maxLength={32}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.25rem',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '0.5px'
          }}>
            .arc
          </div>
        </div>
      </div>

      <button 
        onClick={checkAvailability} 
        disabled={!searchName || checking || searchName.length < 3}
        className="action-button secondary"
        style={{ marginBottom: '1.5rem', width: '100%' }}
      >
        {checking ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="loading-spinner"></span>
            Checking...
          </span>
        ) : '🔍 Check Availability'}
      </button>

      {isAvailable !== null && (
        <div className={isAvailable ? 'success-message' : 'error-message'} style={{ marginBottom: '1rem', padding: '1rem' }}>
          {isAvailable ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
                ✓ <strong style={{ wordBreak: 'break-word' }}>{searchName}.arc</strong> is available!
              </p>
              <button 
                onClick={registerName} 
                disabled={registering}
                className="action-button"
                style={{ width: '100%' }}
              >
                {registering ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="loading-spinner"></span>
                    Registering...
                  </span>
                ) : `Register for ${registrationFee} USDC`}
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, lineHeight: '1.5' }}>
              ✗ <strong style={{ wordBreak: 'break-word' }}>{searchName}.arc</strong> is already taken
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <p style={{ margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="success-message" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <p style={{ margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>{success}</p>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>💡 What's New in V2:</p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>✨ Own unlimited .arc names from one wallet</li>
          <li>🏗 ENS-compatible architecture with namehash</li>
          <li>🔄 Future-ready for subdomains (e.g., api.yourname.arc)</li>
          <li>🎯 Efficient gas usage with bytes32 storage</li>
          <li>💰 Just {registrationFee} USDC per name</li>
        </ul>
      </div>
    </div>
  );
}
