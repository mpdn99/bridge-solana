import * as anchor from "@project-serum/anchor";
import { BridgeSolana } from "../target/types/bridge_solana";
import { expect } from "chai";
import { createMint } from "@solana/spl-token";
import { ed25519 } from "@noble/curves/ed25519";

describe("Withdraw Token", () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  const program = anchor.workspace.BridgeSolana as anchor.Program<BridgeSolana>;

  const person: anchor.web3.Keypair = anchor.web3.Keypair.generate();

  const mintKeypair = anchor.web3.Keypair.generate();

  let signature: Uint8Array; // 64 bytes of sig

  let amount = 100;
  let nonce = 1;

  let message = Buffer.concat([
    Buffer.from(mintKeypair.publicKey.toString()),
    Buffer.from(amount.toString()),
    Buffer.from(nonce.toString()),
  ]);

  before(async () => {
    // Fund person
    let txid = await provider.connection.requestAirdrop(
      person.publicKey,
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
      person,
      person.publicKey,
      person.publicKey,
      6,
      mintKeypair
    );

    signature = ed25519.sign(message, person.secretKey.slice(0, 32));
  });

  it("Withdraw Token", async () => {
    try {
      await program.methods
        .withdrawToken(
          Array.from(person.publicKey.toBuffer()),
          new anchor.BN(amount),
          new anchor.BN(nonce),
          Array.from(signature)
        )
        .accounts({
          sender: person.publicKey,
          ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          mint: mintKeypair.publicKey,
        })
        .signers([person])
        .preInstructions([
          anchor.web3.Ed25519Program.createInstructionWithPublicKey({
            publicKey: person.publicKey.toBytes(),
            message: message,
            signature: signature,
          }),
        ])
        .rpc()
        .catch((err) => {
          console.log(err);
          throw err;
        });
    } catch (error) {
      expect(error.toString()).to.eq(
        "Error: failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1"
      );
    }
  });
});
