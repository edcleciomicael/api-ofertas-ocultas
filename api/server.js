const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const {
  exchangeCode, getAuthorizationUrl, getTrendingProducts, hasAccessToken, searchProducts,
} = require('./meliService');

const app = express();
const oauthStates = new Map();
app.use(cors());
app.use(express.json());

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

app.get('/', (req, res) => res.json({
  name: 'API Ofertas Ocultas', status: 'online',
  mercadoLivre: hasAccessToken() ? 'autorizado' : 'aguardando autorização',
}));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/oauth/mercadolivre/authorize', (req, res) => {
  const state = crypto.randomBytes(24).toString('hex');
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);
  res.redirect(getAuthorizationUrl(state));
});

app.get('/api/oauth/mercadolivre/callback', asyncRoute(async (req, res) => {
  const { code, state, error } = req.query;
  const expiresAt = oauthStates.get(state);
  oauthStates.delete(state);
  if (error) return res.status(400).send(`Autorização recusada: ${error}`);
  if (!code || !state || !expiresAt || expiresAt < Date.now()) {
    return res.status(400).send('Autorização inválida ou expirada. Inicie novamente.');
  }
  await exchangeCode(code);
  res.type('html').send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8">
    <title>Ofertas Ocultas</title><body style="font-family:Arial;max-width:720px;margin:60px auto;padding:24px">
    <h1>Mercado Livre conectado!</h1>
    <p>A autorização foi concluída com segurança. Você já pode fechar esta janela.</p>
    <p>Nenhuma credencial é exibida ou enviada ao navegador.</p></body></html>`);
}));

app.get('/api/search', asyncRoute(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.status(400).json({ error: 'Informe o parâmetro q.' });
  res.json(await searchProducts(query, req.query.limit));
}));

app.get('/api/deals', asyncRoute(async (req, res) => {
  const products = await searchProducts(String(req.query.q || 'ofertas').trim(), req.query.limit || 50);
  res.json(products.filter((product) => product.discount >= 10)
    .sort((a, b) => b.discount - a.discount));
}));

app.get('/api/trending', asyncRoute(async (req, res) => {
  const configured = process.env.MELI_TRENDING_CATEGORIES || 'MLB1051';
  const categories = String(req.query.categories || configured).split(',')
    .map((category) => category.trim()).filter(Boolean);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  res.json(await getTrendingProducts(categories, limit));
}));

app.use((error, req, res, next) => {
  console.error(error.response?.data || error.message || error);
  if (res.headersSent) return next(error);
  const status = error.response?.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Erro interno da API.' : 'Falha na integração com o Mercado Livre.',
    details: error.response?.data?.message || error.message,
  });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log('Servidor rodando na porta', PORT));
module.exports = app;
