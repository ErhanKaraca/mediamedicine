-- Tighten RPC execute grants (security advisor)

revoke execute on function public.claim_pending_notification_deliveries(integer, text) from anon, authenticated;
grant execute on function public.claim_pending_notification_deliveries(integer, text) to service_role;

revoke execute on function public.should_notify_channel(uuid, uuid, text, text) from anon, authenticated;
grant execute on function public.should_notify_channel(uuid, uuid, text, text) to service_role;

revoke execute on function public.can_message(uuid, uuid) from anon;
grant execute on function public.can_message(uuid, uuid) to authenticated, service_role;

revoke execute on function public.find_direct_conversation(uuid, uuid) from anon;
grant execute on function public.find_direct_conversation(uuid, uuid) to authenticated, service_role;
