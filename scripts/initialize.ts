import * as anchor from "@project-serum/anchor";
import { createMint, getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as fs from "fs";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import * as ProgramIDL from "../target/idl/bridge_solana.json";
import dotenv from 'dotenv';
import { BridgeSolana } from "../target/types/bridge_solana";
dotenv.config();

async function importKeys() {
  console.log(process.env.PRIVATE_KEY);
  let secret = anchor.utils.bytes.bs58.decode(
    `${process.env.PRIVATE_KEY}`
  );
  return anchor.web3.Keypair.fromSecretKey(secret);
}

async function saveKeys(keys: any) {
  fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));
}

async function savePublicKeys(keys: any) {
  fs.writeFileSync("publicKeys.json", JSON.stringify(keys, null, 2));
}

async function initialize() {
  let connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl("devnet")
  );
  const admin = await importKeys();
  let wallet = new NodeWallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const programId = ProgramIDL.metadata.address;
  const program = new anchor.Program(
    ProgramIDL as anchor.Idl,
    programId,
    provider
  ) as anchor.Program<BridgeSolana>;

  const bridge = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bridge")],
    program.programId
  )[0];

  const unlocker = process.env.UNLOCKER_PUBLIC_KEY

  const mintBukhKeypair = anchor.web3.Keypair.generate();
  const mintSukhKeypair = anchor.web3.Keypair.generate();

  const poolBukhAuthority = anchor.web3.PublicKey.findProgramAddressSync(
    [mintBukhKeypair.publicKey.toBuffer(), Buffer.from("authority")],
    program.programId
  )[0];

  const poolSukhAuthority = anchor.web3.PublicKey.findProgramAddressSync(
    [mintSukhKeypair.publicKey.toBuffer(), Buffer.from("authority")],
    program.programId
  )[0];

  const poolBukh = getAssociatedTokenAddressSync(
    mintBukhKeypair.publicKey,
    poolBukhAuthority,
    true
  );

  const poolSukh = getAssociatedTokenAddressSync(
    mintSukhKeypair.publicKey,
    poolSukhAuthority,
    true
  );

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

  await program.methods
    .initialize(10)
    .accounts({
      bridge: bridge,
      mintBukh: mintBukhKeypair.publicKey,
      poolBukhAuthority: poolBukhAuthority,
      poolBukh: poolBukh,
      mintSukh: mintSukhKeypair.publicKey,
      poolSukhAuthority: poolSukhAuthority,
      poolSukh: poolSukh,
      unlocker: new anchor.web3.PublicKey(
        unlocker
      ),
      admin: admin.publicKey,
    })
    .signers([admin])
    .rpc()
    .then((res) => {
      console.log("Transaction signature", res);
    })
    .catch((err) => {
      console.log(err);
    });

  const keys = {
    mintBukh: mintBukhKeypair.secretKey.toString(),
    mintSukh: mintSukhKeypair.secretKey.toString(),
  };
  saveKeys(keys);

  const publicKeys = {
    bridge: bridge.toString(),
    mintBukh: mintBukhKeypair.publicKey.toString(),
    mintSukh: mintSukhKeypair.publicKey.toString(),
    poolBukhAuthority: poolBukhAuthority.toString(),
    poolSukhAuthority: poolSukhAuthority.toString(),
    poolBukh: poolBukh.toString(),
    poolSukh: poolSukh.toString(),
    unlocker: unlocker.toString(),
    admin: admin.publicKey.toString(),
  };
  savePublicKeys(publicKeys);
}

initialize();
