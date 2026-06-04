/**
 * Test script: Verify contract PDF generation works end-to-end
 * Tests: 1) Get a real booking from DB, 2) Generate contract PDF, 3) Verify S3 URL
 */
import "dotenv/config";
import * as db from "../db";
import { generateContractForBooking } from "../services/contractService";
import { generateReceiptPdf } from "../services/receiptService";

async function main() {
  console.log("=== RIDDY Contract & Receipt PDF Test ===\n");

  // 1. Get a recent booking by renter ID 1 (first user)
  const bookings = await db.getBookingsByRenterId(1);
  const allBookings = bookings.length > 0 ? bookings : await db.getBookingsByHostId(1);
  if (!allBookings || allBookings.length === 0) {
    console.log("❌ No bookings found in database - checking booking ID 1 directly");
    const singleBooking = await db.getBookingById(1);
    if (!singleBooking) {
      console.log("❌ No bookings found at all");
      process.exit(1);
    }
    allBookings.push(singleBooking);
  }

  const booking = allBookings[0];
  console.log(`✅ Found booking #${booking.id}`);
  console.log(`   Status: ${booking.status}`);
  console.log(`   Renter: ${booking.renterFullName || "N/A"}`);
  console.log(`   Vehicle: #${booking.vehicleId}`);
  console.log(`   Dates: ${new Date(booking.startDate).toLocaleDateString("pt-BR")} → ${new Date(booking.endDate).toLocaleDateString("pt-BR")}`);
  console.log(`   Total: R$ ${booking.totalAmount}`);
  console.log(`   Contract PDF URL: ${booking.contractPdfUrl || "NOT GENERATED YET"}`);
  console.log();

  // 2. Test contract PDF generation
  console.log("📄 Testing contract PDF generation...");
  const contractResult = await generateContractForBooking(booking.id);
  if (contractResult.success) {
    console.log(`✅ Contract PDF generated successfully!`);
    console.log(`   URL: ${contractResult.pdfUrl}`);
  } else {
    console.log(`❌ Contract PDF generation failed: ${contractResult.error}`);
  }
  console.log();

  // 3. Test receipt PDF generation
  console.log("🧾 Testing receipt PDF generation...");
  const receiptResult = await generateReceiptPdf(booking.id);
  if (receiptResult.success) {
    console.log(`✅ Receipt PDF generated successfully!`);
    console.log(`   URL: ${receiptResult.pdfUrl}`);
  } else {
    console.log(`❌ Receipt PDF generation failed: ${receiptResult.error}`);
  }
  console.log();

  console.log("=== Test Complete ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
