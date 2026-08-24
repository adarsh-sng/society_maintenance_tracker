import { db } from "./connection.ts";
import * as schema from "./schema.ts"; 
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Clear existing data (Order matters! Delete children first to avoid FK errors)
    console.log("🧹 Clearing existing data...");
    await db.delete(schema.userSignals);
    await db.delete(schema.standupRecurringTasks);
    await db.delete(schema.standups);
    await db.delete(schema.recurringTasks);
    await db.delete(schema.signals);
    await db.delete(schema.users);

    console.log("👤 Creating demo users...");
    // Note: In a real app, use a real hashing function like bcrypt/argon2
    const passwordHash = "super_secret_hashed_password_123"; 

    const [demoUser] = await db
      .insert(schema.users)
      .values({
        name: "Demo User",
        email: "demo@standups.com",
        passwordHash: passwordHash,
      })
      .returning();

    const [alice] = await db
      .insert(schema.users)
      .values({
        name: "Alice Engineer",
        email: "alice@example.com",
        passwordHash: passwordHash,
      })
      .returning();

    // 3. Create Signals (Reference Data)
    console.log("📡 Creating signals...");
    const [githubSignal] = await db
      .insert(schema.signals)
      .values({
        name: "GitHub",
        api: "https://api.github.com",
        metric: "commits_pushed",
        type: "vcs",
      })
      .returning();

    const [jiraSignal] = await db
      .insert(schema.signals)
      .values({
        name: "Jira",
        api: "https://jira.atlassian.com",
        metric: "tickets_closed",
        type: "pm",
      })
      .returning();

    const [linearSignal] = await db
      .insert(schema.signals)
      .values({
        name: "Linear",
        api: "https://api.linear.app",
        metric: "issues_completed",
        type: "pm",
      })
      .returning();

    // 4. Create Recurring Tasks for Demo User
    console.log("🔁 Creating recurring tasks...");
    const [checkSentry] = await db
      .insert(schema.recurringTasks)
      .values({
        userId: demoUser.id,
        name: "Check Sentry for new errors",
      })
      .returning();

    const [updateDocs] = await db
      .insert(schema.recurringTasks)
      .values({
        userId: demoUser.id,
        name: "Update API documentation",
      })
      .returning();

    // 5. Create Standups (Simulate history)
    console.log("📝 Creating standup history...");
    const today = new Date();
    
    // Standup 1: Today
    const [todayStandup] = await db
      .insert(schema.standups)
      .values({
        userId: demoUser.id,
        date: today,
        mood: "confident",
        notes: "Finally cracked the difficult migration bug.",
        yesterdayTaskCompleted: true,
        tomorrowGoals: ["Deploy to staging", "Write unit tests"], // Matches .$type<string[]>()
      })
      .returning();

    // Standup 2: Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [yesterdayStandup] = await db
      .insert(schema.standups)
      .values({
        userId: demoUser.id,
        date: yesterday,
        mood: "stressed",
        notes: "Struggling with the database schema types.",
        yesterdayTaskCompleted: false,
        tomorrowGoals: ["Fix schema types", "Ask for help"],
      })
      .returning();

    // 6. Link Recurring Tasks to Standups
    console.log("🔗 Linking tasks...");
    await db.insert(schema.standupRecurringTasks).values([
      // Today: Completed both
      {
        standupId: todayStandup.id,
        recurringTaskId: checkSentry.id,
        completed: true,
      },
      {
        standupId: todayStandup.id,
        recurringTaskId: updateDocs.id,
        completed: true,
      },
      // Yesterday: Only checked Sentry
      {
        standupId: yesterdayStandup.id,
        recurringTaskId: checkSentry.id,
        completed: true,
      },
      {
        standupId: yesterdayStandup.id,
        recurringTaskId: updateDocs.id,
        completed: false,
      },
    ]);

    // 7. Link Signals to Standups
    console.log("🔗 Linking signals...");
    await db.insert(schema.userSignals).values([
      // Today's Activity
      {
        standupId: todayStandup.id,
        signalId: githubSignal.id,
        activity: 12, // 12 commits
      },
      {
        standupId: todayStandup.id,
        signalId: linearSignal.id,
        activity: 3, // 3 issues closed
      },
      // Yesterday's Activity
      {
        standupId: yesterdayStandup.id,
        signalId: githubSignal.id,
        activity: 4, 
      },
    ]);

    // 8. Verification Query (The "Proof")
    console.log("\n🔍 Testing relational queries...");
    
    const fullUser = await db.query.users.findFirst({
      where: eq(schema.users.email, "demo@standups.com"),
      with: {
        recurringTasks: true,
        standups: {
          orderBy: (standups, { desc }) => [desc(standups.date)],
          limit: 2,
          with: {
            standupRecurringTasks: {
              with: {
                recurringTask: true,
              },
            },
            userSignals: {
              with: {
                signal: true,
              },
            },
          },
        },
      },
    });

    console.log("✅ Database seeded successfully!");
    console.log("\n📊 Seed Summary:");
    console.log(`- Users created: 2`);
    console.log(`- Signals defined: 3`);
    console.log(`- Recurring Tasks for Demo: 2`);
    console.log(`- Standups logged: ${fullUser?.standups.length}`);
    
    // Example of accessing the deep data
    const latestStandup = fullUser?.standups[0];
    const signalsCount = latestStandup?.userSignals.length || 0;
    
    console.log(`- Latest Standup Mood: ${latestStandup?.mood}`);
    console.log(`- Signals attached to latest standup: ${signalsCount}`);
    console.log(`- Tomorrow's Goals: ${latestStandup?.tomorrowGoals.join(", ")}`);

    console.log("\n🔑 Login Credentials:");
    console.log("Email: demo@standups.com");
    console.log("Password: (Any string, logic handled in app)");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed;