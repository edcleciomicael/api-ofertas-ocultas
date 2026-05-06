const axios = require("axios");

async function searchProducts(query) {
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}`;

    const response = await axios.get(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
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
    console.error("ERRO PROXY:", error.message);
    return [];
  }
}

module.exports = { searchProducts };

/*const axios = require("axios");

async function searchProducts(query) {
  try {
    const response = await axios.get(
      "https://api.mercadolibre.com/sites/MLB/search",
      {
        params: {
          q: query,
          limit: 20
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Accept-Language": "pt-BR",
          "Connection": "keep-alive"
        }
      }
    );

    return response.data.results.map(item => ({
      external_id: item.id,
      name: item.title,
      price: item.price,
      old_price: item.original_price || null,
      discount: item.original_price
        ? Math.round(
            ((item.original_price - item.price) / item.original_price) * 100
          )
        : null, // 🔥 mudou aqui
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

module.exports = { searchProducts }; */
