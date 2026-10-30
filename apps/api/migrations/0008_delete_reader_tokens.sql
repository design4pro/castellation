CREATE TRIGGER reader_delete_reset_tokens
AFTER DELETE ON "user"
BEGIN
  DELETE FROM "verification" WHERE "value" = OLD.id AND "identifier" LIKE 'reset-password:%';
END;
