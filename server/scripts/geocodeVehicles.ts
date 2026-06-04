/**
 * Script: Geocode existing vehicles without GPS coordinates
 * Run via: pnpm tsx server/scripts/geocodeVehicles.ts
 * 
 * This script finds all vehicles with null pickupLatitude/pickupLongitude
 * and geocodes them using the Google Maps API proxy.
 */

import "dotenv/config";
import { makeRequest } from "../_core/map";
import { getDb } from "../db";
import { vehicles } from "../../drizzle/schema";
import { isNull, or } from "drizzle-orm";

interface GeocodingResult {
  status: string;
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
}

async function geocodeVehicles() {
  console.log("🔍 Finding vehicles without GPS coordinates...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  // Find all vehicles missing lat/lng
  const vehiclesWithoutCoords = await db
    .select({
      id: vehicles.id,
      brand: vehicles.brand,
      model: vehicles.model,
      pickupAddress: vehicles.pickupAddress,
      pickupCity: vehicles.pickupCity,
      pickupState: vehicles.pickupState,
      pickupLatitude: vehicles.pickupLatitude,
      pickupLongitude: vehicles.pickupLongitude,
    })
    .from(vehicles)
    .where(
      or(
        isNull(vehicles.pickupLatitude),
        isNull(vehicles.pickupLongitude)
      )
    );

  console.log(`📋 Found ${vehiclesWithoutCoords.length} vehicles without GPS coordinates`);

  if (vehiclesWithoutCoords.length === 0) {
    console.log("✅ All vehicles already have GPS coordinates!");
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;

  for (const vehicle of vehiclesWithoutCoords) {
    const fullAddress = `${vehicle.pickupAddress}, ${vehicle.pickupCity}, ${vehicle.pickupState}, Brasil`;
    console.log(`\n🗺️  Geocoding vehicle #${vehicle.id} (${vehicle.brand} ${vehicle.model})`);
    console.log(`   Address: ${fullAddress}`);

    try {
      const geocodeResult = await makeRequest<GeocodingResult>("/maps/api/geocode/json", {
        address: fullAddress,
      });

      if (geocodeResult.status === "OK" && geocodeResult.results[0]) {
        const loc = geocodeResult.results[0].geometry.location;
        const formattedAddress = geocodeResult.results[0].formatted_address;
        
        await db
          .update(vehicles)
          .set({
            pickupLatitude: String(loc.lat),
            pickupLongitude: String(loc.lng),
          })
          .where(
            // @ts-ignore - drizzle eq import
            (await import("drizzle-orm")).eq(vehicles.id, vehicle.id)
          );

        console.log(`   ✅ Success: lat=${loc.lat}, lng=${loc.lng}`);
        console.log(`   📍 Resolved to: ${formattedAddress}`);
        successCount++;
      } else {
        console.log(`   ⚠️  Geocoding returned status: ${geocodeResult.status}`);
        failCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error geocoding vehicle #${vehicle.id}:`, err);
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully geocoded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📋 Total processed: ${vehiclesWithoutCoords.length}`);
  
  process.exit(0);
}

geocodeVehicles().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
