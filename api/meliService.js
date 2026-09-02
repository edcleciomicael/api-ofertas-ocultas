const axios = require('axios');
const { readTokens, writeTokens } = require('./tokenStore');

const API_URL = 'https://api.mercadolibre.com';
const AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const SITE_ID = process.env.MELI_SITE_ID || 'MLB';
const savedTokens = readTokens();

let runtimeTokens = savedTokens || {
  accessToken: process.env.MELI_ACCESS_TOKEN || '',
  refreshToken: process.env.MELI_REFRESH_TOKEN || '',
  expiresAt: 0,
};

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code', client_id: required('MELI_CLIENT_ID'),
    redirect_uri: required('MELI_REDIRECT_URI'), state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function requestToken(payload) {
  const response = await axios.post(`${API_URL}/oauth/token`,
    new URLSearchParams(payload).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 });
  runtimeTokens = {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || runtimeTokens.refreshToken,
    expiresAt: Date.now() + Math.max(0, (Number(response.data.expires_in) - 60) * 1000),
  };
  writeTokens(runtimeTokens);
  return { ...response.data };
}

async function exchangeCode(code) {
  return requestToken({
    grant_type: 'authorization_code', client_id: required('MELI_CLIENT_ID'),
    client_secret: required('MELI_CLIENT_SECRET'), code,
    redirect_uri: required('MELI_REDIRECT_URI'),
  });
}

async function refreshAccessToken() {
  const refreshToken = runtimeTokens.refreshToken || required('MELI_REFRESH_TOKEN');
  return requestToken({
    grant_type: 'refresh_token', client_id: required('MELI_CLIENT_ID'),
    client_secret: required('MELI_CLIENT_SECRET'), refresh_token: refreshToken,
  });
}

async function getAccessToken() {
  if (!runtimeTokens.accessToken) required('MELI_ACCESS_TOKEN');
  if (runtimeTokens.expiresAt && Date.now() >= runtimeTokens.expiresAt) await refreshAccessToken();
  return runtimeTokens.accessToken || process.env.MELI_ACCESS_TOKEN;
}

async function meliGet(pathname, params = {}) {
  let accessToken = await getAccessToken();
  try {
    return await axios.get(`${API_URL}${pathname}`, {
      params, headers: { Authorization: `Bearer ${accessToken}` }, timeout: 20000,
    });
  } catch (error) {
    const refreshToken = runtimeTokens.refreshToken || process.env.MELI_REFRESH_TOKEN;
    if (error.response?.status !== 401 || !refreshToken) throw error;
    await refreshAccessToken();
    accessToken = runtimeTokens.accessToken;
    return axios.get(`${API_URL}${pathname}`, {
      params, headers: { Authorization: `Bearer ${accessToken}` }, timeout: 20000,
    });
  }
}

function normalizeProduct(item, rank = null) {
  const originalPrice = Number(item.original_price || item.price || 0);
  const price = Number(item.price || 0);
  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  return {
    id: item.id, name: item.title || '', price, originalPrice, discount,
    currency: item.currency_id || 'BRL',
    image: (item.thumbnail || '').replace(/^http:/, 'https:'),
    link: item.permalink || '', sales: Number(item.sold_quantity || 0),
    availableQuantity: Number(item.available_quantity || 0),
    categoryId: item.category_id || null, rank,
    marketplace: 'Mercado Livre', source: 'mercadolivre-api',
  };
}

async function searchProducts(query, limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const response = await meliGet(`/sites/${SITE_ID}/search`, { q: query, limit: safeLimit });
  return (response.data.results || []).map((item) => normalizeProduct(item));
}

async function getItems(ids) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  const products = [];
  for (let index = 0; index < uniqueIds.length; index += 20) {
    const response = await meliGet('/items', { ids: uniqueIds.slice(index, index + 20).join(',') });
    for (const entry of response.data || []) {
      if (entry.code === 200 && entry.body) products.push(normalizeProduct(entry.body));
    }
  }
  return products;
}

async function getTrendingProducts(categoryIds, limit = 20) {
  const rankedIds = [];
  for (const categoryId of [...new Set(categoryIds)].filter(Boolean)) {
    const response = await meliGet(`/highlights/${SITE_ID}/category/${categoryId}`);
    for (const entry of response.data.content || []) if (entry.id) rankedIds.push(entry.id);
  }
  const uniqueIds = [...new Set(rankedIds)].slice(0, Math.min(Math.max(limit, 1), 100));
  const productById = new Map((await getItems(uniqueIds)).map((item) => [item.id, item]));
  return uniqueIds.map((id, index) => productById.get(id) && {
    ...productById.get(id), rank: index + 1,
  }).filter(Boolean);
}

function hasAccessToken() {
  return Boolean(runtimeTokens.accessToken || process.env.MELI_ACCESS_TOKEN);
}

module.exports = {
  exchangeCode, getAuthorizationUrl, getTrendingProducts, hasAccessToken,
  normalizeProduct, refreshAccessToken, searchProducts,
};
