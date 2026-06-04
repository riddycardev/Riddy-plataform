/**
 * Test email delivery via Resend
 */
import { Resend } from 'resend';

async function testEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  console.log('=== RIDDY Email Delivery Test ===');
  console.log('RESEND_API_KEY present:', !!apiKey);
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set!');
    process.exit(1);
  }
  console.log('Key prefix:', apiKey.substring(0, 8) + '...');

  const resend = new Resend(apiKey);

  // Test 1: Send to Resend test address (always works)
  console.log('\n📧 Test 1: Send to delivered@resend.dev (test address)...');
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend's own test domain
      to: ['delivered@resend.dev'],
      subject: 'RIDDY Contract Test',
      html: '<h1>RIDDY Contract Test</h1><p>This is a test email from RIDDY platform.</p>',
    });
    console.log('✅ Email sent successfully!');
    console.log('   Email ID:', result.data?.id);
    console.log('   Error:', result.error);
  } catch (err: any) {
    console.error('❌ Email send failed:', err.message);
    console.error('   Status:', err.statusCode);
  }

  // Test 2: Try with contratos@riddy.com domain (may fail if domain not verified)
  console.log('\n📧 Test 2: Send from contratos@riddy.com...');
  try {
    const result = await resend.emails.send({
      from: 'contratos@riddy.com',
      to: ['delivered@resend.dev'],
      subject: 'RIDDY Contract - Domain Test',
      html: '<h1>RIDDY Contract</h1><p>Test from contratos@riddy.com</p>',
    });
    console.log('✅ Email from riddy.com domain sent!');
    console.log('   Email ID:', result.data?.id);
    if (result.error) {
      console.error('   Error:', JSON.stringify(result.error));
    }
  } catch (err: any) {
    console.error('❌ Email from riddy.com failed:', err.message);
    console.error('   This likely means riddy.com domain is NOT verified in Resend');
    console.error('   Status:', err.statusCode);
  }

  // Test 3: Try with contratos@riddycar.com domain
  console.log('\n📧 Test 3: Send from contratos@riddycar.com...');
  try {
    const result = await resend.emails.send({
      from: 'contratos@riddycar.com',
      to: ['delivered@resend.dev'],
      subject: 'RIDDY Contract - riddycar.com Domain Test',
      html: '<h1>RIDDY Contract</h1><p>Test from contratos@riddycar.com</p>',
    });
    console.log('✅ Email from riddycar.com domain sent!');
    console.log('   Email ID:', result.data?.id);
    if (result.error) {
      console.error('   Error:', JSON.stringify(result.error));
    }
  } catch (err: any) {
    console.error('❌ Email from riddycar.com failed:', err.message);
    console.error('   Status:', err.statusCode);
  }

  // Check domains
  console.log('\n🌐 Checking verified domains in Resend...');
  try {
    const domains = await resend.domains.list();
    console.log('Domains:', JSON.stringify(domains.data, null, 2));
  } catch (err: any) {
    console.error('Could not list domains:', err.message);
  }

  process.exit(0);
}

testEmail().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
