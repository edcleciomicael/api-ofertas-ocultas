const axios = require("axios");

async function searchProducts(query) {
  try {

    // URL do Mercado Livre
    const mlUrl =
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=20`;

    // Proxy
    const proxyUrl =
      `https://corsproxy.io/?${encodeURIComponent(mlUrl)}`;

    const response = await axios.get(proxyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    const data = response.data;

    // DEBUG
    console.log("DATA:", JSON.stringify(data).slice(0, 500));

    if (!data.results) {
      return [];
    }

    return data.results.map(item => ({
      external_id: item.id,
      name: item.title,
      price: item.price,
      old_price: item.original_price || null,
      discount: item.original_price
        ? Math.round(
            ((item.original_price - item.price) /
              item.original_price) * 100
          )
        : null,
      image: item.thumbnail,
      link: item.permalink,
      sales: item.sold_quantity || 0,
      free_shipping: item.shipping?.free_shipping || false
    }));

  } catch (error) {

    console.error("ERRO COMPLETO:");

    if (error.response) {
      console.error(error.response.status);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    return [];
  }
}

module.exports = { searchProducts };