## Summary
- Dynamic settings KV table in SpacetimeDB with reducers and seeded defaults
- Frontend subscription + helpers to read typed settings
- Admin UI to edit content/rules + announcement templates
- Guess validation uses settings (min/max); homepage text is dynamic
- Improved mempool API helpers and robust CurrentRound display

## Server (Rust / SpacetimeDB)
- Added settings table (key/value) and reducers: save_setting, delete_setting
- Seeded defaults in init() including:
  - homepage_title, homepage_tagline, metadata_*
  - announce_template_round_start, announce_template_results
  - admin_poll_interval_seconds, admin_announce_requires_fid
  - guess_min/guess_max, require_fid_for_guess
  - checkin_base_points, checkin_streak_bonus_per_day, checkin_week_window_days
- submit_guess enforces dynamic min/max range
- daily_checkin uses dynamic base + streak bonus points
- Prize currency is now configurable (no hard-coded )

## Client (Next.js/TS)
- GameContext: subscribes to settings; exposes getSetting/getInt/getBool; weekly leaderboard window reads from settings
- AdminPanel: new "Site Settings" section; announcement templates; poll interval; gating dmin_announce_requires_fid; editable currency
- GuessForm: validates range via settings; dynamic placeholder
- Homepage: title/tagline read from settings
- CurrentRound: safer N/A fallbacks; Mempool API: added lock-by-height flow

## Validation
- pnpm build → Compiled successfully
- pnpm lint → No ESLint warnings or errors

## Notes / Follow‑ups
- If SpacetimeDB module schema changed, republish module and regenerate TS bindings
- Default settings are auto-seeded on init; admins can edit any time
