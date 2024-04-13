import * as anchor from "@project-serum/anchor";
import { BridgeSolana } from "../target/types/bridge_solana";
import {
  createAssociatedTokenAccount,
  createMint,
  getAssociatedTokenAddressSync,
  mintTo,
} from "@solana/spl-token";

describe("Owner withdraw token", () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  const program = anchor.workspace.BridgeSolana as anchor.Program<BridgeSolana>;

  const unlocker: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  const bridgeKeypair = anchor.web3.Keypair.generate();
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

  let adminAccount: anchor.web3.PublicKey;

  before(async () => {
    // Fund person
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
      admin,
      mintBukhKeypair.publicKey,
      admin.publicKey
    );

    adminAccount = getAssociatedTokenAddressSync(
      mintBukhKeypair.publicKey,
      admin.publicKey,
      true
    );

    await program.methods
      .createBridge(10)
      .accounts({
        bridge: bridgeKeypair.publicKey,
        mintBukh: mintBukhKeypair.publicKey,
        poolBukhAuthority: poolBukhAuthority,
        poolBukh: poolBukh,
        mintSukh: mintSukhKeypair.publicKey,
        poolSukhAuthority: poolSukhAuthority,
        poolSukh: poolSukh,
        unlocker: unlocker.publicKey,
        admin: admin.publicKey,
      })
      .signers([bridgeKeypair, admin])
      .rpc({ skipPreflight: false })
      .catch((err) => {
        console.log(err);
      });

      await mintTo(
        connection,
        admin,
        mintBukhKeypair.publicKey,
        poolBukh,
        admin.publicKey,
        100
      );
  });

  it("Owner withdraw token sucessfully", async () => {
    await program.methods
      .ownerWithdraw(new anchor.BN(100))
      .accounts({
        bridge: bridgeKeypair.publicKey,
        mint: mintBukhKeypair.publicKey,
        adminAccount: adminAccount,
        poolAuthority: poolBukhAuthority,
        pool: poolBukh,
        payer: admin.publicKey,
      })
      .signers([admin])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
  });
});
