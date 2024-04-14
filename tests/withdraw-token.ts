import * as anchor from "@project-serum/anchor";
import {
  mintTo,
} from "@solana/spl-token";
import { ed25519 } from "@noble/curves/ed25519";
import { BN } from "bn.js";
import { expect } from "chai";
import { admin, bridge, mintBukhKeypair, poolBukh, poolBukhAuthority, program, unlocker, user, userAccount } from "./initialize";

describe("Withdraw Token", () => {
  let amount = 100;
  let nonce = 1;

  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  let signature: Uint8Array; // 64 bytes of sig

  let message = Buffer.concat([
    Buffer.from(mintBukhKeypair.publicKey.toString()),
    Buffer.from(amount.toString()),
    Buffer.from(nonce.toString()),
  ]);

  const processedNonce = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("nonce"), new BN(nonce).toArrayLike(Buffer, "le", 8)],
    program.programId
  )[0];

  before(async () => {
    await mintTo(
      connection,
      admin,
      mintBukhKeypair.publicKey,
      poolBukh,
      admin.publicKey,
      100
    );

    signature = ed25519.sign(message, unlocker.secretKey.slice(0, 32));
  });

  it("Withdraw Token", async () => {
    const listenerMyEvent = program.addEventListener(
      "BridgeTransferEvent",
      (event) => {
        expect(event.mint.toString()).to.be.equal(
          mintBukhKeypair.publicKey.toString()
        );
        expect(event.from.toString()).to.be.equal(poolBukh.toString());
        expect(event.to.toString()).to.be.equal(userAccount.toString());
        expect(event.amount.toString()).to.be.equal((amount-amount*10/1000).toString());
        expect(event.nonce.toString()).to.be.equal(nonce.toString());
      }
    );
    await program.methods
      .withdrawToken(
        new anchor.BN(nonce),
        new anchor.BN(amount),
        Array.from(signature)
      )
      .accounts({
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        mint: mintBukhKeypair.publicKey,
        bridge: bridge,
        payer: user.publicKey,
        pool: poolBukh,
        poolAuthority: poolBukhAuthority,
        payerAccount: userAccount,
        processedNonce: processedNonce,
      })
      .signers([user])
      .preInstructions([
        anchor.web3.Ed25519Program.createInstructionWithPublicKey({
          publicKey: unlocker.publicKey.toBytes(),
          message: message,
          signature: signature,
        }),
      ])
      .rpc()
      .catch((err) => {
        console.log(err);
        throw err;
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));
      program.removeEventListener(listenerMyEvent);
  });
});
