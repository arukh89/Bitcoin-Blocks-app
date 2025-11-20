#![allow(unused_imports)]
#![allow(dead_code)]

// Bitcoin Blocks SpacetimeDB module (maincloud)
// Tables and reducers aligned with generated TypeScript bindings under src/spacetime_module_bindings

use spacetimedb::{reducer, table, ReducerContext, Table, Timestamp, ScheduleAt};
use core::time::Duration;
use std::time::UNIX_EPOCH;

// Check-ins: daily points + streaks
#[table(name = checkins, public)]
#[derive(Clone, Debug)]
pub struct CheckIn {
    #[primary_key]
    #[auto_inc]
    pub checkin_id: u64,
    pub user_identifier: String,
    pub username: String,
    pub pfp_url: String,
    pub checkin_date: i64,
    pub points_earned: i64,
    pub streak_count: i64,
}

#[table(name = user_stats, public)]
#[derive(Clone, Debug)]
pub struct UserStat {
    #[primary_key]
    #[auto_inc]
    pub stat_id: u64,
    #[unique]
    pub user_identifier: String,
    pub username: String,
    pub pfp_url: String,
    pub total_points: i64,
    pub current_streak: i64,
    pub longest_streak: i64,
    pub last_checkin_date: i64,
    pub total_checkins: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

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

// Scheduled timer to periodically enforce round state (auto-close)
#[table(name = round_timer, scheduled(tick_rounds))]
#[derive(Clone, Debug)]
pub struct RoundTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

// --- Reducers ---

// Helper: return current timestamp in SECONDS based on reducer context
// Frontend converts seconds -> ms
fn now_secs(ctx: &ReducerContext) -> i64 {
    // Use reducer invocation timestamp (host-provided) and convert to seconds
    let st: std::time::SystemTime = ctx.timestamp.into();
    st.duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn day_start(ts: i64) -> i64 { ts - (ts % 86_400) }

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

    // Ensure periodic timer exists even on upgraded deployments
    let mut has_timer = false;
    for _t in ctx.db.round_timer().iter() { has_timer = true; break; }
    if !has_timer {
        ctx.db.round_timer().insert(RoundTimer {
            scheduled_id: 0,
            scheduled_at: ScheduleAt::Interval(Duration::from_secs(5).into()),
        });
    }

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

// Run once on first publish (and when clearing data). Start periodic timer.
#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    // Ensure exactly one periodic timer exists (every 5 seconds)
    let mut has_timer = false;
    for _t in ctx.db.round_timer().iter() { has_timer = true; break; }
    if !has_timer {
        ctx.db.round_timer().insert(RoundTimer {
            scheduled_id: 0,
            scheduled_at: ScheduleAt::Interval(Duration::from_secs(5).into()),
        });
    }
}

// Scheduled reducer: close any rounds whose end_time has passed
#[reducer]
pub fn tick_rounds(ctx: &ReducerContext, _timer: RoundTimer) {
    let now = now_secs(ctx);
    // Iterate and close overdue open rounds
    let mut closed_count = 0i64;
    for r in ctx.db.rounds().iter() {
        if r.status == "open" && r.end_time <= now {
            let mut updated = r.clone();
            updated.status = "closed".to_string();
            ctx.db.rounds().delete(r);
            ctx.db.rounds().insert(updated);
            closed_count += 1;
        }
    }

    if closed_count > 0 {
        ctx.db.logs().insert(LogEvent {
            log_id: 0,
            event_type: "auto_close_rounds".to_string(),
            details: format!("closed={} at {}", closed_count, now),
            timestamp: now,
        });
    }
}

#[reducer]
pub fn end_round_manually(ctx: &ReducerContext, round_id: u64) {
    // Mark the round as closed (lock submissions)
    for r in ctx.db.rounds().iter() {
        if r.round_id == round_id {
            let mut updated = r.clone();
            updated.status = "closed".to_string();
            ctx.db.rounds().delete(r);
            ctx.db.rounds().insert(updated);
            break;
        }
    }

    // Log action
    let ts = now_secs(ctx);
    ctx.db.logs().insert(LogEvent {
        log_id: 0,
        event_type: "end_round_manually".to_string(),
        details: format!("round_id={}", round_id),
        timestamp: ts,
    });
}

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
    // Update the round row with results and mark as finished
    let mut found = false;
    for r in ctx.db.rounds().iter() {
        if r.round_id == round_id {
            let mut updated = r.clone();
            updated.status = "finished".to_string();
            updated.actual_tx_count = Some(actual_tx_count);
            updated.block_hash = Some(block_hash.clone());
            updated.winning_fid = Some(winning_fid);

            ctx.db.rounds().delete(r);
            ctx.db.rounds().insert(updated);
            found = true;
            break;
        }
    }

