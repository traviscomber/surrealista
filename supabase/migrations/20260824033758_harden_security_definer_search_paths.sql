alter function public.create_notification(uuid, character varying, character varying, character varying, text, text, jsonb) set search_path = public, pg_temp;
alter function public.create_profile_safely(uuid, text, text) set search_path = public, pg_temp;
alter function public.deduplicate_properties_external() set search_path = public, pg_temp;
alter function public.get_table_columns(text) set search_path = public, pg_temp;
alter function public.mark_notification_read(uuid) set search_path = public, pg_temp;
alter function public.recompute_market_comparables(text, text) set search_path = public, pg_temp;
