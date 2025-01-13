import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { getQuote, getSwapIx, prepareSellTransaction, executePreparedSellTransaction } from "./jupiterApi";
import { Wallet } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { config } from "dotenv";

config();

// Default mints for reference
export const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Store wallet and connection globally for reuse
let globalWallet: Wallet;
let globalConnection: Connection;

export async function main(
  inputMint: PublicKey = SOL_MINT, 
  outputMint: PublicKey = USDC_MINT,
  amount: string = "100000000" // Default to 0.1 SOL worth
) {
  try {
    globalWallet = new Wallet(
      Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
    );
    globalConnection = new Connection(
      process.env.RPC_ENDPOINT || "https://api.devnet.solana.com"
    );
    
    console.log(`Getting quote for swap from ${inputMint.toBase58()} to ${outputMint.toBase58()}...`);
    const quote = await getQuote(inputMint, outputMint, amount);
    const inAmount = parseInt(amount) / 1e9; // Note: This decimals calculation might need adjustment based on input token
    const outAmount = parseInt(quote.outAmount) / 1e6; // Note: This decimals calculation might need adjustment based on output token
    console.log(`Quote received: ${inAmount} input tokens -> ${outAmount} output tokens`);

    console.log("Getting swap transaction...");
    const swapTx = await getSwapIx(quote, globalWallet.publicKey);
    
    // Sign the transaction
    swapTx.sign([globalWallet.payer]);

    console.log("Sending transaction...");
    const signature = await globalConnection.sendTransaction(swapTx, {
      skipPreflight: true,
      maxRetries: 2
    });
    console.log(`Transaction sent! Signature: ${signature}`);
    console.log(`View in Explorer: https://solscan.io/tx/${signature}`);
    
    const confirmation = await globalConnection.confirmTransaction(signature);
    console.log("Transaction confirmed!", confirmation);

    // After successful buy, prepare the sell transaction
    console.log("Preparing sell transaction...");
    await prepareSellTransaction(
      outputMint, // The token we just bought becomes the input
      inputMint,  // We want to sell back to SOL
      quote.outAmount, // Use the amount we received
      globalWallet.publicKey
    );
    console.log("Sell transaction prepared and ready to execute!");

  } catch (err) {
    console.error("Error:", err);
  }
}

export async function executeSell(): Promise<void> {
  try {
    console.log("Executing prepared sell transaction...");
    const signature = await executePreparedSellTransaction(globalConnection, globalWallet);
    console.log(`Sell transaction sent! Signature: ${signature}`);
    console.log(`View in Explorer: https://solscan.io/tx/${signature}`);
    
    const confirmation = await globalConnection.confirmTransaction(signature);
    console.log("Sell transaction confirmed!", confirmation);
  } catch (err) {
    console.error("Error executing sell:", err);
  }
}

// Only run main() if this file is run directly
if (require.main === module) {
  main();
}
