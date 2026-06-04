/**
 * Backfill contract PDFs for existing confirmed bookings
 * Run: pnpm tsx server/scripts/backfillContracts.ts
 */
import { getDb } from '../db';
import { sql } from 'drizzle-orm';
import { generateAndSendContract } from '../services/contractProcedure';

async function backfillContracts() {
  console.log('=== RIDDY Contract Backfill Script ===');
  console.log('Finding confirmed bookings with NULL contractPdfUrl...\n');

  // Find confirmed bookings without a contract PDF
  const db = await getDb();
  if (!db) { console.error('DB connection failed'); process.exit(1); }
  const result = await db.execute(sql`
    SELECT id, status, contractAccepted, contractPdfUrl, totalAmount
    FROM bookings 
    WHERE status = 'confirmed' AND (contractPdfUrl IS NULL OR contractPdfUrl = '')
    ORDER BY id ASC
    LIMIT 50
  `);

  const bookings = (result as any)[0] as any[];
  console.log(`Found ${bookings.length} bookings to backfill`);

  if (bookings.length === 0) {
    console.log('✅ No backfill needed — all confirmed bookings have contract PDFs');
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;

  for (const booking of bookings) {
    console.log(`\n📄 Processing booking ${booking.id}...`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Contract accepted: ${booking.contractAccepted}`);
    console.log(`   Total: R$ ${booking.totalAmount}`);

    try {
      const result2 = await generateAndSendContract(booking.id);
      if (result2.success && result2.pdfUrl) {
        console.log(`   ✅ PDF generated: ${result2.pdfUrl.substring(0, 80)}...`);
        successCount++;
      } else {
        console.log(`   ⚠️  Result: ${JSON.stringify(result2)}`);
        failCount++;
      }
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      failCount++;
    }

    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n=== Backfill Complete ===`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  process.exit(0);
}

backfillContracts().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
