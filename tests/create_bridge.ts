import * as anchor from "@project-serum/anchor";
import { BridgeSolana } from "../target/types/bridge_solana";
import { createMint, getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("Create bridge", () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  const program = anchor.workspace.BridgeSolana as anchor.Program<BridgeSolana>;

  const unlocker: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();

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
  });

  it("Initialize sucessfully", async () => {
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
      .rpc()
      .catch((err) => {
        console.log(err);
      });
  });
});
