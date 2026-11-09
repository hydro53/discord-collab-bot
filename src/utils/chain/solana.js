async function rpcCall(method, params) {
  const url = process.env.QUICKNODE_SOLANA_RPC_URL;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`QuickNode error: ${data.error.message}`);
  return data.result;
}

// Best-effort funding-source detection: on the earliest transaction touching
// this wallet, find another account whose SOL balance decreased while this
// wallet's balance increased. Works for simple transfers; complex program
// interactions (swaps, multi-hop txs) may not resolve to a clear sender.
function extractFundingSource(tx, targetAddress) {
  if (!tx?.meta || !tx?.transaction?.message) return null;
  const accountKeys = tx.transaction.message.accountKeys.map((k) => (typeof k === 'string' ? k : k.pubkey));
  const targetIdx = accountKeys.indexOf(targetAddress);
  if (targetIdx === -1) return null;

  const { preBalances, postBalances } = tx.meta;
  if (!preBalances || !postBalances || postBalances[targetIdx] <= preBalances[targetIdx]) return null;

  for (let i = 0; i < accountKeys.length; i++) {
    if (i === targetIdx) continue;
    if (postBalances[i] < preBalances[i]) return accountKeys[i];
  }
  return null;
}

// Returns { chain, txCount, ageDays, fundingSource, firstFundingAmount, firstTxTimestamp }
// Note: getSignaturesForAddress is capped at `limit` — for very active wallets
// this approximates age/tx count from the most recent page rather than full history.
async function getSolanaWalletSignals(address) {
  const signatures = await rpcCall('getSignaturesForAddress', [address, { limit: 1000 }]);
  const txCount = signatures.length;

  let ageDays = null;
  let firstTxTimestamp = null;
  let fundingSource = null;

  if (signatures.length) {
    const earliest = signatures[signatures.length - 1];
    if (earliest.blockTime) {
      firstTxTimestamp = earliest.blockTime * 1000;
      ageDays = Math.floor((Date.now() - firstTxTimestamp) / 86400000);
    }
    try {
      const tx = await rpcCall('getTransaction', [earliest.signature, { maxSupportedTransactionVersion: 0 }]);
      fundingSource = extractFundingSource(tx, address);
    } catch (err) {
      // Best-effort — leave fundingSource null if the tx can't be parsed.
    }
  }

  return { chain: 'solana', txCount, ageDays, fundingSource, firstFundingAmount: null, firstTxTimestamp };
}

module.exports = { getSolanaWalletSignals };
