ALTER TABLE "public"."LostReport"
ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "public"."FoundReport"
ALTER COLUMN "status" SET DEFAULT 'pending';
