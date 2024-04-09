use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod state;
mod events;

pub use instructions::*;

declare_id!("3s5RTyytWRct96npYMiBvpQ9CbbjecgFaibvsSS4vPWn");

#[program]
pub mod bridge_solana {
    use super::*;

    pub fn create_bridge(ctx: Context<CreateBridge>, fee: u16) -> Result<()> {
        instructions::create_bridge::create_bridge(ctx, fee)
    }
}

