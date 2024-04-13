use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::*;

pub fn owner_withdraw(
    ctx: Context<OwnerWithdraw>,
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Err(BridgeError::InvalidAmount.into());
    }

    let authority_bump = ctx.bumps.pool_authority;
    let authority_seeds = &[
        &ctx.accounts.mint.key().to_bytes(),
        constants::AUTHORITY_SEED.as_bytes(),
        &[authority_bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool.to_account_info(),
                to: ctx.accounts.admin_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct OwnerWithdraw<'info> {
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub bridge: Account<'info, Bridge>,

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
        associated_token::authority = pool_authority,
    )]
    pub pool: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub admin_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        address = bridge.admin,
    )]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
