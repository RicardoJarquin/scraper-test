const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.casasyterrenos.com',
    },
  });

  const page = await context.newPage();
  await page.goto('https://www.casasyterrenos.com/jalisco/zapopan/casas-y-departamentos/venta?desde=0&hasta=1000000000&utm_source=results_page');

  await page.waitForSelector('.sm\\:grid');

  const properties = await page.evaluate(() => {
    const propertyElements = document.querySelectorAll('.sm\\:grid .text-blue-cyt.font-bold');
    const data = [];

    propertyElements.forEach((propertyElement) => {
      const propertyLink = propertyElement.closest('a') ? propertyElement.closest('a').href : null;

      const priceText = propertyElement.innerText.trim();
      const numericPrice = parseInt(priceText.replace(/[^0-9]/g, ""), 10);

      if (propertyLink && !isNaN(numericPrice)) {
        data.push({
          price: numericPrice,
          propertyLink: propertyLink,
        });
      }
    });

    return data;
  });

  for (let property of properties) {
    if (property.propertyLink) {
      const newTab = await context.newPage();
      await newTab.goto(property.propertyLink);

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await sleep(3000);

      await newTab.waitForSelector('.block.md\\:grid');

      const additionalInfo = await newTab.evaluate((property) => {
        const featureNodes = document.querySelector('.block.md\\:grid.grid-cols-2.lg\\:flex.md\\:gap-5').childNodes;

        const sizeNodes = document.querySelectorAll('.my-4.text-gray-700.px-5.uppercase.min-w-44');
        const sizeTextNodes = document.querySelectorAll('.text-gray-500.bg-white.px-6.flex.items-center.justify-start.w-full');

        sizeNodes.forEach((sizeNode) => {
            if(sizeNode.innerText == 'TERRENO'){
                property.totalSize = sizeNode.innerText;
            }else{
                property.totalBuild = sizeNode.innerText;
            }
        });

        sizeTextNodes.forEach((sizeTextNode) => {
            let parentNode = sizeTextNode.parentNode;
            if(parentNode.querySelector('.my-4.text-gray-700.px-5.uppercase.min-w-44').innerText == 'TERRENO'){
                property.totalSize = sizeTextNode.innerText;
            }else{
                property.totalBuild = sizeTextNode.innerText;
            }
        });
        console.log(featureNodes);
        featureNodes.forEach((featureNode) => {
            const image = featureNode.querySelector('img');
            const pElement = featureNode.querySelector('p');

            if (image && pElement) {
                const featureText = pElement.innerText.trim();
                const featureAlt = image.getAttribute('alt');
                switch (featureAlt) {
                    case 'icono numero de baños':
                        property.bathroom = featureText;
                        break;
                    case 'icono numero de estacionamientos':
                        property.garage = featureText;
                        break;
                    case 'icono numero de habitaciones':
                        property.bedroom = featureText;
                        break;
                    case 'icono de numero de medios baños':
                        property.toilete = featureText;
                        break;
                    default:
                        break;
                }
            }
        });

        return property;
      }, property);

      console.log(additionalInfo);
      await newTab.close();
    }
  }

  await browser.close();
})();
