/**
 * Test for Image Display Improvements
 * Validates that vehicle images use object-cover for premium Turo-style thumbnails
 * Updated: object-cover is now correct for consistent card thumbnails (Turo-style premium redesign)
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("Image Display Improvements", () => {
  it("FeaturedCarsSection should use object-cover for premium Turo-style card thumbnails", () => {
    const filePath = join(process.cwd(), "client/src/components/sections/FeaturedCarsSection.tsx");
    const content = readFileSync(filePath, "utf-8");
    
    // Premium Turo-style cards use object-cover for consistent aspect ratio thumbnails
    expect(content).toContain("object-cover");
    
    // Check that dark gradient background is applied for fallback state
    expect(content).toContain("bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]");

    // Premium cards should have FavoriteButton for favorites (replaced Heart icon)
    expect(content).toContain("FavoriteButton");

    // Should clean duplicate brand names in titles
    expect(content).toContain("displayTitle");
  });

  it("VehicleDetails should use object-contain for gallery images", () => {
    const filePath = join(process.cwd(), "client/src/pages/VehicleDetails.tsx");
    const content = readFileSync(filePath, "utf-8");
    
    // Check that object-contain is used in main gallery
    expect(content).toContain("object-contain");
    
    // Check that dark gradient background is applied
    expect(content).toContain("bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]");
  });

  it("SearchResults.tsx was removed as dead code (STEP 10 - A6 cleanup)", () => {
    // SearchResults.tsx was removed in STEP 10 (A6 dead code cleanup)
    // It had no route in App.tsx and was never used as a routed component
    const filePath = join(process.cwd(), "client/src/pages/SearchResults.tsx");
    expect(existsSync(filePath)).toBe(false);
  });

  it("FeaturedCarsSection cards use object-cover for thumbnail consistency (Turo premium style)", () => {
    const filePath = join(process.cwd(), "client/src/components/sections/FeaturedCarsSection.tsx");
    const content = readFileSync(filePath, "utf-8");

    // Turo-style card thumbnails use object-cover for consistent 4:3 crop
    const vehicleImageSections = content.match(/vehicle\.mainImageUrl[\s\S]{0,200}object-cover/g) || [];
    expect(vehicleImageSections.length).toBeGreaterThan(0);

    // VehicleDetails gallery still uses object-contain for full-view context
    const detailsPath = join(process.cwd(), "client/src/pages/VehicleDetails.tsx");
    const detailsContent = readFileSync(detailsPath, "utf-8");
    expect(detailsContent).toContain("object-contain");
  });
});
