use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use crate::{
    constants::AUTHORITY_SEED,
    state::Bridge,
};

pub fn create_bridge(ctx: Context<CreateBridge>, fee: u16) -> Result<()> {
    let bridge = &mut ctx.accounts.bridge;
    bridge.admin = *ctx.accounts.admin.key;
    bridge.fee_collector = *ctx.accounts.fee_collector.key;
    bridge.unlocker = *ctx.accounts.unlocker.key;
    bridge.fee = fee;
    bridge.nonce = 1;
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(fee: u16)]
pub struct CreateBridge<'info> {
    #[account(
        init, 
        payer = admin, 
        space = Bridge::LEN
    )]
    pub bridge: Account<'info, Bridge>,

    pub mint_bukh: Box<Account<'info, Mint>>,
    pub mint_sukh: Box<Account<'info, Mint>>,

    #[account(
        seeds = [
            mint_bukh.key().as_ref(),
            AUTHORITY_SEED.as_ref(),
        ],
        bump
    )]
    pub pool_bukh_authority: AccountInfo<'info>,

    #[account(
        seeds = [
            mint_sukh.key().as_ref(),
            AUTHORITY_SEED.as_ref(),
        ],
        bump
    )]
    pub pool_sukh_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_bukh,
        associated_token::authority = pool_bukh_authority,
    )]
    pub pool_bukh: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_sukh,
        associated_token::authority = pool_sukh_authority,
    )]
    pub pool_sukh: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub fee_collector: AccountInfo<'info>,
    pub unlocker: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
