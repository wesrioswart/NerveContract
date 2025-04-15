CREATE TABLE "activity_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"predecessor_id" integer NOT NULL,
	"successor_id" integer NOT NULL,
	"type" text DEFAULT 'FS' NOT NULL,
	"lag" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compensation_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"clause_reference" text NOT NULL,
	"estimated_value" integer,
	"actual_value" integer,
	"status" text NOT NULL,
	"raised_by" integer NOT NULL,
	"raised_at" timestamp NOT NULL,
	"response_deadline" timestamp,
	"implemented_date" timestamp,
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE "early_warnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"reference" text NOT NULL,
	"description" text NOT NULL,
	"owner_id" integer NOT NULL,
	"status" text NOT NULL,
	"raised_by" integer NOT NULL,
	"raised_at" timestamp NOT NULL,
	"mitigation_plan" text,
	"meeting_date" timestamp,
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE "nec4_team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"responsibilities" text,
	"is_key_person" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "nec4_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "non_conformance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"reference" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"raised_by" integer NOT NULL,
	"raised_at" timestamp NOT NULL,
	"status" text NOT NULL,
	"corrective_action" text,
	"assigned_to" integer,
	"closed_date" timestamp,
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE "payment_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"reference" text NOT NULL,
	"amount" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" text NOT NULL,
	"submitted_by" integer,
	"submitted_at" timestamp,
	"certified_by" integer,
	"certified_at" timestamp,
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE "programme_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"programme_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"percent_complete" integer DEFAULT 0 NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"total_float" integer,
	"parent_id" integer,
	"wbs_code" text,
	"milestone" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programme_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"programme_id" integer NOT NULL,
	"analysis_date" timestamp DEFAULT now(),
	"quality_score" integer,
	"critical_path_length" integer,
	"schedule_risk" text,
	"issues_found" json,
	"nec4_compliance" json,
	"recommendations" json
);
--> statement-breakpoint
CREATE TABLE "programme_annotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"programme_id" integer NOT NULL,
	"activity_id" text,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"text" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"nec4_clause" text
);
--> statement-breakpoint
CREATE TABLE "programme_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"planned_date" timestamp NOT NULL,
	"forecast_date" timestamp,
	"actual_date" timestamp,
	"status" text NOT NULL,
	"is_key_date" boolean DEFAULT false,
	"affects_completion_date" boolean DEFAULT false,
	"description" text,
	"delay_reason" text,
	"delay_days" integer
);
--> statement-breakpoint
CREATE TABLE "programmes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"submission_date" timestamp NOT NULL,
	"status" text NOT NULL,
	"acceptance_date" timestamp,
	"planned_completion_date" timestamp NOT NULL,
	"baseline_id" integer,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"submitted_by" integer,
	"reviewed_by" integer,
	"review_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contract_reference" text NOT NULL,
	"client_name" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technical_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"reference" text NOT NULL,
	"question" text NOT NULL,
	"raised_by" integer NOT NULL,
	"raised_at" timestamp NOT NULL,
	"status" text NOT NULL,
	"response" text,
	"responded_by" integer,
	"responded_at" timestamp,
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text NOT NULL,
	"email" text NOT NULL,
	"avatar_initials" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users_to_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_relationships" ADD CONSTRAINT "activity_relationships_predecessor_id_programme_activities_id_fk" FOREIGN KEY ("predecessor_id") REFERENCES "public"."programme_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_relationships" ADD CONSTRAINT "activity_relationships_successor_id_programme_activities_id_fk" FOREIGN KEY ("successor_id") REFERENCES "public"."programme_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nec4_team_members" ADD CONSTRAINT "nec4_team_members_team_id_nec4_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."nec4_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nec4_team_members" ADD CONSTRAINT "nec4_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nec4_teams" ADD CONSTRAINT "nec4_teams_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_activities" ADD CONSTRAINT "programme_activities_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_activities" ADD CONSTRAINT "programme_activities_parent_id_programme_activities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."programme_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_analyses" ADD CONSTRAINT "programme_analyses_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_annotations" ADD CONSTRAINT "programme_annotations_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_annotations" ADD CONSTRAINT "programme_annotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_baseline_id_programmes_id_fk" FOREIGN KEY ("baseline_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_projects" ADD CONSTRAINT "users_to_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_projects" ADD CONSTRAINT "users_to_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;