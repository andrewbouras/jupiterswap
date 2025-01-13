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
exports.getSwapIx = exports.getQuote = void 0;
const web3_js_1 = require("@solana/web3.js");
const getQuote = (inputMint, outputMint, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toBase58()}&outputMint=${outputMint.toBase58()}&amount=${amount}&slippageBps=50`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return yield response.json();
});
exports.getQuote = getQuote;
const getSwapIx = (quote, userPublicKey) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch('https://quote-api.jup.ag/v6/swap', {
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
    const swapResult = yield response.json();
    console.log('Swap API Response:', JSON.stringify(swapResult, null, 2));
    if (!swapResult.swapTransaction) {
        throw new Error('No swap transaction received from Jupiter API');
    }
    // Deserialize the transaction
    const serializedTransaction = Buffer.from(swapResult.swapTransaction, 'base64');
    return web3_js_1.VersionedTransaction.deserialize(serializedTransaction);
});
exports.getSwapIx = getSwapIx;
//# sourceMappingURL=jupiterApi.js.map