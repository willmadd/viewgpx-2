/**
 * One-off migration: moves the existing NextAuth-managed accounts (in the
 * `users` table) over to Supabase Auth, repoints `routes.user_id` from the
 * old integer id to the new Supabase UUID, then drops the tables NextAuth
 * used (`accounts`, `sessions`, `verification_tokens`, `users`).
 *
 * Run a dry run first:
 *   npx tsx migrate-users-to-supabase.ts --dry-run
 *
 * Then for real:
 *   npx tsx migrate-users-to-supabase.ts
 *
 * Requires DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY to be set — this script loads them from .env
 * itself, so no separate dotenv step or shell export is needed.
 *
 * Old bcrypt password hashes cannot be carried over into Supabase Auth, so
 * this script emails each migrated user a password-reset link. Pass
 * --skip-reset-emails to create the accounts without sending that email.
 *
 * IMPORTANT: after this script succeeds, replace prisma/schema.prisma with
 * prisma/schema.supabase.prisma (see accompanying note) and run
 * `npx prisma generate` to refresh the Prisma Client types — the app's
 * TypeScript will not compile against the old schema once this has run.
 */
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(new URL("./.env", import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_RESET_EMAILS = process.argv.includes("--skip-reset-emails");

if (!DATABASE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must all be set.",
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type LegacyUser = {
  id: number;
  email: string;
  name: string | null;
};

const migrate = async () => {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  try {
    const { rows: users } = await db.query<LegacyUser>(
      `SELECT id, email, name FROM users ORDER BY id`,
    );

    console.log(
      `Found ${users.length} legacy user(s) in the "users" table.${
        DRY_RUN ? " (dry run — no changes will be made)" : ""
      }`,
    );

    const idMap = new Map<number, string>();

    for (const user of users) {
      console.log(`\n${user.email} (old id ${user.id})`);

      if (DRY_RUN) {
        console.log("  [dry run] would create a Supabase Auth user" +
          (SKIP_RESET_EMAILS ? "" : " and email a password reset link"));
        continue;
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: user.name ? { name: user.name } : undefined,
      });

      if (error || !data.user) {
        throw new Error(
          `Failed to create Supabase Auth user for ${user.email}: ${error?.message}`,
        );
      }

      idMap.set(user.id, data.user.id);
      console.log(`  Created Supabase Auth user ${data.user.id}`);

      if (!SKIP_RESET_EMAILS) {
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
          user.email,
        );

        if (resetError) {
          console.warn(
            `  Warning: could not send password reset email: ${resetError.message}`,
          );
        } else {
          console.log("  Sent password reset email");
        }
      }
    }

    if (DRY_RUN) {
      console.log("\nDry run complete. No changes were made.");
      return;
    }

    console.log("\nAdding routes.user_id_new (uuid) column...");
    await db.query(`ALTER TABLE routes ADD COLUMN IF NOT EXISTS user_id_new UUID`);

    for (const [oldId, newId] of idMap) {
      const { rowCount } = await db.query(
        `UPDATE routes SET user_id_new = $1 WHERE user_id = $2`,
        [newId, oldId],
      );
      console.log(`Repointed ${rowCount} route(s) from user ${oldId} to ${newId}`);
    }

    console.log("Dropping the old integer user_id column and its constraint...");
    await db.query(
      `ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_user_id_fkey`,
    );
    await db.query(`DROP INDEX IF EXISTS routes_user_id_idx`);
    await db.query(`ALTER TABLE routes DROP COLUMN user_id`);
    await db.query(`ALTER TABLE routes RENAME COLUMN user_id_new TO user_id`);
    await db.query(
      `CREATE INDEX IF NOT EXISTS routes_user_id_idx ON routes(user_id)`,
    );

    console.log("Dropping NextAuth tables (accounts, sessions, verification_tokens, users)...");
    await db.query(`DROP TABLE IF EXISTS accounts`);
    await db.query(`DROP TABLE IF EXISTS sessions`);
    await db.query(`DROP TABLE IF EXISTS verification_tokens`);
    await db.query(`DROP TABLE IF EXISTS users`);

    console.log(
      "\nMigration complete. Next: copy prisma/schema.supabase.prisma over " +
        "prisma/schema.prisma and run `npx prisma generate`.",
    );
  } finally {
    await db.end();
  }
};

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
