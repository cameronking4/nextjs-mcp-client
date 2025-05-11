CREATE TABLE "widgets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'My Chat Widget' NOT NULL,
	"model_id" text NOT NULL,
	"mcp_servers" json NOT NULL,
	"customization" json DEFAULT '{}'::json,
	"is_public" boolean DEFAULT true NOT NULL,
	"allowed_domains" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
