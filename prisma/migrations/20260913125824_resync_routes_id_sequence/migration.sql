-- The GPX backfill inserted ~7,500 rows with explicit ids, which bypasses
-- routes_id_seq and never advances it. Left alone, the sequence stays parked
-- at the last organically-created id and will eventually collide with an
-- imported id once real usage catches up, breaking route saves.
--
-- Resync the sequence to the current max id so autoincrement always issues
-- ids above every id that has ever existed, even after rows are deleted.
SELECT setval('routes_id_seq', (SELECT MAX(id) FROM public.routes));
