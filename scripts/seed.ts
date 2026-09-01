import "dotenv/config";
import { db } from "../src/lib/db/client";
import { availabilityRules } from "../src/lib/db/schema";

/** Mirrors the recurring hours that were hardcoded in the demo before this went to the DB. */
const STARTING_RULES = [
  { weekday: 1, startTime: "09:00", endTime: "12:00" },
  { weekday: 1, startTime: "14:00", endTime: "18:00" },
  { weekday: 2, startTime: "09:00", endTime: "12:00" },
  { weekday: 2, startTime: "14:00", endTime: "18:00" },
  { weekday: 3, startTime: "14:00", endTime: "18:00" },
  { weekday: 3, startTime: "19:00", endTime: "20:30" },
  { weekday: 4, startTime: "09:00", endTime: "12:00" },
  { weekday: 4, startTime: "14:00", endTime: "18:00" },
  { weekday: 5, startTime: "09:00", endTime: "13:00" },
];

async function main() {
  const existing = await db.select().from(availabilityRules);
  if (existing.length > 0) {
    console.log(
      `availability_rules already has ${existing.length} row(s) — skipping seed.`,
    );
    process.exit(0);
  }

  await db.insert(availabilityRules).values(STARTING_RULES);
  console.log(`Seeded ${STARTING_RULES.length} recurring availability rules.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
