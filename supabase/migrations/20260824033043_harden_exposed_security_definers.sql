alter view public.properties_summary set (security_invoker = true);
alter view public.properties_with_images set (security_invoker = true);
alter view public.kmz_locations_search set (security_invoker = true);
alter view public.opportunity_activity_feed set (security_invoker = true);
alter view public.kmz_individual_audit_v1 set (security_invoker = true);
alter view public.kmz_inventory_status set (security_invoker = true);
alter view public.kmz_inventory_region_summary set (security_invoker = true);
alter view public.kmz_missing_rol_queue set (security_invoker = true);

revoke all on function public.create_notification(uuid, character varying, character varying, character varying, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_notification(uuid, character varying, character varying, character varying, text, text, jsonb) to service_role;

revoke all on function public.create_profile_safely(uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_profile_safely(uuid, text, text) to service_role;

revoke all on function public.deduplicate_properties_external() from public, anon, authenticated;
grant execute on function public.deduplicate_properties_external() to service_role;

revoke all on function public.get_table_columns(text) from public, anon, authenticated;
grant execute on function public.get_table_columns(text) to service_role;

revoke all on function public.mark_notification_read(uuid) from public, anon, authenticated;
grant execute on function public.mark_notification_read(uuid) to service_role;

revoke all on function public.recompute_market_comparables(text, text) from public, anon, authenticated;
grant execute on function public.recompute_market_comparables(text, text) to service_role;