    // Log the update
    let ts = now_secs(ctx);
    let details = if found {
        format!(
            "updated round_id={};txcount={};winner={}",
            round_id, actual_tx_count, winning_fid
        )
    } else {
        format!(
            "round not found: round_id={};txcount={};winner={}",
            round_id, actual_tx_count, winning_fid
        )
    };
    ctx.db.logs().insert(LogEvent {
        log_id: 0,
        event_type: "update_round_result".to_string(),
        details,
        timestamp: ts,
    });
}

// Daily check-in with streaks and points
#[reducer]
pub fn daily_checkin(
    ctx: &ReducerContext,
    user_identifier: String,
    username: String,
    pfp_url: String,
) {
    let now = now_secs(ctx);
    let today = day_start(now);

    // If already checked in today, no-op
    for c in ctx.db.checkins().iter() {
        if c.user_identifier == user_identifier && day_start(c.checkin_date) == today {
            return;
        }
    }

    // Load existing user stats (if any)
    let mut existing: Option<UserStat> = None;
    for s in ctx.db.user_stats().iter() {
        if s.user_identifier == user_identifier {
            existing = Some(s.clone());
            break;
        }
    }

    let (new_streak, total_checkins, total_points, longest_streak) = if let Some(mut s) = existing {
        let last_day = day_start(s.last_checkin_date);
        let yesterday = today - 86_400;
        let new_streak = if last_day == yesterday { s.current_streak + 1 } else if last_day < yesterday { 1 } else { s.current_streak };
        let points = 10 + (new_streak * 2);
        s.current_streak = new_streak;
        s.total_points += points;
        if s.current_streak > s.longest_streak { s.longest_streak = s.current_streak; }
        s.last_checkin_date = now;
        s.total_checkins += 1;
        s.updated_at = now;
        s.username = username.clone();
        s.pfp_url = pfp_url.clone();
        // Replace row (update semantics)
        let pk = s.stat_id;
        for row in ctx.db.user_stats().iter() { if row.stat_id == pk { ctx.db.user_stats().delete(row); break; } }
        ctx.db.user_stats().insert(s.clone());
        (new_streak, s.total_checkins, s.total_points, s.longest_streak)
    } else {
        let points = 10 + 2; // base + day-1 bonus
        let s = UserStat {
            stat_id: 0,
            user_identifier: user_identifier.clone(),
            username: username.clone(),
            pfp_url: pfp_url.clone(),
            total_points: points,
            current_streak: 1,
            longest_streak: 1,
            last_checkin_date: now,
            total_checkins: 1,
            created_at: now,
            updated_at: now,
        };
        ctx.db.user_stats().insert(s);
        (1, 1, points, 1)
    };

    let points_earned = 10 + (new_streak * 2);
    ctx.db.checkins().insert(CheckIn {
        checkin_id: 0,
        user_identifier: user_identifier.clone(),
        username: username.clone(),
        pfp_url: pfp_url.clone(),
        checkin_date: now,
        points_earned,
        streak_count: new_streak,
    });

    ctx.db.logs().insert(LogEvent {
        log_id: 0,
        event_type: "daily_checkin".to_string(),
        details: format!(
            "user={} streak={} points_earned={} total_points={} total_checkins={} longest_streak={}",
            user_identifier, new_streak, points_earned, total_points, total_checkins, longest_streak
        ),
        timestamp: now,
    });
}
