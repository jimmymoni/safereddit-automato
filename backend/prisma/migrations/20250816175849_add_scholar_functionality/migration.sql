-- CreateTable
CREATE TABLE "AutomationSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "story" TEXT NOT NULL,
    "automationPlan" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "todayActions" INTEGER NOT NULL DEFAULT 0,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutomationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "result" TEXT,
    "metadata" JSONB,
    "karmaChange" INTEGER NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActivityLog" ("action", "id", "karmaChange", "metadata", "result", "target", "timestamp", "userId") SELECT "action", "id", "karmaChange", "metadata", "result", "target", "timestamp", "userId" FROM "ActivityLog";
DROP TABLE "ActivityLog";
ALTER TABLE "new_ActivityLog" RENAME TO "ActivityLog";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "redditUsername" TEXT,
    "redditToken" TEXT,
    "redditRefreshToken" TEXT,
    "redditTokenExpiry" DATETIME,
    "settings" JSONB,
    "autopilotSettings" JSONB,
    "accountHealth" REAL NOT NULL DEFAULT 100.0,
    "postKarma" INTEGER NOT NULL DEFAULT 0,
    "commentKarma" INTEGER NOT NULL DEFAULT 0,
    "currentStory" TEXT,
    "lastStoryAnalysis" DATETIME,
    "lastKarmaCheck" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("accountHealth", "autopilotSettings", "commentKarma", "createdAt", "email", "id", "postKarma", "redditRefreshToken", "redditToken", "redditTokenExpiry", "redditUsername", "settings", "updatedAt") SELECT "accountHealth", "autopilotSettings", "commentKarma", "createdAt", "email", "id", "postKarma", "redditRefreshToken", "redditToken", "redditTokenExpiry", "redditUsername", "settings", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_redditUsername_key" ON "User"("redditUsername");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
