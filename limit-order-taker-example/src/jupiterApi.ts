import { PublicKey, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: string;
  priceImpactPct: string;
  routePlan: any[];
  contextSlot: number;
  timeTaken: number;
}

export const getQuote = async (
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: string
): Promise<QuoteResponse> => {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toBase58()}&outputMint=${outputMint.toBase58()}&amount=${amount}&slippageBps=50`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const getSwapIx = async (
  quote: QuoteResponse,
  userPublicKey: PublicKey
): Promise<VersionedTransaction> => {
  const response = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: userPublicKey.toBase58(),
      wrapUnwrapSOL: true,
      computeUnitPriceMicroLamports: 'auto',
      asLegacyTransaction: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const swapResult = await response.json();
  console.log('Swap API Response:', JSON.stringify(swapResult, null, 2));
  
  if (!swapResult.swapTransaction) {
    throw new Error('No swap transaction received from Jupiter API');
  }

  // Deserialize the transaction
  const serializedTransaction = Buffer.from(swapResult.swapTransaction, 'base64');
  return VersionedTransaction.deserialize(serializedTransaction);
};
