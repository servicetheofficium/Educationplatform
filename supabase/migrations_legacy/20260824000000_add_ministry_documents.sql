CREATE TABLE IF NOT EXISTS "public"."ministry_documents" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "document_name" character varying(200) NOT NULL,
    "received_date" date NOT NULL,
    "staff_name" character varying(150),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "ministry_documents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."ministry_documents" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS idx_ministry_documents_received_date ON public.ministry_documents(received_date);

ALTER TABLE "public"."ministry_documents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ministry_documents_select_admin" ON public.ministry_documents;
CREATE POLICY "ministry_documents_select_admin" ON public.ministry_documents
  FOR SELECT USING ((select public.is_admin()));

DROP POLICY IF EXISTS "ministry_documents_insert_admin" ON public.ministry_documents;
CREATE POLICY "ministry_documents_insert_admin" ON public.ministry_documents
  FOR INSERT WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "ministry_documents_update_admin" ON public.ministry_documents;
CREATE POLICY "ministry_documents_update_admin" ON public.ministry_documents
  FOR UPDATE USING ((select public.is_admin()));

DROP POLICY IF EXISTS "ministry_documents_delete_admin" ON public.ministry_documents;
CREATE POLICY "ministry_documents_delete_admin" ON public.ministry_documents
  FOR DELETE USING ((select public.is_admin()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ministry_documents TO authenticated;
