import MercadoPago from 'mercadopago';

const client = new MercadoPago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new MercadoPago.Payment(client);

// Check the most recent payment IDs
const ids = ['154484739837', '155239802670', '155239924530'];

for (const id of ids) {
  try {
    const result = await payment.get({ id });
    console.log(`\n=== Payment ${id} ===`);
    console.log('status:', result.status);
    console.log('status_detail:', result.status_detail);
    console.log('date_created:', result.date_created);
    console.log('date_last_updated:', result.date_last_updated);
    console.log('payment_method_id:', result.payment_method_id);
    console.log('issuer_id:', result.issuer_id);
  } catch (e) {
    console.log(`Error for ${id}:`, e.message);
  }
}
