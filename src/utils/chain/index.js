const { getEvmWalletSignals } = require('./evm');
const { getSolanaWalletSignals } = require('./solana');

const EVM_CHAIN_KEYWORDS = ['ethereum', 'eth', 'base', 'arbitrum', 'arb', 'polygon', 'matic', 'optimism', 'op'];
const SOLANA_CHAIN_KEYWORDS = ['solana', 'sol'];

function detectChainFamily(chainNameRaw, address) {
  const name = (chainNameRaw || '').toLowerCase();
  if (SOLANA_CHAIN_KEYWORDS.some((k) => name.includes(k))) return 'solana';
  if (EVM_CHAIN_KEYWORDS.some((k) => name.includes(k))) return 'evm';

  // No usable chain label on record — fall back to guessing from the address shape.
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'evm';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'solana';
  return null;
}

async function getWalletSignals(address, chainNameRaw) {
  const family = detectChainFamily(chainNameRaw, address);

  if (family === 'evm') {
    if (!process.env.ALCHEMY_API_KEY) throw new Error('ALCHEMY_API_KEY not configured');
    return getEvmWalletSignals(address, chainNameRaw);
  }
  if (family === 'solana') {
    if (!process.env.QUICKNODE_SOLANA_RPC_URL) throw new Error('QUICKNODE_SOLANA_RPC_URL not configured');
    return getSolanaWalletSignals(address);
  }
  throw new Error('Could not determine chain for this wallet address');
}

module.exports = { getWalletSignals, detectChainFamily };
