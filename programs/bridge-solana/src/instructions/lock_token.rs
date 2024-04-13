use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::*;

pub fn lock_token(ctx: Context<LockToken>, amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(BridgeError::InvalidAmount.into());
    }
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payer_account.to_account_info(),
                to: ctx.accounts.pool.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        amount,
    )?;

    emit!(BridgeTransferEvent {
        mint: ctx.accounts.mint.key(),
        from: ctx.accounts.payer_account.key(),
        to: ctx.accounts.pool.key(),
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
    pub payer: Signer<'info>,

    /// CHECK: Read only authority
    #[account(
            seeds = [
                mint.key().as_ref(),
                constants::AUTHORITY_SEED.as_ref(),
            ],
            bump
        )]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub payer_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = pool_authority,
    )]
    pub pool: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
