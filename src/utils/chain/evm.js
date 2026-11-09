const { resolveAlchemyNetwork } = require('./evmNetworks');

async function callAlchemy(network, method, params) {
  const url = `https://${network}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Alchemy error: ${data.error.message}`);
  return data.result;
}

// Returns { chain, txCount, ageDays, fundingSource, firstFundingAmount, firstTxTimestamp }
// txCount is the wallet's outgoing nonce (a proxy for activity, not a full tx history count).
// ageDays / fundingSource come from the earliest incoming transfer Alchemy has indexed.
async function getEvmWalletSignals(address, chainNameRaw) {
  const network = resolveAlchemyNetwork(chainNameRaw);

  const txCountHex = await callAlchemy(network, 'eth_getTransactionCount', [address, 'latest']);
  const txCount = parseInt(txCountHex, 16);

  const transfersResult = await callAlchemy(network, 'alchemy_getAssetTransfers', [
    {
      fromBlock: '0x0',
      toBlock: 'latest',
      toAddress: address,
      category: ['external', 'erc20', 'erc721', 'erc1155'],
      order: 'asc',
      maxCount: '0x1',
    },
  ]);
  const earliest = transfersResult?.transfers?.[0];

  let ageDays = null;
  let fundingSource = null;
  let firstFundingAmount = null;
  let firstTxTimestamp = null;

  if (earliest) {
    fundingSource = earliest.from || null;
    firstFundingAmount = earliest.value ?? null;
    const block = await callAlchemy(network, 'eth_getBlockByNumber', [earliest.blockNum, false]);
    if (block?.timestamp) {
      firstTxTimestamp = parseInt(block.timestamp, 16) * 1000;
      ageDays = Math.floor((Date.now() - firstTxTimestamp) / 86400000);
    }
  }

  return { chain: 'evm', txCount, ageDays, fundingSource, firstFundingAmount, firstTxTimestamp };
}

module.exports = { getEvmWalletSignals };
