ALTER TABLE "user" ADD COLUMN "role" TEXT;
ALTER TABLE "user" ADD COLUMN "banned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN "banReason" TEXT;
ALTER TABLE "user" ADD COLUMN "banExpires" INTEGER;
ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;

CREATE TRIGGER reader_revoke_sessions_after_update
AFTER UPDATE OF banned, email ON "user"
WHEN (NEW.banned = 1 AND OLD.banned = 0) OR NEW.email != OLD.email
BEGIN
  DELETE FROM "session" WHERE "userId" = NEW.id;
END;

CREATE TRIGGER reader_block_session_insert
BEFORE INSERT ON "session"
WHEN EXISTS (SELECT 1 FROM "user" WHERE id = NEW.userId AND banned = 1)
BEGIN
  SELECT RAISE(ABORT, 'Account is blocked');
END;
