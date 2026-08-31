const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProduct } = require('../meliService');

test('normaliza produto e calcula desconto', () => {
  const product = normalizeProduct({
    id: 'MLB123', title: 'Produto teste', price: 80, original_price: 100,
    currency_id: 'BRL', thumbnail: 'http://imagem.test/produto.jpg',
    permalink: 'https://produto.test/MLB123', sold_quantity: 25,
    available_quantity: 8, category_id: 'MLB1051',
  }, 1);
  assert.equal(product.discount, 20);
  assert.equal(product.sales, 25);
  assert.equal(product.image, 'https://imagem.test/produto.jpg');
  assert.equal(product.rank, 1);
  assert.equal(product.marketplace, 'Mercado Livre');
});

test('mantém desconto zero sem preço anterior', () => {
  const product = normalizeProduct({ id: 'MLB1', title: 'Sem promoção', price: 50 });
  assert.equal(product.originalPrice, 50);
  assert.equal(product.discount, 0);
});
