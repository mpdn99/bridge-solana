import * as anchor from "@project-serum/anchor";
import { BridgeSolana } from "../target/types/bridge_solana";
import {
  createAssociatedTokenAccount,
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const program = anchor.workspace.BridgeSolana as anchor.Program<BridgeSolana>;

const unlocker: anchor.web3.Keypair = anchor.web3.Keypair.generate();
const admin = anchor.web3.Keypair.generate();
const user = anchor.web3.Keypair.generate();

const bridge = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("bridge")],
  program.programId
)[0];

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

let userAccount: anchor.web3.PublicKey;
let adminAccount: anchor.web3.PublicKey;

describe("Create bridge", () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  before(async () => {
    let txid = await provider.connection.requestAirdrop(
      admin.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    let { blockhash, lastValidBlockHeight } =
      await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: txid,
      blockhash,
      lastValidBlockHeight,
    });

    let txidUser = await provider.connection.requestAirdrop(
      user.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: txidUser,
      blockhash,
      lastValidBlockHeight,
    });

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

    await createAssociatedTokenAccount(
      connection,
      user,
      mintBukhKeypair.publicKey,
      user.publicKey
    );

    userAccount = getAssociatedTokenAddressSync(
      mintBukhKeypair.publicKey,
      user.publicKey,
      true
    );

    await createAssociatedTokenAccount(
      connection,
      admin,
      mintBukhKeypair.publicKey,
      admin.publicKey
    );

    adminAccount = getAssociatedTokenAddressSync(
      mintBukhKeypair.publicKey,
      admin.publicKey,
      true
    );

    await mintTo(
      connection,
      admin,
      mintBukhKeypair.publicKey,
      userAccount,
      admin.publicKey,
      100
    );

    // await mintTo(
    //   connection,
    //   admin,
    //   mintBukhKeypair.publicKey,
    //   poolBukh,
    //   admin.publicKey,
    //   100
    // );
  });

  it("Initialize sucessfully", async () => {
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
        unlocker: unlocker.publicKey,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
  });
});

export {
  program,
  bridge,
  mintBukhKeypair,
  mintSukhKeypair,
  poolBukhAuthority,
  poolSukhAuthority,
  poolBukh,
  poolSukh,
  unlocker,
  admin,
  user,
  userAccount,
  adminAccount,
};
