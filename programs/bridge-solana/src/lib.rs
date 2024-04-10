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


declare_id!("3s5RTyytWRct96npYMiBvpQ9CbbjecgFaibvsSS4vPWn");

#[program]
pub mod bridge_solana {
    use super::*;

    pub fn create_bridge(ctx: Context<CreateBridge>, fee: u16) -> Result<()> {
        instructions::create_bridge::create_bridge(ctx, fee)
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
}