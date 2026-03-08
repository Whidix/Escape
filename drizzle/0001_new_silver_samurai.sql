ALTER TABLE "step" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "step" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "step" ADD COLUMN "proximity_radius" integer DEFAULT 50;