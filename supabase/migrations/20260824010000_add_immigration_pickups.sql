ALTER TABLE "public"."ministry_documents"
  ADD COLUMN IF NOT EXISTS "picked_up_at" date;

CREATE TABLE IF NOT EXISTS "public"."immigration_pickups" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "document_name" character varying(200) NOT NULL,
    "pickup_date" date NOT NULL,
    "recipient_name" character varying(150),
    "ministry_document_id" uuid REFERENCES "public"."ministry_documents"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "immigration_pickups_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."immigration_pickups" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS idx_immigration_pickups_pickup_date ON public.immigration_pickups(pickup_date);
CREATE INDEX IF NOT EXISTS idx_immigration_pickups_ministry_document_id ON public.immigration_pickups(ministry_document_id);
CREATE INDEX IF NOT EXISTS idx_ministry_documents_picked_up_at ON public.ministry_documents(picked_up_at);

ALTER TABLE "public"."immigration_pickups" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "immigration_pickups_select_admin" ON public.immigration_pickups;
CREATE POLICY "immigration_pickups_select_admin" ON public.immigration_pickups
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "immigration_pickups_insert_admin" ON public.immigration_pickups;
CREATE POLICY "immigration_pickups_insert_admin" ON public.immigration_pickups
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "immigration_pickups_update_admin" ON public.immigration_pickups;
CREATE POLICY "immigration_pickups_update_admin" ON public.immigration_pickups
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "immigration_pickups_delete_admin" ON public.immigration_pickups;
CREATE POLICY "immigration_pickups_delete_admin" ON public.immigration_pickups
  FOR DELETE USING ((select public.is_admin()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.immigration_pickups TO authenticated;
