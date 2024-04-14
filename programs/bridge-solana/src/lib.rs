use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod state;
mod events;
mod utils;

pub use instructions::*;
pub use state::*;
pub use events::*;
pub use errors::*;
pub use utils::*;


declare_id!("HEMyDNhTcEu1Xhqk4pUMTQvQ42kx3C63FBjN4BgBTXnB");

#[program]
pub mod bridge_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee: u16) -> Result<()> {
        instructions::initialize::initialize(ctx, fee)
    }
    pub fn lock_token(ctx: Context<LockToken>, amount: u64) -> Result<()> {
        instructions::lock_token::lock_token(ctx, amount)
    }

    pub fn withdraw_token(
        ctx: Context<WithdrawToken>,
        amount: u64,
        nonce: u64,
        sig: [u8; 64],
    ) -> Result<()> {
        instructions::withdraw_token::withdraw_token(ctx, amount, nonce, sig)
    }

    pub fn owner_withdraw(ctx: Context<OwnerWithdraw>, amount: u64) -> Result<()> {
        instructions::owner_withdraw::owner_withdraw(ctx, amount)
    }
}