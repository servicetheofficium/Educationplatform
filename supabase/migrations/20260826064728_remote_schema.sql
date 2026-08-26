


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND user_type = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "admin_name" character varying(255),
    "action" character varying(20) NOT NULL,
    "target_table" character varying(100) NOT NULL,
    "target_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_activity_log_action_check" CHECK ((("action")::"text" = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying])::"text"[])))
);


ALTER TABLE "public"."admin_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "phone" character varying,
    "email" character varying,
    "nationality" character varying,
    "company_name" character varying,
    "id_passport_number" character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "course_id" "uuid",
    "message" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "nationality" character varying(100),
    "passport_number" character varying(50),
    "visa_status" character varying(50),
    "duration_months" "text",
    "visa_change_date" "date",
    "visa_last_date" "date",
    "school_student_id" character varying(20),
    "doc_status" character varying(20) DEFAULT 'pending'::character varying,
    CONSTRAINT "applications_status_check" CHECK ((("status")::"text" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'contacted'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "applications_visa_status_check" CHECK ((("visa_status")::"text" = ANY (ARRAY['processing'::"text", 'visa_changed'::"text", 'first_extension'::"text", 'second_extension'::"text", 'third_extension'::"text", 'fourth_extension'::"text", 'fifth_extension'::"text"])))
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "language" character varying(100) NOT NULL,
    "level" character varying(50) NOT NULL,
    "max_students" integer DEFAULT 30 NOT NULL,
    "duration_weeks" integer NOT NULL,
    "price" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "image_url" character varying(500),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "courses_level_check" CHECK ((("level")::"text" = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::"text"[])))
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "price_display" character varying(100) NOT NULL,
    "price_thb" numeric DEFAULT 0,
    "detail" character varying(200),
    "processing_time" character varying(100),
    "note" character varying(300),
    "category" character varying(20) DEFAULT 'document'::character varying NOT NULL,
    "icon_name" character varying(50),
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "document_services_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['document'::character varying, 'copy'::character varying])::"text"[])))
);


ALTER TABLE "public"."document_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."immigration_pickups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_name" character varying(200) NOT NULL,
    "pickup_date" "date" NOT NULL,
    "recipient_name" character varying(150),
    "ministry_document_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."immigration_pickups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ministry_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_name" character varying(200) NOT NULL,
    "received_date" "date" NOT NULL,
    "staff_name" character varying(150),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "picked_up_at" "date"
);


ALTER TABLE "public"."ministry_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255) DEFAULT ''::character varying NOT NULL,
    "user_type" character varying(50) DEFAULT 'student'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_user_type_check" CHECK ((("user_type")::"text" = ANY ((ARRAY['student'::character varying, 'admin'::character varying])::"text"[])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."receipt_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."receipt_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "receipt_no" "text" NOT NULL,
    "student_name" "text" NOT NULL,
    "phone" "text",
    "passport_no" "text",
    "course_name" "text" NOT NULL,
    "duration" "text",
    "course_fee" numeric DEFAULT 0 NOT NULL,
    "visa_fee" numeric DEFAULT 0 NOT NULL,
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "payment_method" "text" DEFAULT 'Cash'::"text",
    "paid_amount" numeric DEFAULT 0 NOT NULL,
    "change_amount" numeric DEFAULT 0 NOT NULL,
    "staff_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "items" "jsonb",
    "remaining_amount" numeric DEFAULT 0 NOT NULL,
    "next_payment_date" "date",
    "agent_name" "text",
    "agent_phone" "text",
    "agent_email" "text",
    "agent_nationality" "text",
    "agent_company_register_number" "text",
    "agent_note" "text",
    "agent_discount" numeric,
    "receipt_note" "text",
    "parent_receipt_id" "uuid"
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid",
    "service_name" character varying(200) NOT NULL,
    "name" character varying(200) NOT NULL,
    "email" character varying(200) NOT NULL,
    "phone" character varying(50),
    "student_id" "uuid",
    "quantity" integer DEFAULT 1 NOT NULL,
    "notes" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "price_thb" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "nationality" character varying(100),
    "passport_number" character varying(50),
    CONSTRAINT "service_requests_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "service_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "enrollment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" character varying(50) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "student_courses_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'dropped'::character varying])::"text"[])))
);


ALTER TABLE "public"."student_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_document_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "visa_status" character varying,
    "visa_change_date" "date",
    "visa_last_date" "date" NOT NULL,
    "doc_status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "student_document_cases_doc_status_check" CHECK ((("doc_status")::"text" = ANY ((ARRAY['pending'::character varying, 'submitted'::character varying, 'checked'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."student_document_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "enrollment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "phone" character varying(20),
    "address" "text",
    "language_level" character varying(50) DEFAULT 'beginner'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "nationality" character varying(100),
    "passport_number" character varying(50),
    "visa_status" character varying(50),
    "duration_months" "text",
    "visa_change_date" "date",
    "visa_last_date" "date",
    "school_student_id" character varying(20),
    "cancelled_at" timestamp with time zone,
    "doc_status" character varying(20) DEFAULT 'pending'::character varying,
    "name" character varying(255),
    "email" character varying(255),
    "application_id" "uuid",
    "note" "text",
    "date_of_birth" "date",
    CONSTRAINT "students_language_level_check" CHECK ((("language_level")::"text" = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::"text"[]))),
    CONSTRAINT "students_visa_status_check" CHECK ((("visa_status")::"text" = ANY (ARRAY['processing'::"text", 'visa_changed'::"text", 'first_extension'::"text", 'second_extension'::"text", 'third_extension'::"text", 'fourth_extension'::"text", 'fifth_extension'::"text"])))
);


