const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { searchProducts } = require('./meliService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.send('API de Ofertas Ocultas');
});

// Rota de busca
app.get('/api/search', async (req, res) => {
  const q = req.query.q || 'iphone';
  const products = await searchProducts(q);
  res.json(products);
});

// Rota de ofertas
app.get('/api/deals', async (req, res) => {
  const products = await searchProducts('promoção');
  const deals = products.filter(p => p.discount >= 20);
  res.json(deals);
});

// Rota de mais vendidos
app.get('/api/trending', async (req, res) => {
  const products = await searchProducts('iphone');
  const sorted = products.sort((a, b) => b.sales - a.sales);
  res.json(sorted.slice(0, 20));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});
