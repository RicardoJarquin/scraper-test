const { firefox } = require('playwright');

(async () => {
  // Lanzar el navegador
  const browser = await firefox.launch({ headless: false }); // Cambiar a true si no necesitas ver el navegador
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Navegar a la página de Inmuebles24
  await page.goto('https://es-la.facebook.com/marketplace/guadalajara/propertyforsale/');

  // Esperar a que los datos se carguen
  await page.waitForSelector("[class^='CardContainer-sc-']");

  // Extraer datos
  const properties = await page.evaluate(() => {
    const propertyElements = document.querySelectorAll("[class^='CardContainer-sc-']");;
    const data = [];

    propertyElements.forEach((property) => {

        const internalDiv = property.querySelector("div[data-to-posting]");
        let propertyLink = '';
        if (internalDiv) {
            propertyLink = internalDiv.getAttribute("data-to-posting");
        }
        //const title = property.querySelector('.sc-1tt2nwi-0')?.textContent.trim() || 'Título no disponible';
        priceProperty = property.querySelector("[class^='postingPrices-module__price']").textContent.trim();
        //data.push(priceProperty);
        //return priceProperty;
        let numericPrice = 0;
        if (priceProperty) {
            numericPrice = parseInt(priceProperty.replace(/[^0-9]/g, ""), 10); // Elimina todo excepto los números
            //console.log(numericPrice); // Imprime solo el número
        }
        //const price = property.querySelector(".postingPrices-module__price")?.textContent.trim() || 'Precio no disponible';
        data.push({
            price: numericPrice ?? 0,
            propertyLink:propertyLink ?? "No Link"
        });
    });

    return data;
  });

  // Imprimir los datos
  console.log(properties);

  // Cerrar el navegador
  await browser.close();
})();
