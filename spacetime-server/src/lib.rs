#![allow(unused_imports)]
#![allow(dead_code)]

// Bitcoin Blocks SpacetimeDB module (maincloud)
// Tables and reducers aligned with generated TypeScript bindings under src/spacetime_module_bindings

use spacetimedb::{reducer, table, ReducerContext, Table};
use std::time::{SystemTime, UNIX_EPOCH};

// Chat messages table
#[table(name = chat_messages, public)]
#[derive(Clone, Debug)]
pub struct ChatMessage {
    #[primary_key]
    #[auto_inc]
    pub chat_id: u64,
    pub round_id: String,
    pub address: String,
    pub username: String,
    pub message: String,
    pub pfp_url: String,
    pub timestamp: i64,
    pub msg_type: String,
}

// User guesses table
#[table(name = guesses, public)]
#[derive(Clone, Debug)]
pub struct Guess {
    #[primary_key]
    #[auto_inc]
    pub guess_id: u64,
    pub round_id: u64,
    pub fid: i64,
    pub username: String,
    pub guess: i64,
    pub pfp_url: Option<String>,
    pub submitted_at: i64,
}

// Logs table (simple event log)
#[table(name = logs, public)]
#[derive(Clone, Debug)]
pub struct LogEvent {
    #[primary_key]
    #[auto_inc]
    pub log_id: u64,
    pub event_type: String,
    pub details: String,
    pub timestamp: i64,
}

// Prize configuration (single row, id = 1)
#[table(name = prize_config, public)]
#[derive(Clone, Debug)]
pub struct PrizeConfig {
    #[primary_key]
    pub config_id: u8,
    pub jackpot_amount: i64,
    pub first_place_amount: i64,
    pub second_place_amount: i64,
    pub currency_type: String,
    pub token_contract_address: String,
    pub updated_at: i64,
}

// Game rounds
#[table(name = rounds, public)]
#[derive(Clone, Debug)]
pub struct Round {
    #[primary_key]
    #[auto_inc]
    pub round_id: u64,
    pub round_number: i64,
    pub start_time: i64,
    pub end_time: i64,
    pub duration_minutes: i64,
    pub prize: String,
    pub status: String,
    pub block_number: Option<i64>,
    pub actual_tx_count: Option<i64>,
    pub winning_fid: Option<i64>,
    pub second_place_winner_fid: Option<i64>,
    pub block_hash: Option<String>,
    pub created_at: i64,
}

// --- Reducers ---

// Helper: return current timestamp in SECONDS based on reducer context
// Frontend converts seconds -> ms
fn now_secs(_ctx: &ReducerContext) -> i64 {
    // Fallback to host time; sufficient for ordering/countdowns
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

#[reducer]
pub fn create_round(
    ctx: &ReducerContext,
    round_number: i64,
    duration_minutes: i64,
    prize: String,
    block_number: Option<i64>,
) {
    let start = now_secs(ctx);
    // Store seconds in DB; frontend multiplies by 1000
    let end = start + duration_minutes.saturating_mul(60);

    ctx.db.rounds().insert(Round {
        round_id: 0, // auto_inc
        round_number,
        start_time: start,
        end_time: end,
        duration_minutes,
        prize,
        status: "open".to_string(),
        block_number,
        actual_tx_count: None,
        winning_fid: None,
        second_place_winner_fid: None,
        block_hash: None,
        created_at: start,
    });
}

#[reducer]
pub fn end_round_manually(_ctx: &ReducerContext, _round_id: u64) { }

#[reducer]
pub fn get_active_round(_ctx: &ReducerContext) {
    // No-op; clients subscribe to tables directly
}

#[reducer]
pub fn get_prize_config(_ctx: &ReducerContext) {
    // No-op; clients subscribe to tables directly
}

#[reducer]
pub fn save_prize_config(
    ctx: &ReducerContext,
    jackpot_amount: i64,
    first_place_amount: i64,
    second_place_amount: i64,
    currency_type: String,
    token_contract_address: String,
) {
    let updated_at = now_secs(ctx);
    // Upsert row with id = 1: delete any existing then insert fresh
    for existing in ctx.db.prize_config().iter() {
        ctx.db.prize_config().delete(existing);
    }

    let row = PrizeConfig {
        config_id: 1,
        jackpot_amount,
        first_place_amount,
        second_place_amount,
        currency_type,
        token_contract_address,
        updated_at,
    };
    ctx.db.prize_config().insert(row);
}

#[reducer]
pub fn send_chat_message(
    ctx: &ReducerContext,
    round_id: String,
    address: String,
    username: String,
    message: String,
    pfp_url: String,
    msg_type: String,
) {
    let ts = now_secs(ctx);
    ctx.db.chat_messages().insert(ChatMessage {
        chat_id: 0, // auto_inc
        round_id,
        address,
        username,
        message,
        pfp_url,
        timestamp: ts,
        msg_type,
    });
}

#[reducer]
pub fn submit_guess(
    ctx: &ReducerContext,
    round_id: u64,
    fid: i64,
    username: String,
    guess: i64,
    pfp_url: Option<String>,
) {
    let ts = now_secs(ctx);
    ctx.db.guesses().insert(Guess {
        guess_id: 0, // auto_inc
        round_id,
        fid,
        username,
        guess,
        pfp_url,
        submitted_at: ts,
    });
}

#[reducer]
pub fn update_round_result(
    ctx: &ReducerContext,
    round_id: u64,
    actual_tx_count: i64,
    block_hash: String,
    winning_fid: i64,
) {
    // Log only; table updates omitted for portability
    let ts = now_secs(ctx);
    ctx.db.logs().insert(LogEvent {
        log_id: 0,
        event_type: "update_round_result".to_string(),
        details: format!("round_id={};txcount={};winner={}", round_id, actual_tx_count, winning_fid),
        timestamp: ts,
    });
}
