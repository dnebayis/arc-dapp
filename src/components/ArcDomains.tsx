import { useEffect, useMemo, useState } from 'react'
import Web3 from 'web3'
import ArcRegistryAbi from '../contracts/ArcNameRegistryV3.json'
import { namehash } from 'viem'

interface Props {
  account: string | null
}

export default function ArcDomains({ account }: Props) {
  const registryAddress: string = (import.meta as any).env?.VITE_REGISTRY_ADDRESS || ''
  const [label, setLabel] = useState('')
  const [node, setNode] = useState<string>('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [owner, setOwner] = useState<string>('')

  const web3 = useMemo(() => (window.ethereum ? new Web3(window.ethereum) : null), []) as any
  const contract = useMemo(() => {
    if (!web3 || !registryAddress) return null
    return new web3.eth.Contract((ArcRegistryAbi as any).abi, registryAddress)
  }, [web3, registryAddress])

  useEffect(() => {
    const n = label ? namehash(`${label}.arc`) : ''
    setNode(n)
  }, [label])

  const checkAvailability = async () => {
    if (!contract || !node) return
    setChecking(true)
    setError(null)
    setSuccess(null)
    try {
      try {
        const cid = Number(await web3.eth.getChainId())
        if (cid !== 5042002) {
          throw new Error('Wrong network')
        }
      } catch { void 0 }

      const code = await web3.eth.getCode(registryAddress)
      if (!code || code === '0x') {
        throw new Error('Registry address not deployed on this network')
      }

      const o = await contract.methods.owners(node).call()
      setOwner(o)
      const isAvail = o === '0x0000000000000000000000000000000000000000'
      setAvailable(isAvail)
    } catch (e: any) {
      setError(e.message || 'Failed to check')
    } finally {
      setChecking(false)
    }
  }

  const register = async () => {
    if (!account || !contract || !node) return
    setError(null)
    setSuccess(null)
    try {
      const gas = await contract.methods.register(node).estimateGas({ from: account })
      await contract.methods.register(node).send({ from: account, gas })
      setSuccess('Registered')
      try {
        if (label) {
          const gasLabel = await contract.methods.setText(node, 'label', label).estimateGas({ from: account })
          await contract.methods.setText(node, 'label', label).send({ from: account, gas: gasLabel })
        }
      } catch (e: any) {
        console.error(e)
      }
      await checkAvailability()
    } catch (e: any) {
      setError(e.message || 'Registration failed')
    }
  }

  

  return (
    <div className="card">
      <h2>◈ Arc Domains</h2>
      

      <div className="input-group">
        <label>Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value.toLowerCase())}
          placeholder="yourname"
          className="input-field"
        />
      </div>

      <button onClick={checkAvailability} disabled={!contract || !node || checking} className="action-button secondary">
        {checking ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="loading-spinner"></span>
            Checking...
          </span>
        ) : 'Check Availability'}
      </button>

      {available !== null && (
        <div className="info-box" style={{ marginTop: '1rem' }}>
          <p>{label ? `${label}.arc` : ''} {available ? 'is available' : 'is taken'}</p>
          {!available && owner && (
            <p>Owner: <code>{owner}</code></p>
          )}
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button onClick={register} disabled={!account || !contract || !node || available === false} className="action-button">
          Register {label ? `${label}.arc` : ''}
        </button>
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
