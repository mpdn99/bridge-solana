use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, Transfer};

use crate::*;

pub fn lock_token(ctx: Context<LockToken>, amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(BridgeError::InvalidAmount.into());
    }
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.bridge.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    emit!(BridgeTransferEvent {
        mint: ctx.accounts.mint.key(),
        from: ctx.accounts.user.key(),
        to: ctx.accounts.bridge.key(),
        amount,
        nonce: ctx.accounts.bridge.nonce,
    });

    ctx.accounts.bridge.nonce += 1;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct LockToken<'info> {
    #[account(mut)]
    pub bridge: Account<'info, Bridge>,

    pub mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
