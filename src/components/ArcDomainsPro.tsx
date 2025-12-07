import { useEffect, useMemo, useState } from 'react'
import Web3 from 'web3'
import ArcRegistryAbi from '../contracts/ArcNameRegistryV3.json'

interface Props {
  account: string | null
}

export default function ArcDomainsPro({ account }: Props) {
  const registryAddress: string = (import.meta as any).env?.VITE_REGISTRY_ADDRESS || ''
  const fallbackRpc: string = (import.meta as any).env?.VITE_ARC_RPC_FALLBACK_URL || 'https://arc-testnet.drpc.org'
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [domains, setDomains] = useState<Array<{ node: string, owner: string, addr: string, label: string }>>([])

  const web3 = useMemo(() => (window.ethereum ? new Web3(window.ethereum) : null), []) as any
  const contract = useMemo(() => {
    if (!web3 || !registryAddress) return null
    return new web3.eth.Contract((ArcRegistryAbi as any).abi, registryAddress)
  }, [web3, registryAddress])

  

  const loadOwnedDomains = async () => {
    if (!account || !registryAddress) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      let activeContract: any = contract
      let activeWeb3: any = web3
      if (!activeContract) {
        const fweb3 = new Web3(new Web3.providers.HttpProvider(fallbackRpc)) as any
        activeWeb3 = fweb3
        activeContract = new fweb3.eth.Contract((ArcRegistryAbi as any).abi, registryAddress)
      }

      const latestBlock = Number(await activeWeb3.eth.getBlockNumber())
      const maxLookback = Number((import.meta as any).env?.VITE_LOGS_LOOKBACK_BLOCKS || 50000)
      const chunkSize = Number((import.meta as any).env?.VITE_LOGS_CHUNK_SIZE || 9000)
      const startBlock = Math.max(0, latestBlock - maxLookback)

      let events: any[] = []
      for (let from = startBlock; from <= latestBlock; from += chunkSize) {
        const to = Math.min(from + chunkSize, latestBlock)
        try {
          const chunk = await activeContract.getPastEvents('NameRegistered', {
            filter: { owner: account },
            fromBlock: from,
            toBlock: to,
          })
          events = events.concat(chunk)
        } catch {
          if (activeWeb3 === web3) {
            const fweb3 = new Web3(new Web3.providers.HttpProvider(fallbackRpc)) as any
            activeWeb3 = fweb3
            activeContract = new fweb3.eth.Contract((ArcRegistryAbi as any).abi, registryAddress)
            const chunk = await activeContract.getPastEvents('NameRegistered', {
              filter: { owner: account },
              fromBlock: from,
              toBlock: to,
            })
            events = events.concat(chunk)
          }
        }
      }
      const nodes: string[] = Array.from(new Set(events.map((e: any) => String(e.returnValues.node))))
      const results: Array<{ node: string, owner: string, addr: string, label: string }> = []
      for (const n of nodes) {
        const o = await activeContract.methods.owners(n).call()
        if (o.toLowerCase() !== account.toLowerCase()) continue
        const a = await activeContract.methods.addrRecords(n).call()
        let lbl = ''
        try {
          lbl = await activeContract.methods.getText(n, 'label').call()
        } catch { lbl = '' }
        if (!lbl) {
          try { lbl = await activeContract.methods.getText(n, 'name').call() } catch { lbl = '' }
        }
        if (!lbl) {
          try { lbl = await activeContract.methods.getText(n, 'profile').call() } catch { lbl = '' }
        }
        if (!lbl) {
          let textEvents: any[] = []
          for (let from = startBlock; from <= latestBlock; from += chunkSize) {
            const to = Math.min(from + chunkSize, latestBlock)
            try {
              const chunk = await activeContract.getPastEvents('TextSet', {
                filter: { node: n },
                fromBlock: from,
                toBlock: to,
              })
              textEvents = textEvents.concat(chunk)
            } catch {
              if (activeWeb3 === web3) {
                const fweb3 = new Web3(new Web3.providers.HttpProvider(fallbackRpc)) as any
                activeWeb3 = fweb3
                activeContract = new fweb3.eth.Contract((ArcRegistryAbi as any).abi, registryAddress)
                const chunk = await activeContract.getPastEvents('TextSet', {
                  filter: { node: n },
                  fromBlock: from,
                  toBlock: to,
                })
                textEvents = textEvents.concat(chunk)
              }
            }
          }
          const keys = ['label', 'name', 'profile']
          for (let i = textEvents.length - 1; i >= 0; i--) {
            const ev = textEvents[i]
            const k = String(ev?.returnValues?.key || '')
            const v = String(ev?.returnValues?.value || '')
            if (v && keys.includes(k)) { lbl = v; break }
          }
        }
        results.push({ node: String(n), owner: String(o), addr: String(a), label: String(lbl || '') })
      }
      setDomains(results)
      setSuccess(results.length ? 'Loaded domains' : null)
    } catch (e: any) {
      setError(e.message || 'Failed to load domains')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOwnedDomains()
  }, [account, contract])

  return (
    <div className="card" style={{ position: 'relative' }}>
      <button 
        onClick={loadOwnedDomains} 
        disabled={loading || !account}
        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#fff', opacity: (loading || !account) ? 0.5 : 1 }}
      >
        ↻
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <h2>◈ Domains Pro</h2>
      </div>

      <div className="grid" style={{ gap: '0.5rem', gridTemplateColumns: '1fr' }}>
        
        {!loading && domains.length === 0 && (
          <div className="info-box" style={{ width: '100%' }}>
            <p>No domains found for this account.</p>
          </div>
        )}

        {loading && (
          <div className="info-box" style={{ width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="loading-spinner"></span>
              Loading domains...
            </span>
          </div>
        )}

        {domains.map((d) => {
          const displayName = d.label ? `${d.label}.arc` : 'Unnamed domain'
          return (
            <div key={d.node} className="card" style={{ width: '100%', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{displayName}</div>
                </div>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', fontSize: '0.9rem' }}>
                  <div>Owner: <code>{d.owner.slice(0, 6)}...{d.owner.slice(-4)}</code></div>
                  {d.addr && <div>Address: <code>{d.addr.slice(0, 6)}...{d.addr.slice(-4)}</code></div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          <p>{success}</p>
        </div>
      )}
    </div>
  )
}
