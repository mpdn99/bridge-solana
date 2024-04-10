use anchor_lang::prelude::*;

#[error_code]
pub enum BridgeError {
    #[msg("Invalid amount value")]
    InvalidAmount,
    #[msg("Signature verification failed.")]
    SigVerificationFailed,
    #[msg("Nonce already processed.")]
    NonceAlreadyProcessed,
}