import * as anchor from "@project-serum/anchor";
import { admin, adminAccount, bridge, mintBukhKeypair, poolBukh, poolBukhAuthority, program } from "./initialize";

describe("Owner withdraw token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("Owner withdraw token sucessfully", async () => {
    await program.methods
      .ownerWithdraw(new anchor.BN(100))
      .accounts({
        bridge: bridge,
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
