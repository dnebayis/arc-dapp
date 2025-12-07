import { readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { ethers } from 'ethers'

dotenv.config()

async function main() {
  const rpcUrl = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
  const pk = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
  if (!pk) throw new Error('PRIVATE_KEY missing')

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(pk, provider)

  const bytecodePath = path.join(process.cwd(), 'scripts', 'bytecode.txt')
  const abiPath = path.join(process.cwd(), 'src', 'contracts', 'ArcNameRegistryV3.json')
  const bytecode = '0x' + readFileSync(bytecodePath, 'utf8').trim()
  const { abi } = JSON.parse(readFileSync(abiPath, 'utf8'))

  const balance = await provider.getBalance(wallet.address)
  const feeData = await provider.getFeeData()
  const gasPrice = feeData.gasPrice || 0n

  console.log('Deployer address:', wallet.address)
  console.log('Balance (base units):', balance.toString())
  console.log('Gas price (base units):', gasPrice.toString())

  const factory = new ethers.ContractFactory(abi, bytecode, wallet)
  const deployTx = await factory.getDeployTransaction()
  const estimatedGas = await provider.estimateGas({ ...deployTx, from: wallet.address })
  const required = estimatedGas * (gasPrice || 0n)
  console.log('Estimated gas:', estimatedGas.toString())
  console.log('Estimated total cost:', required.toString())

  if (balance < required) {
    throw new Error(`Insufficient funds: balance=${balance.toString()} required=${required.toString()}`)
  }

  const contract = await factory.deploy({ gasPrice, gasLimit: estimatedGas })
  const receipt = await contract.deploymentTransaction().wait()

  console.log('Deployed ArcNameRegistryV3 at:', contract.target)
  console.log('Tx Hash:', receipt?.hash)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
