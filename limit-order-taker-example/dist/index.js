"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const web3_js_1 = require("@solana/web3.js");
const jupiterApi_1 = require("./jupiterApi");
const anchor_1 = require("@coral-xyz/anchor");
const bytes_1 = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const SOL_MINT = new web3_js_1.PublicKey("So11111111111111111111111111111111111111112");
const USDC_MINT = new web3_js_1.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const wallet = new anchor_1.Wallet(web3_js_1.Keypair.fromSecretKey(bytes_1.bs58.decode(process.env.PRIVATE_KEY || "")));
            const connection = new web3_js_1.Connection(process.env.RPC_ENDPOINT || "https://api.devnet.solana.com");
            // Amount in lamports (0.1 SOL = 100000000 lamports)
            const amount = "100000000";
            console.log("Getting quote for 0.1 SOL to USDC swap...");
            const quote = yield (0, jupiterApi_1.getQuote)(SOL_MINT, USDC_MINT, amount);
            const inAmount = parseInt(amount) / 1e9;
            const outAmount = parseInt(quote.outAmount) / 1e6;
            console.log(`Quote received: ${inAmount} SOL -> ${outAmount} USDC`);
            console.log("Getting swap transaction...");
            const swapTx = yield (0, jupiterApi_1.getSwapIx)(quote, wallet.publicKey);
            // Sign the transaction
            swapTx.sign([wallet.payer]);
            console.log("Sending transaction...");
            const signature = yield connection.sendTransaction(swapTx, {
                skipPreflight: true,
                maxRetries: 2
            });
            console.log(`Transaction sent! Signature: ${signature}`);
            console.log(`View in Explorer: https://solscan.io/tx/${signature}`);
            const confirmation = yield connection.confirmTransaction(signature);
            console.log("Transaction confirmed!", confirmation);
        }
        catch (err) {
            console.error("Error:", err);
        }
    });
}
main();
//# sourceMappingURL=index.js.map