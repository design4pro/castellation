DELETE FROM "session"
WHERE "userId" IN (SELECT "id" FROM "user" WHERE "emailVerified" = 0);
