-- Redo: keeps the version that was undone, so users can switch between the two without a new AI call.
alter table trips add column if not exists redo_plan jsonb;
