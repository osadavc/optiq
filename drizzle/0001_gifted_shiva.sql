ALTER TABLE "resources" ADD COLUMN "processing_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" DROP COLUMN "url";