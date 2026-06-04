/**
 * Contract Generation Procedure
 * Handles contract PDF generation and email sending after booking creation
 */

import { getDb, getBookingById, getVehicleById, getUserById } from '../db';
import { generateContractPDF } from './contractService';
import { sendContractToRenter, sendContractToHost, sendContractAcceptanceConfirmation } from './emailService';
import { bookings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate and send contract PDF after booking is created
 */
export async function generateAndSendContract(bookingId: number): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: 'Database connection failed' };

    // Fetch booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Fetch vehicle
    const vehicle = await getVehicleById(booking.vehicleId);
    if (!vehicle) {
      return { success: false, error: 'Vehicle not found' };
    }

    // Fetch renter
    const renter = await getUserById(booking.renterId);
    if (!renter) {
      return { success: false, error: 'Renter not found' };
    }

    // Fetch host
    const host = await getUserById(booking.hostId);
    if (!host) {
      return { success: false, error: 'Host not found' };
    }

    // Generate PDF
    console.log(`[Contract] Generating PDF for booking #${bookingId}...`);
    const pdfUrl = await generateContractPDF({
      booking,
      vehicle,
      renter,
      host,
    });

    console.log(`[Contract] PDF generated: ${pdfUrl}`);

    // Update booking with contract URL
    await db.update(bookings).set({
      contractPdfUrl: pdfUrl,
      updatedAt: new Date(),
    }).where(eq(bookings.id, bookingId));

    // Send emails
    console.log(`[Contract] Sending emails for booking #${bookingId}...`);
    
    const emailParams = {
      booking,
      vehicle,
      renter,
      host,
      contractPdfUrl: pdfUrl,
    };

    // Send to renter
    const renterEmailSent = await sendContractToRenter(emailParams);
    console.log(`[Contract] Email to renter: ${renterEmailSent ? 'sent' : 'failed'}`);

    // Send to host
    const hostEmailSent = await sendContractToHost(emailParams);
    console.log(`[Contract] Email to host: ${hostEmailSent ? 'sent' : 'failed'}`);

    return {
      success: true,
      pdfUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Contract] Error generating contract: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send contract acceptance confirmation
 */
export async function sendContractAcceptanceEmail(bookingId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: 'Database connection failed' };

    // Fetch booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (!booking.contractPdfUrl) {
      return { success: false, error: 'Contract PDF URL not found' };
    }

    // Fetch vehicle
    const vehicle = await getVehicleById(booking.vehicleId);
    if (!vehicle) {
      return { success: false, error: 'Vehicle not found' };
    }

    // Fetch renter
    const renter = await getUserById(booking.renterId);
    if (!renter) {
      return { success: false, error: 'Renter not found' };
    }

    // Fetch host
    const host = await getUserById(booking.hostId);
    if (!host) {
      return { success: false, error: 'Host not found' };
    }

    // Send acceptance confirmation
    console.log(`[Contract] Sending acceptance confirmation for booking #${bookingId}...`);
    
    const sent = await sendContractAcceptanceConfirmation({
      booking,
      vehicle,
      renter,
      host,
      contractPdfUrl: booking.contractPdfUrl,
    });

    console.log(`[Contract] Acceptance confirmation: ${sent ? 'sent' : 'failed'}`);

    return { success: sent };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Contract] Error sending acceptance confirmation: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
