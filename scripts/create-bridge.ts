import * as anchor from "@project-serum/anchor";
import { createMint, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { initializeKeypair } from "./generate-wallet";
import * as fs from "fs";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import * as ProgramIDL from "../target/idl/bridge_solana.json";

async function create_bridge() {
  let connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl("devnet")
  );
  const admin = await initializeKeypair(connection);
  let wallet = new NodeWallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const programId = ProgramIDL.metadata.address;
  const program = new anchor.Program(
    ProgramIDL as anchor.Idl,
    programId,
    provider
  );
  fs.appendFileSync(".env", `PROGRAM_ID=${programId}\n`);

  const bridgeKeypair = anchor.web3.Keypair.generate();
  fs.appendFileSync(
    ".env",
    `BRIDGE_PUBLIC_KEY=${bridgeKeypair.publicKey.toString()}\n`
  );
  fs.appendFileSync(
    ".env",
    `BRIDGE_PRIVATE_KEY=[${bridgeKeypair.secretKey.toString()}]\n`
  );

  const mintBukhKeypair = anchor.web3.Keypair.generate();
  fs.appendFileSync(
    ".env",
    `MINT_BUKH_PUBLIC_KEY=${mintBukhKeypair.publicKey.toString()}\n`
  );
  fs.appendFileSync(
    ".env",
    `MINT_BUKH_PRIVATE_KEY=[${mintBukhKeypair.secretKey.toString()}]\n`
  );

  const mintSukhKeypair = anchor.web3.Keypair.generate();
  fs.appendFileSync(
    ".env",
    `MINT_SUKH_PUBLIC_KEY=${mintSukhKeypair.publicKey.toString()}\n`
  );
  fs.appendFileSync(
    ".env",
    `MINT_SUKH_PRIVATE_KEY=[${mintSukhKeypair.secretKey.toString()}]\n`
  );

  const poolBukhAuthority = anchor.web3.PublicKey.findProgramAddressSync(
    [mintBukhKeypair.publicKey.toBuffer(), Buffer.from("authority")],
    program.programId
  )[0];
  fs.appendFileSync(
    ".env",
    `POOL_BUKH_AUTHORITY_PUBKEY=${poolBukhAuthority}\n`
  );

  const poolSukhAuthority = anchor.web3.PublicKey.findProgramAddressSync(
    [mintSukhKeypair.publicKey.toBuffer(), Buffer.from("authority")],
    program.programId
  )[0];
  fs.appendFileSync(
    ".env",
    `POOL_SUKH_AUTHORITY_PUBKEY=${poolSukhAuthority}\n`
  );

  const poolBukh = getAssociatedTokenAddressSync(
    mintBukhKeypair.publicKey,
    poolBukhAuthority,
    true
  );
  fs.appendFileSync(".env", `POOL_BUKH_PUBKEY=${poolBukh}\n`);

  const poolSukh = getAssociatedTokenAddressSync(
    mintSukhKeypair.publicKey,
    poolSukhAuthority,
    true
  );
  fs.appendFileSync(".env", `POOL_SUKH_PUBKEY=${poolSukh}\n`);

  await createMint(
    connection,
    admin,
    admin.publicKey,
    admin.publicKey,
    6,
    mintBukhKeypair
  );

  await createMint(
    connection,
    admin,
    admin.publicKey,
    admin.publicKey,
    6,
    mintSukhKeypair
  );

  const tx = await program.methods
    .createBridge(10)
    .accounts({
      bridge: bridgeKeypair.publicKey,
      mintBukh: mintBukhKeypair.publicKey,
      poolBukhAuthority: poolBukhAuthority,
      poolBukh: poolBukh,
      mintSukh: mintSukhKeypair.publicKey,
      poolSukhAuthority: poolSukhAuthority,
      poolSukh: poolSukh,
      unlocker: new anchor.web3.PublicKey(
        "Ccw4CPToD7ULqwUmwFowy1BLfnYhnZ5vnZbRSoLv1Nf5"
      ),
      admin: admin.publicKey,
    })
    .signers([bridgeKeypair, admin])
    .transaction();

  try {
    await provider.sendAndConfirm(tx, [bridgeKeypair, admin]).then((res) => {
      console.log("Bridge created successfully!");
    });
  } catch (err) {
    console.log(err);
  }
}

create_bridge();
