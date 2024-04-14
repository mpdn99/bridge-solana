import * as anchor from "@project-serum/anchor";
import { expect } from "chai";
import {
  bridge,
  mintBukhKeypair,
  poolBukh,
  poolBukhAuthority,
  program,
  user,
  userAccount,
} from "./initialize";

describe("Lock token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

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
        bridge: bridge,
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
