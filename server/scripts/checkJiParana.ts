/**
 * Quick check: verify Ji-Paraná vehicles have correct GPS coordinates
 */
import "dotenv/config";
import { getDb } from "../db";
import { vehicles } from "../../drizzle/schema";
import { like } from "drizzle-orm";

async function checkJiParana() {
  const db = await getDb();
  if (!db) { console.error("DB not available"); process.exit(1); }

  const results = await db
    .select({
      id: vehicles.id,
      brand: vehicles.brand,
      model: vehicles.model,
      pickupCity: vehicles.pickupCity,
      pickupState: vehicles.pickupState,
      pickupAddress: vehicles.pickupAddress,
      pickupLatitude: vehicles.pickupLatitude,
      pickupLongitude: vehicles.pickupLongitude,
      status: vehicles.status,
    })
    .from(vehicles)
    .where(like(vehicles.pickupCity, "%Ji-Paran%"));

  console.log(`\n📍 Ji-Paraná vehicles (${results.length} found):`);
  results.forEach(v => {
    console.log(`  #${v.id} ${v.brand} ${v.model} | ${v.pickupCity}/${v.pickupState} | status: ${v.status}`);
    console.log(`    lat: ${v.pickupLatitude}, lng: ${v.pickupLongitude}`);
  });

  process.exit(0);
}

checkJiParana().catch(err => { console.error(err); process.exit(1); });
