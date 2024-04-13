import * as anchor from "@project-serum/anchor";
import { BridgeSolana } from "../target/types/bridge_solana";
import {
    createAssociatedTokenAccount,
  createMint,
  getAssociatedTokenAddressSync,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";

describe("Lock token", () => {
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

  let userAccount: anchor.web3.PublicKey;

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
      user,
      mintBukhKeypair.publicKey,
      user.publicKey
    );

    userAccount = getAssociatedTokenAddressSync(
      mintBukhKeypair.publicKey,
      user.publicKey,
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
  });

  it("Lock token sucessfully", async () => {
    const listenerMyEvent = program.addEventListener(
      "BridgeTransferEvent",
      (event) => {
        expect(event.mint.toString()).to.be.equal(
          mintBukhKeypair.publicKey.toString()
        );
        expect(event.from.toString()).to.be.equal(userAccount.toString());
        expect(event.to.toString()).to.be.equal(poolBukh.toString());
        expect(event.amount.toString()).to.be.equal("100");
        expect(event.nonce.toString()).to.be.equal("1");
      }
    );
    await program.methods
      .lockToken(new anchor.BN(100))
      .accounts({
        bridge: bridgeKeypair.publicKey,
        mint: mintBukhKeypair.publicKey,
        payerAccount: userAccount,
        poolAuthority: poolBukhAuthority,
        pool: poolBukh,
        payer: user.publicKey,
      })
      .signers([user])
      .rpc()
      .catch((err) => {
        console.log(err);
      });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    program.removeEventListener(listenerMyEvent);
  });
});
