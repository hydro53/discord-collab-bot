const NETWORK_MAP = {
  ethereum: 'eth-mainnet',
  eth: 'eth-mainnet',
  mainnet: 'eth-mainnet',
  base: 'base-mainnet',
  arbitrum: 'arb-mainnet',
  arb: 'arb-mainnet',
  polygon: 'polygon-mainnet',
  matic: 'polygon-mainnet',
  optimism: 'opt-mainnet',
  op: 'opt-mainnet',
};

function resolveAlchemyNetwork(chainNameRaw) {
  const key = (chainNameRaw || '').toLowerCase().trim();
  for (const [needle, network] of Object.entries(NETWORK_MAP)) {
    if (key.includes(needle)) return network;
  }
  return 'eth-mainnet'; // sane default when the chain field is blank/unrecognized
}

module.exports = { resolveAlchemyNetwork };
