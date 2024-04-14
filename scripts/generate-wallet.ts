import { web3 } from "@project-serum/anchor";
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function initializeKeypair(connection : web3.Connection) {
    if(!process.env.PRIVATE_KEY) {
        console.log("Generating secret key...🗝️");
        const signer = web3.Keypair.generate();

        console.log("Creating .env file...");
        fs.appendFileSync('.env', `PRIVATE_KEY=[${signer.secretKey.toString()}]\n`);

        await airdropSolIfNeeded(signer, connection);

        return signer;
    }

    const secret = JSON.parse(process.env.PRIVATE_KEY ?? '') as number[];
    const secretKey = Uint8Array.from(secret);
    const keypairFromSecret = web3.Keypair.fromSecretKey(secretKey);
 
    await airdropSolIfNeeded(keypairFromSecret, connection);
    
    return keypairFromSecret;
}

async function airdropSolIfNeeded(signer : web3.Keypair, connection : web3.Connection) {
    const balance = await connection.getBalance(signer.publicKey);
    console.log('Current balance is ', balance / web3.LAMPORTS_PER_SOL, 'SOL');

    if(balance / web3.LAMPORTS_PER_SOL < 1) {
        console.log("Airdropping 1 SOL...");
        const airdropSignature = await connection.requestAirdrop(signer.publicKey, web3.LAMPORTS_PER_SOL);

        const latestBlockhash = await connection.getLatestBlockhash();

        await connection.confirmTransaction({
            blockhash : latestBlockhash.blockhash,
            lastValidBlockHeight : latestBlockhash.lastValidBlockHeight,
            signature : airdropSignature,
        });

        const newBalance = await connection.getBalance(signer.publicKey);
        console.log('The new balance is ', newBalance / web3.LAMPORTS_PER_SOL, 'SOL');
    }
}

export { initializeKeypair, airdropSolIfNeeded };