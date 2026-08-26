-- Pin search_path on functions that didn't have it set, closing the
-- search_path-injection class of risk flagged by the Supabase security advisor.
ALTER FUNCTION "public"."handle_new_user"() SET "search_path" TO 'public';
ALTER FUNCTION "public"."update_updated_at"() SET "search_path" TO 'public';
