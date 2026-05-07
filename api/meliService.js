const puppeteer = require("puppeteer");

async function searchProducts(query) {

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  try {

    const page = await browser.newPage();

    // User Agent real
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
    );

    await page.goto(
      `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
        timeout: 60000
      }
    );

    // Espera carregar qualquer card
    await page.waitForSelector("li.ui-search-layout__item", {
      timeout: 60000
    });

    const products = await page.evaluate(() => {

      const items =
        document.querySelectorAll("li.ui-search-layout__item");

      return Array.from(items)
        .slice(0, 20)
        .map(item => {

          const title =
            item.querySelector("h3")?.innerText || "";

          const price =
            item.querySelector(".andes-money-amount__fraction")
              ?.innerText || "";

          const link =
            item.querySelector("a")?.href || "";

          const image =
            item.querySelector("img")?.src || "";

          return {
            name: title,
            price,
            link,
            image
          };

        });

    });

    await browser.close();

    return products;

  } catch (error) {

    console.error("SCRAPER ERROR:");
    console.error(error);

    await browser.close();

    return [];
  }
}

module.exports = { searchProducts };