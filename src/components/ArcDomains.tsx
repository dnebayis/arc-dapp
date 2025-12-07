import { useEffect, useMemo, useState } from 'react'
import Web3 from 'web3'
import ArcRegistryAbi from '../contracts/ArcNameRegistryV2.json'
import { namehash } from 'viem'

interface Props {
  account: string | null
}

export default function ArcDomains({ account }: Props) {
  const [registryAddress, setRegistryAddress] = useState('')
  const [label, setLabel] = useState('')
  const [node, setNode] = useState<string>('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [addr, setAddr] = useState('')
  const [textKey, setTextKey] = useState('profile')
  const [textValue, setTextValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      const owner = await contract.methods.owners(node).call()
      setAvailable(owner === '0x0000000000000000000000000000000000000000')
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
      await contract.methods.register(node).send({ from: account })
      setSuccess('Registered')
      checkAvailability()
    } catch (e: any) {
      setError(e.message || 'Registration failed')
    }
  }

  const saveAddr = async () => {
    if (!account || !contract || !node || !web3.utils.isAddress(addr)) return
    setError(null)
    setSuccess(null)
    try {
      await contract.methods.setAddr(node, addr).send({ from: account })
      setSuccess('Address saved')
    } catch (e: any) {
      setError(e.message || 'Failed to save address')
    }
  }

  const saveText = async () => {
    if (!account || !contract || !node || !textKey) return
    setError(null)
    setSuccess(null)
    try {
      await contract.methods.setText(node, textKey, textValue).send({ from: account })
      setSuccess('Text record saved')
    } catch (e: any) {
      setError(e.message || 'Failed to save text')
    }
  }

  return (
    <div className="card">
      <h2>◈ Arc Domains</h2>

      <div className="input-group">
        <label>Registry Address</label>
        <input
          type="text"
          value={registryAddress}
          onChange={(e) => setRegistryAddress(e.target.value)}
          placeholder="0x..."
          className="input-field"
        />
      </div>

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
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button onClick={register} disabled={!account || !contract || !node || available === false} className="action-button">
          Register {label ? `${label}.arc` : ''}
        </button>
      </div>

      <div className="input-group" style={{ marginTop: '1rem' }}>
        <label>Address Record</label>
        <input
          type="text"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="0x..."
          className="input-field"
        />
      </div>
      <button onClick={saveAddr} disabled={!account || !contract || !node || !addr} className="action-button">Save Address</button>

      <div className="input-group" style={{ marginTop: '1rem' }}>
        <label>Text Record</label>
        <input
          type="text"
          value={textKey}
          onChange={(e) => setTextKey(e.target.value)}
          placeholder="key"
          className="input-field"
        />
      </div>
      <div className="input-group">
        <input
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="value"
          className="input-field"
        />
      </div>
      <button onClick={saveText} disabled={!account || !contract || !node || !textKey} className="action-button">Save Text</button>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          <p>{success}</p>
        </div>
      )}
    </div>
  )
}
