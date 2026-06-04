import { MercadoPagoConfig, Payment } from 'mercadopago';

const token = process.env.MP_ACCESS_TOKEN;
const key = process.env.MP_PUBLIC_KEY;

console.log('MP_ACCESS_TOKEN set:', !!token && token.length > 10);
console.log('MP_PUBLIC_KEY set:', !!key && key.length > 10);

if (!token) {
  console.error('ERROR: MP_ACCESS_TOKEN not set');
  process.exit(1);
}

// Test by initializing the SDK
const client = new MercadoPagoConfig({ accessToken: token });
console.log('Mercado Pago SDK initialized successfully');
console.log('Token prefix:', token.substring(0, 20) + '...');
