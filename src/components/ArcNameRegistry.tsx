import { useState, useEffect } from 'react';
import Web3 from 'web3';
import ArcNameRegistryArtifact from '../contracts/ArcNameRegistry.json';

interface ArcNameRegistryProps {
  signer: any;
  account: string | null;
}

// You'll need to deploy the contract and update this address
const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || '';
const ARCSCAN_API_KEY = 'cfb394f7-0a49-4202-9986-c6f52ebe0744';

export function ArcNameRegistry({ signer, account }: ArcNameRegistryProps) {
  const [searchName, setSearchName] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [myNames, setMyNames] = useState<string[]>([]);
  const [registering, setRegistering] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registrationFee, setRegistrationFee] = useState<string>('0.1');

  // Load user's current name(s) from ArcScan API and contract events
  const loadMyNames = async () => {
    if (!account || !REGISTRY_ADDRESS) return;

    try {
      const namesSet = new Set<string>();

      // Method 1: Try to fetch from contract events via ArcScan API
      try {
        const arcscanUrl = `https://testnet.arcscan.app/api?module=logs&action=getLogs&address=${REGISTRY_ADDRESS}&topic0=${Web3.utils.sha3('NameRegistered(string,address,uint256)')}&topic2=${Web3.utils.padLeft(account.toLowerCase(), 64)}&apikey=${ARCSCAN_API_KEY}`;
        
        const response = await fetch(arcscanUrl);
        const data = await response.json();
        
        if (data.status === '1' && data.result && Array.isArray(data.result)) {
          for (const log of data.result) {
            if (log.topics && log.topics.length > 1 && log.data) {
              try {
                const web3 = new Web3();
                // Decode the name from the log data
                const decodedData = web3.eth.abi.decodeParameters(
                  ['string', 'address', 'uint256'],
                  log.data
                );
                if (decodedData && decodedData[0]) {
                  namesSet.add(String(decodedData[0]));
                }
              } catch (decodeErr) {
                console.error('Failed to decode log:', decodeErr);
              }
            }
          }
        }
      } catch (apiErr) {
        console.error('ArcScan API error:', apiErr);
      }

      // Method 2: Fallback to direct contract query
      if (window.ethereum) {
        try {
          const web3 = new Web3(window.ethereum);
          const contract = new web3.eth.Contract(ArcNameRegistryArtifact.abi as any, REGISTRY_ADDRESS);

          const name = await contract.methods.reverseResolve(account).call();
          const nameString = String(name || '');
          
          if (nameString) {
            namesSet.add(nameString);
          }

          // Get registration fee
          const fee = await contract.methods.registrationFee().call();
          const feeInUsdc = web3.utils.fromWei(String(fee || '0'), 'ether');
          setRegistrationFee(feeInUsdc);
        } catch (contractErr) {
          console.error('Contract query error:', contractErr);
        }
      }

      // Update state with all found names
      setMyNames(Array.from(namesSet).filter(name => name.length > 0));
    } catch (err) {
      console.error('Failed to load names:', err);
    }
  };

  // Check name availability
  const checkAvailability = async () => {
    if (!searchName || !window.ethereum || !REGISTRY_ADDRESS) {
      setError('Please enter a name to check');
      return;
    }

    setChecking(true);
    setError(null);
    setSuccess(null);
    setIsAvailable(null);

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ArcNameRegistryArtifact.abi as any, REGISTRY_ADDRESS);

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
      const contract = new web3.eth.Contract(ArcNameRegistryArtifact.abi as any, REGISTRY_ADDRESS);

      const fee = await contract.methods.registrationFee().call();

      await contract.methods.register(searchName.toLowerCase()).send({
        from: signer,
        value: String(fee || '0')
      });

      setMyNames([searchName.toLowerCase()]);
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
    if (account && REGISTRY_ADDRESS) {
      loadMyNames();
    }
  }, [account, REGISTRY_ADDRESS]);

  // Validate input in real-time
  const handleNameInput = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSearchName(sanitized);
    setIsAvailable(null);
  };

  if (!REGISTRY_ADDRESS) {
    return (
      <div className="card">
        <h2>🏷 ARC Name Registry</h2>
        <div className="info-box">
          <p><strong>⚠️ Registry Not Deployed</strong></p>
          <p>The ARC Name Registry contract needs to be deployed first.</p>
          <p>Check the README for deployment instructions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🏷 ARC Name Registry</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        Register your human-readable .arc name
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

      {myNames.length > 0 && (
        <div className="success-message" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>
              <strong>Your ARC {myNames.length === 1 ? 'Name' : 'Names'}:</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {myNames.map((name, index) => (
                <p 
                  key={index}
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 600, 
                    color: 'var(--primary)', 
                    marginBottom: '0', 
                    wordBreak: 'break-word',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px'
                  }}
                >
                  {name}.arc
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>💡 How it works:</p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Register a .arc name for just {registrationFee} USDC</li>
          <li>Use it instead of your wallet address in transfers</li>
          <li>Transfer ownership to another address anytime</li>
          <li>Names are stored on-chain, no renewal needed</li>
        </ul>
      </div>
    </div>
  );
}
