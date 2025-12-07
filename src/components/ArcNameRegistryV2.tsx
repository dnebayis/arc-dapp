import { useState, useEffect } from 'react';
import Web3 from 'web3';
import ArcNameRegistryV2Artifact from '../contracts/ArcNameRegistryV2.json';

interface ArcNameRegistryV2Props {
  signer: any;
  account: string | null;
}

const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || '';
const ARCSCAN_API_KEY = 'cfb394f7-0a49-4202-9986-c6f52ebe0744';

interface OwnedName {
  node: string;
  name: string;
  registrationTime: number;
}

export function ArcNameRegistryV2({ signer, account }: ArcNameRegistryV2Props) {
  const [searchName, setSearchName] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [myNames, setMyNames] = useState<OwnedName[]>([]);
  const [registering, setRegistering] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
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
  const namehash = (name: string): string => {
    const web3 = new Web3();
    let node = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    // Hash .arc TLD
    const arcLabel = web3.utils.keccak256('arc');
    node = web3.utils.keccak256(web3.eth.abi.encodeParameters(['bytes32', 'bytes32'], [node, arcLabel]));
    
    // Hash the name
    if (name) {
      const nameLabel = web3.utils.keccak256(name);
      node = web3.utils.keccak256(web3.eth.abi.encodeParameters(['bytes32', 'bytes32'], [node, nameLabel]));
    }
    
    return node;
  };

  // Load all names owned by user
  const loadMyNames = async () => {
    if (!account || !REGISTRY_ADDRESS) return;
    
    setLoading(true);
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ArcNameRegistryV2Artifact.abi as any, REGISTRY_ADDRESS);
      
      // Get all owned name nodes
      const ownedNodes = await contract.methods.getOwnedNames(account).call();
      const ownedNodesArray = Array.isArray(ownedNodes) ? ownedNodes : [];
      
      // Query NameRegistered events for this account to get actual names
      const namesWithDetails: OwnedName[] = [];
      
      try {
        // Get all NameRegistered events where the owner is the current account
        const eventSignature = web3.utils.sha3('NameRegistered(string,bytes32,address,uint256)');
        const paddedAddress = web3.utils.padLeft(account.toLowerCase(), 64);
        
        const eventUrl = `https://testnet.arcscan.app/api?module=logs&action=getLogs&address=${REGISTRY_ADDRESS}&topic0=${eventSignature}&topic2=${paddedAddress}&apikey=${ARCSCAN_API_KEY}`;
        
        console.log('Fetching events from:', eventUrl);
        
        const response = await fetch(eventUrl);
        const data = await response.json();
        
        console.log('ArcScan response:', data);
        
        const newCache = new Map<string, string>();
        
        if (data.status === '1' && data.result && Array.isArray(data.result)) {
          console.log('Found', data.result.length, 'registration events');
          
          // Build a map of node -> name from events
          for (const log of data.result) {
            try {
              console.log('Processing log:', log);
              
              // The event signature is: NameRegistered(string name, bytes32 indexed node, address indexed owner, uint256 timestamp)
              // Non-indexed params go in data: string name, uint256 timestamp
              const decodedData = web3.eth.abi.decodeParameters(
                ['string', 'uint256'],
                log.data
              );
              
              const name = String(decodedData[0]);
              const node = String(log.topics[1]); // Node is indexed (topic1)
              
              console.log('Decoded:', { name, node });
              
              newCache.set(node.toLowerCase(), name);
            } catch (decodeErr) {
              console.error('Failed to decode event:', decodeErr, log);
            }
          }
        } else {
          console.warn('No events found or API error:', data);
        }
        
        setNameCache(newCache);
        saveNameCache(newCache); // Persist to localStorage
        
        // Now match owned nodes with cached names
        for (const node of ownedNodesArray) {
          try {
            const nodeStr = String(node).toLowerCase();
            const registrationTime = await contract.methods.registrationTime(nodeStr).call();
            const name = newCache.get(nodeStr) || 'unknown';
            
            namesWithDetails.push({
              node: nodeStr,
              name: name,
              registrationTime: Number(registrationTime || 0)
            });
          } catch (err) {
            console.error('Failed to load name details:', err);
          }
        }
      } catch (apiErr) {
        console.error('Failed to fetch events from ArcScan:', apiErr);
        
        // Fallback: Use cached names or show as unknown
        for (const node of ownedNodesArray) {
          const nodeStr = String(node).toLowerCase();
          const registrationTime = await contract.methods.registrationTime(nodeStr).call();
          const name = nameCache.get(nodeStr) || 'unknown';
          
          namesWithDetails.push({
            node: nodeStr,
            name: name,
            registrationTime: Number(registrationTime || 0)
          });
        }
      }
      
      setMyNames(namesWithDetails);
      
      // Get registration fee
      const fee = await contract.methods.registrationFee().call();
      const feeInUsdc = web3.utils.fromWei(String(fee || '0'), 'ether');
      setRegistrationFee(feeInUsdc);
    } catch (err) {
      console.error('Failed to load names:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check name availability
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
      const node = namehash(searchName.toLowerCase());
      const updatedCache = new Map(nameCache);
      updatedCache.set(node.toLowerCase(), searchName.toLowerCase());
      setNameCache(updatedCache);
      saveNameCache(updatedCache);

      setSuccess(`Successfully registered ${searchName.toLowerCase()}.arc!`);
      setSearchName('');
      setIsAvailable(null);
      
      // Reload owned names
      setTimeout(() => loadMyNames(), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  // Release a name
  const releaseName = async (node: string, name: string) => {
    if (!signer || !window.ethereum || !REGISTRY_ADDRESS) return;

    const confirmed = window.confirm(`Are you sure you want to release ${name}.arc? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(ArcNameRegistryV2Artifact.abi as any, REGISTRY_ADDRESS);

      await contract.methods.release(node).send({
        from: signer
      });

      setSuccess(`Successfully released ${name}.arc`);
      
      // Reload owned names
      setTimeout(() => loadMyNames(), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to release name');
      console.error('Release error:', err);
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
