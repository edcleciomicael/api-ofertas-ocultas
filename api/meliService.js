const puppeteer = require("puppeteer");

async function searchProducts(query) {

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {

    const page = await browser.newPage();

    await page.goto(
      `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60000
      }
    );

    await page.waitForSelector(".ui-search-result");

    const products = await page.evaluate(() => {

      const items = document.querySelectorAll(".ui-search-result");

      return Array.from(items).slice(0, 20).map(item => {

        const title =
          item.querySelector(".poly-component__title")?.innerText || "";

        const price =
          item.querySelector(".andes-money-amount__fraction")?.innerText || "";

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

    console.error(error);

    await browser.close();

    return [];
  }
}

module.exports = { searchProducts };