ALTER TABLE "public"."students" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_school_student_id_key" UNIQUE ("school_student_id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_services"
    ADD CONSTRAINT "document_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."immigration_pickups"
    ADD CONSTRAINT "immigration_pickups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ministry_documents"
    ADD CONSTRAINT "ministry_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_student_id_course_id_key" UNIQUE ("student_id", "course_id");



ALTER TABLE ONLY "public"."student_document_cases"
    ADD CONSTRAINT "student_document_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_school_student_id_key" UNIQUE ("school_student_id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_admin_activity_log_admin_id" ON "public"."admin_activity_log" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_activity_log_created_at" ON "public"."admin_activity_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_applications_course_id" ON "public"."applications" USING "btree" ("course_id");



CREATE INDEX "idx_applications_created_at" ON "public"."applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_applications_email" ON "public"."applications" USING "btree" ("email");



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_courses_language" ON "public"."courses" USING "btree" ("language");



CREATE INDEX "idx_immigration_pickups_ministry_document_id" ON "public"."immigration_pickups" USING "btree" ("ministry_document_id");



CREATE INDEX "idx_immigration_pickups_pickup_date" ON "public"."immigration_pickups" USING "btree" ("pickup_date");



CREATE INDEX "idx_ministry_documents_picked_up_at" ON "public"."ministry_documents" USING "btree" ("picked_up_at");



CREATE INDEX "idx_ministry_documents_received_date" ON "public"."ministry_documents" USING "btree" ("received_date");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_service_requests_service_id" ON "public"."service_requests" USING "btree" ("service_id");



CREATE INDEX "idx_service_requests_student_id" ON "public"."service_requests" USING "btree" ("student_id");



CREATE INDEX "idx_student_courses_course_id" ON "public"."student_courses" USING "btree" ("course_id");



CREATE INDEX "idx_student_courses_status" ON "public"."student_courses" USING "btree" ("status");



CREATE INDEX "idx_student_courses_student_id" ON "public"."student_courses" USING "btree" ("student_id");



CREATE UNIQUE INDEX "idx_students_application_id" ON "public"."students" USING "btree" ("application_id") WHERE ("application_id" IS NOT NULL);



CREATE INDEX "idx_students_cancelled_at" ON "public"."students" USING "btree" ("cancelled_at");



CREATE INDEX "idx_students_user_id" ON "public"."students" USING "btree" ("user_id");



CREATE INDEX "receipts_parent_receipt_id_idx" ON "public"."receipts" USING "btree" ("parent_receipt_id");



CREATE INDEX "student_document_cases_student_id_idx" ON "public"."student_document_cases" USING "btree" ("student_id");



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."immigration_pickups"
    ADD CONSTRAINT "immigration_pickups_ministry_document_id_fkey" FOREIGN KEY ("ministry_document_id") REFERENCES "public"."ministry_documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_parent_receipt_id_fkey" FOREIGN KEY ("parent_receipt_id") REFERENCES "public"."receipts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."document_services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_document_cases"
    ADD CONSTRAINT "student_document_cases_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin full access" ON "public"."receipts" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can create agents" ON "public"."agents" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can create document cases" ON "public"."student_document_cases" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can create enrollments" ON "public"."student_courses" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can create students" ON "public"."students" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can delete agents" ON "public"."agents" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can delete applications" ON "public"."applications" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can delete courses" ON "public"."courses" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can delete document cases" ON "public"."student_document_cases" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can delete enrollments" ON "public"."student_courses" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can delete students" ON "public"."students" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can insert activity log" ON "public"."admin_activity_log" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can insert courses" ON "public"."courses" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can update agents" ON "public"."agents" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can update applications" ON "public"."applications" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can update courses" ON "public"."courses" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can update document cases" ON "public"."student_document_cases" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can update enrollments" ON "public"."student_courses" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can view activity log" ON "public"."admin_activity_log" FOR SELECT USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can view all agents" ON "public"."agents" FOR SELECT USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can view all applications" ON "public"."applications" FOR SELECT USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can view all document cases" ON "public"."student_document_cases" FOR SELECT USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ((( SELECT "public"."is_admin"() AS "is_admin") OR (( SELECT "auth"."uid"() AS "uid") = "id")));



CREATE POLICY "Anyone can create applications" ON "public"."applications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Courses are viewable by everyone" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Students can update own or admins update all" ON "public"."students" FOR UPDATE USING ((( SELECT "public"."is_admin"() AS "is_admin") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Students can view own or admins view all" ON "public"."students" FOR SELECT USING ((( SELECT "public"."is_admin"() AS "is_admin") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Students view own or admins view all enrollments" ON "public"."student_courses" FOR SELECT USING ((( SELECT "public"."is_admin"() AS "is_admin") OR ("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."admin_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_services_delete_admin" ON "public"."document_services" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "document_services_insert_admin" ON "public"."document_services" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "document_services_select_public" ON "public"."document_services" FOR SELECT USING (true);



CREATE POLICY "document_services_update_admin" ON "public"."document_services" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."immigration_pickups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "immigration_pickups_delete_admin" ON "public"."immigration_pickups" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "immigration_pickups_insert_admin" ON "public"."immigration_pickups" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "immigration_pickups_select_admin" ON "public"."immigration_pickups" FOR SELECT USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "immigration_pickups_update_admin" ON "public"."immigration_pickups" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."ministry_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ministry_documents_delete_admin" ON "public"."ministry_documents" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "ministry_documents_insert_admin" ON "public"."ministry_documents" FOR INSERT WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "ministry_documents_select_admin" ON "public"."ministry_documents" FOR SELECT USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "ministry_documents_update_admin" ON "public"."ministry_documents" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_requests_delete_admin" ON "public"."service_requests" FOR DELETE USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "service_requests_insert_public" ON "public"."service_requests" FOR INSERT WITH CHECK (true);



CREATE POLICY "service_requests_select_admin" ON "public"."service_requests" FOR SELECT USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "service_requests_update_admin" ON "public"."service_requests" FOR UPDATE USING (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."student_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_document_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."applications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."courses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."students";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."document_services" TO "anon";
GRANT ALL ON TABLE "public"."document_services" TO "authenticated";
GRANT ALL ON TABLE "public"."document_services" TO "service_role";



GRANT ALL ON TABLE "public"."immigration_pickups" TO "anon";
GRANT ALL ON TABLE "public"."immigration_pickups" TO "authenticated";
GRANT ALL ON TABLE "public"."immigration_pickups" TO "service_role";



GRANT ALL ON TABLE "public"."ministry_documents" TO "anon";
GRANT ALL ON TABLE "public"."ministry_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."ministry_documents" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("full_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."receipt_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."receipt_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."receipt_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON TABLE "public"."service_requests" TO "anon";
GRANT ALL ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT ALL ON TABLE "public"."student_courses" TO "anon";
GRANT ALL ON TABLE "public"."student_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."student_courses" TO "service_role";



GRANT ALL ON TABLE "public"."student_document_cases" TO "anon";
GRANT ALL ON TABLE "public"."student_document_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."student_document_cases" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

revoke update on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "authenticated";

alter table "public"."admin_activity_log" drop constraint "admin_activity_log_action_check";

alter table "public"."courses" drop constraint "courses_level_check";

alter table "public"."document_services" drop constraint "document_services_category_check";

alter table "public"."profiles" drop constraint "profiles_user_type_check";

alter table "public"."service_requests" drop constraint "service_requests_status_check";

alter table "public"."student_courses" drop constraint "student_courses_status_check";

alter table "public"."student_document_cases" drop constraint "student_document_cases_doc_status_check";

alter table "public"."students" drop constraint "students_language_level_check";

alter table "public"."admin_activity_log" add constraint "admin_activity_log_action_check" CHECK (((action)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying])::text[]))) not valid;

alter table "public"."admin_activity_log" validate constraint "admin_activity_log_action_check";

alter table "public"."courses" add constraint "courses_level_check" CHECK (((level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[]))) not valid;

alter table "public"."courses" validate constraint "courses_level_check";

alter table "public"."document_services" add constraint "document_services_category_check" CHECK (((category)::text = ANY ((ARRAY['document'::character varying, 'copy'::character varying])::text[]))) not valid;

alter table "public"."document_services" validate constraint "document_services_category_check";

alter table "public"."profiles" add constraint "profiles_user_type_check" CHECK (((user_type)::text = ANY ((ARRAY['student'::character varying, 'admin'::character varying])::text[]))) not valid;

alter table "public"."profiles" validate constraint "profiles_user_type_check";

alter table "public"."service_requests" add constraint "service_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."service_requests" validate constraint "service_requests_status_check";

alter table "public"."student_courses" add constraint "student_courses_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'dropped'::character varying])::text[]))) not valid;

alter table "public"."student_courses" validate constraint "student_courses_status_check";

alter table "public"."student_document_cases" add constraint "student_document_cases_doc_status_check" CHECK (((doc_status)::text = ANY ((ARRAY['pending'::character varying, 'submitted'::character varying, 'checked'::character varying, 'completed'::character varying])::text[]))) not valid;

alter table "public"."student_document_cases" validate constraint "student_document_cases_doc_status_check";

alter table "public"."students" add constraint "students_language_level_check" CHECK (((language_level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[]))) not valid;

alter table "public"."students" validate constraint "students_language_level_check";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow public reads"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'course-images'::text));



  create policy "Allow public uploads"
  on "storage"."objects"
  as permissive
  for insert
  to anon, authenticated
with check ((bucket_id = 'course-images'::text));



