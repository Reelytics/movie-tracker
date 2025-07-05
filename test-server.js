// Simple test server for Railway debugging
const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

console.log('=== SIMPLE TEST SERVER STARTING ===');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

app.get('/health', (req, res) => {
  console.log('Health check hit!');
  res.json({ status: 'ok', port, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  console.log('Root endpoint hit!');
  res.json({ message: 'Test server running', port });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`=== TEST SERVER LISTENING ON PORT ${port} ===`);
  console.log('Health endpoint: /health');
  console.log('Ready for connections!');
});
