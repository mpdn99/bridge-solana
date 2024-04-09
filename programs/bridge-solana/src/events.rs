use anchor_lang::prelude::*;

use crate::*;

#[event]
pub struct LockTokenEvent {
    #[index]
    pub mint: Pubkey,
    #[index]
    pub from: Pubkey,
    #[index]
    pub to: Pubkey,
    pub amount: u64,
    pub nonce: u64,
}