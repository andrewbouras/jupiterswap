import { PublicKey, TransactionInstruction, VersionedTransaction, Connection } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";

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
  // Calculate expiration time 5 minutes from now (in seconds)
  const expirationTime = Math.floor(Date.now() / 1000) + 300; // 300 seconds = 5 minutes
  
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toBase58()}&outputMint=${outputMint.toBase58()}&amount=${amount}&slippageBps=2000&expirationTime=${expirationTime}`
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

// Store the prepared sell transaction for later execution
let preparedSellTransaction: VersionedTransaction | null = null;

export const prepareSellTransaction = async (
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: string,
  userPublicKey: PublicKey
): Promise<void> => {
  // Get quote for selling the token
  const quote = await getQuote(inputMint, outputMint, amount);
  
  // Prepare the swap transaction but don't execute it
  const swapTx = await getSwapIx(quote, userPublicKey);
  
  // Store it for later execution
  preparedSellTransaction = swapTx;
};

export const executePreparedSellTransaction = async (
  connection: Connection,
  wallet: Wallet
): Promise<string> => {
  if (!preparedSellTransaction) {
    throw new Error('No sell transaction has been prepared');
  }

  // Sign the transaction
  preparedSellTransaction.sign([wallet.payer]);

  // Send the transaction
  const signature = await connection.sendTransaction(preparedSellTransaction, {
    skipPreflight: true,
    maxRetries: 2
  });

  // Clear the stored transaction after sending
  preparedSellTransaction = null;

  return signature;
};
