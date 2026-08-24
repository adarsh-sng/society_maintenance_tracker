import { db } from "./connection.ts";
import * as schema from "./schema.ts";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting Society Maintenance Tracker seed...");

  try {
    console.log("🧹 Clearing existing data...");
    await db.delete(schema.complaintHistory);
    await db.delete(schema.complaints);
    await db.delete(schema.notices);
    await db.delete(schema.users);

    console.log("👤 Creating users (Residents and Admins)...");
    const passwordHash = "super_secret_hashed_password_123";

    const [adminUser] = await db
      .insert(schema.users)
      .values({
        name: "Society Admin",
        email: "admin@society.com",
        passwordHash,
        role: "admin",
      })
      .returning();

    const [residentOne] = await db
      .insert(schema.users)
      .values({
        name: "Alice Resident",
        email: "alice@society.com",
        passwordHash,
        role: "resident",
      })
      .returning();

    const [residentTwo] = await db
      .insert(schema.users)
      .values({
        name: "Bob Resident",
        email: "bob@society.com",
        passwordHash,
        role: "resident",
      })
      .returning();

    console.log("📢 Creating notices...");
    await db.insert(schema.notices).values([
      {
        content: "Water supply will be interrupted on Friday from 10 AM to 2 PM.",
        isImportant: true,
      },
      {
        content: "The annual society meeting is scheduled for next month.",
        isImportant: false,
      },
    ]);

    console.log("📝 Creating complaints...");
    const [complaintOne] = await db
      .insert(schema.complaints)
      .values({
        residentId: residentOne.id,
        category: "Plumbing",
        description: "Kitchen sink is leaking profusely.",
        photoUrl: "https://example.com/leaking-sink.jpg",
        status: "Resolved",
        priority: "High",
      })
      .returning();

    const [complaintTwo] = await db
      .insert(schema.complaints)
      .values({
        residentId: residentTwo.id,
        category: "Electrical",
        description: "Hallway lights on the 3rd floor are flickering.",
        status: "In Progress",
        priority: "Medium",
        isOverdue: true,
      })
      .returning();

    const [complaintThree] = await db
      .insert(schema.complaints)
      .values({
        residentId: residentOne.id,
        category: "Carpentry",
        description: "Main door hinge is broken.",
        status: "Open",
        priority: "Low",
      })
      .returning();

    console.log("📜 Creating complaint history log...");
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(schema.complaintHistory).values([
      // History for Complaint One (Resolved)
      {
        complaintId: complaintOne.id,
        actorId: adminUser.id,
        newStatus: "In Progress",
        note: "Plumber dispatched.",
        timestamp: twoDaysAgo,
      },
      {
        complaintId: complaintOne.id,
        actorId: adminUser.id,
        newStatus: "Resolved",
        note: "Pipe replaced.",
        timestamp: yesterday,
      },
      // History for Complaint Two (In Progress & Overdue)
      {
        complaintId: complaintTwo.id,
        actorId: adminUser.id,
        newStatus: "In Progress",
        note: "Electrician scheduled but delayed.",
        timestamp: twoDaysAgo,
      },
    ]);

    console.log("\n🔍 Testing relational queries (Admin View)...");
    const adminDashboardView = await db.query.complaints.findMany({
      with: {
        resident: {
          columns: { name: true, email: true },
        },
        history: {
          orderBy: (history, { desc }) => [desc(history.timestamp)],
          with: {
            actor: { columns: { name: true } },
          },
        },
      },
    });

    console.log("✅ Database seeded successfully!");
    console.log("\n📊 Seed Summary:");
    console.log(`- Users created: 3`);
    console.log(`- Notices created: 2`);
    console.log(`- Complaints logged: ${adminDashboardView.length}`);
    console.log(`- Overdue Complaints: ${adminDashboardView.filter((c) => c.isOverdue).length}`);

    console.log("\n🔑 Login Credentials:");
    console.log("Admin: admin@society.com");
    console.log("Resident: alice@society.com");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed;