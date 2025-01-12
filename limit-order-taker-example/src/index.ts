import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { getQuote, getSwapIx } from "./jupiterApi";
import { Wallet } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { config } from "dotenv";

config();

const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export async function main() {
  try {
    const wallet = new Wallet(
      Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
    );
    const connection = new Connection(
      process.env.RPC_ENDPOINT || "https://api.devnet.solana.com"
    );

    // Amount in lamports (0.1 SOL = 100000000 lamports)
    const amount = "100000000";
    
    console.log("Getting quote for 0.1 SOL to USDC swap...");
    const quote = await getQuote(SOL_MINT, USDC_MINT, amount);
    const inAmount = parseInt(amount) / 1e9;
    const outAmount = parseInt(quote.outAmount) / 1e6;
    console.log(`Quote received: ${inAmount} SOL -> ${outAmount} USDC`);

    console.log("Getting swap transaction...");
    const swapTx = await getSwapIx(quote, wallet.publicKey);
    
    // Sign the transaction
    swapTx.sign([wallet.payer]);

    console.log("Sending transaction...");
    const signature = await connection.sendTransaction(swapTx, {
      skipPreflight: true,
      maxRetries: 2
    });
    console.log(`Transaction sent! Signature: ${signature}`);
    console.log(`View in Explorer: https://solscan.io/tx/${signature}`);
    
    const confirmation = await connection.confirmTransaction(signature);
    console.log("Transaction confirmed!", confirmation);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
