use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use solana_program::instruction::Instruction;
use solana_program::sysvar::instructions::{load_instruction_at_checked, ID as IX_ID};

use crate::*;

pub fn withdraw_token(
    ctx: Context<WithdrawToken>,
    nonce: u64,
    amount: u64,
    sig: [u8; 64],
) -> Result<()> {
    if amount == 0 {
        return Err(BridgeError::InvalidAmount.into());
    }
    let processed_nonce = &mut ctx.accounts.processed_nonce;
    if processed_nonce.processed {
        return Err(BridgeError::NonceAlreadyProcessed.into());
    }

    let msg = [
        ctx.accounts.mint.key().to_string().into_bytes(),
        amount.to_string().into_bytes(),
        nonce.to_string().into_bytes(),
    ]
    .concat();

    let bridge = &ctx.accounts.bridge;
    let pubkey = bridge.unlocker.to_bytes();

    let ix: Instruction = load_instruction_at_checked(0, &ctx.accounts.ix_sysvar)?;
    utils::verify_ed25519_ix(&ix, &pubkey, &msg, &sig)?;

    processed_nonce.processed = true;

    let unlock_fee = amount * bridge.fee as u64 / 1000;
    let amount = amount - unlock_fee;

    let authority_bump = ctx.bumps.pool_authority;
    let authority_seeds = &[
        &ctx.accounts.mint.key().to_bytes(),
        constants::AUTHORITY_SEED.as_bytes(),
        &[authority_bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];

    emit!(BridgeTransferEvent {
        mint: ctx.accounts.mint.key(),
        from: ctx.accounts.pool.key(),
        to: ctx.accounts.payer_account.key(),
        amount,
        nonce: nonce,
    });

    if unlock_fee > 0 {
        emit!(FeeReleasedToCollectorEvent { unlock_fee });
    }

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool.to_account_info(),
                to: ctx.accounts.payer_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(nonce: u64, amount: u64, sig: [u8; 64])]
pub struct WithdrawToken<'info> {
    /// CHECK: The address check is needed because otherwise
    #[account(address = IX_ID)]
    pub ix_sysvar: AccountInfo<'info>,

    pub mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub bridge: Account<'info, Bridge>,

    #[account(
        init_if_needed,
        payer = payer,
        space = ProcessedNonce::LEN,
        seeds = [
            constants::NONCE_SEED.as_ref(),
            nonce.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub processed_nonce: Account<'info, ProcessedNonce>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub payer_account: Account<'info, TokenAccount>,

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

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
