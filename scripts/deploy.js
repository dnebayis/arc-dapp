import { readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { ethers } from 'ethers'

dotenv.config()

async function main() {
  const rpcUrl = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error('PRIVATE_KEY missing')

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(pk, provider)

  const bytecodePath = path.join(process.cwd(), 'scripts', 'bytecode.txt')
  const abiPath = path.join(process.cwd(), 'src', 'contracts', 'ArcNameRegistryV2.json')
  const bytecode = '0x' + readFileSync(bytecodePath, 'utf8').trim()
  const { abi } = JSON.parse(readFileSync(abiPath, 'utf8'))

  const factory = new ethers.ContractFactory(abi, bytecode, wallet)
  const contract = await factory.deploy()
  const receipt = await contract.deploymentTransaction().wait()

  console.log('Deployed ArcNameRegistryV2 at:', contract.target)
  console.log('Tx Hash:', receipt?.hash)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
