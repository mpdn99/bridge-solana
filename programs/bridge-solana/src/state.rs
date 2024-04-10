use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Bridge {
    pub admin: Pubkey,
    pub unlocker: Pubkey,
    pub fee: u16,
    pub nonce: u64,
}

impl Bridge {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 2 + 8;
}

#[account]
#[derive(Default)]
pub struct ProcessedNonce {
    pub nonce: u64,
    pub processed: bool,
}

impl ProcessedNonce {
    pub const LEN: usize = 8 + 8 + 1;
}