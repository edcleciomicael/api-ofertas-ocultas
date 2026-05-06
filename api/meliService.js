const axios = require("axios");

async function searchProducts(query) {
  try {
    const response = await axios.get(
      "https://api.mercadolibre.com/sites/MLB/search",
      {
        params: {
          q: query,
          limit: 20
        }
      }
    );

    const data = response.data;

    if (!data.results) return [];

    return data.results.map(item => ({
      external_id: item.id,
      name: item.title,
      price: item.price,
      old_price: item.original_price || null,
      discount: item.original_price
        ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
        : null,
      image: item.thumbnail,
      link: item.permalink,
      sales: item.sold_quantity,
      free_shipping: item.shipping?.free_shipping
    }));

  } catch (error) {
    console.error(
      "Erro Mercado Livre:",
      error.response?.status,
      error.response?.data || error.message
    );
    return [];
  }
}

module.exports = { searchProducts };