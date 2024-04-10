use anchor_lang::prelude::*;

#[event]
pub struct BridgeTransferEvent {
    #[index]
    pub mint: Pubkey,
    #[index]
    pub from: Pubkey,
    #[index]
    pub to: Pubkey,
    pub amount: u64,
    pub nonce: u64,
}

#[event]
pub struct FeeReleasedToCollectorEvent {
    #[index]
    pub unlock_fee: u64,
}