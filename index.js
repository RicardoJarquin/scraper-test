import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96YXNuaGtxZW1qbWdub3NmdXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NzgwNTYsImV4cCI6MjA0OTQ1NDA1Nn0.8gkHHP8kK4Ofylgfll3UKdta1mWx2tJm8OSgw0ZUNC0";
const supabaseKey = "https://ozasnhkqemjmgnosfuyi.supabase.co";
const supabase = createClient(supabaseUrl, supabaseKey);


(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.inmuebles24.com/',
    },
  });
    const page = await context.newPage();
    await page.goto('https://www.inmuebles24.com/inmuebles-en-venta-en-guadalajara-o-zapopan-o-tonala-o-tlajomulco-de-zuniga-ordenado-por-fechaonline-descendente.html');
    await page.waitForSelector("[class^='CardContainer-sc-']");
    await page.waitForTimeout(20000);
    await page.click("[class^='ButtonContainer-sc-124l6yu-0']");
    await page.waitForTimeout(2000);
    await page.fill('#input-email', 'ricardo.jarq@gmail.com');
    await page.waitForTimeout(20000);
    await page.click('[data-qa="SUBMIT_EMAIL"]');
    await page.fill('#input-password', 'Contra2024');
    await page.waitForTimeout(20000);
    await page.click('[data-qa="PASSWORD_SUBMIT"]');

  const properties = await page.evaluate(() => {
    const propertyElements = document.querySelectorAll("[class^='CardContainer-sc-']");;
    const data = [];

    propertyElements.forEach((property) => {

        let propertyLink = '';
        const internalDiv = property.querySelector("div[data-to-posting]");
        if (internalDiv) {
            propertyLink = internalDiv.getAttribute("data-to-posting");
        }

        let numericPrice = 0;
        let priceProperty = property.querySelector("[class^='postingPrices-module__price']").textContent.trim();
        if (priceProperty) {
            numericPrice = parseInt(priceProperty.replace(/[^0-9]/g, ""), 10);
        }

        data.push({
            price: numericPrice ?? 0,
            propertyLink:propertyLink ?? "No Link"
        });
    });

    return data;
  });

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  await sleep(2000);

  for (let property of properties) {
    if (property.propertyLink !== "No Link") {
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.inmuebles24.com/',
        },
        });
      const newTab = await context.newPage();
      await newTab.goto(`https://www.inmuebles24.com${property.propertyLink}`);

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      await sleep(10000);

      await newTab.waitForSelector("[class^='section-icon-features']");

      const additionalInfo = await newTab.evaluate((property) => {
        const featureNodes = document.getElementById("section-icon-features-property").childNodes;

        featureNodes.forEach((featureNode) => {
          if (featureNode.nodeName === 'LI') {
            switch (featureNode.firstElementChild.className) {
              case 'icon-stotal':
                property.totalSize = featureNode.innerText.trim(); // Usar `trim` para limpiar espacios
                break;
              case 'icon-scubierta':
                property.totalBuild = featureNode.innerText.trim();
                break;
              case 'icon-bano':
                property.bathroom = featureNode.innerText.trim();
                break;
              case 'icon-cochera':
                property.garage = featureNode.innerText.trim();
                break;
              case 'icon-dormitorio':
                property.bedroom = featureNode.innerText.trim();
                break;
              case 'icon-toilete':
                property.toilete = featureNode.innerText.trim();
                break;
            }
          }
        });

        return property;
      }, property);

      console.log(additionalInfo)

      const { dataResponse, errorResponse } = await supabase
        .from('properties')
        .insert([
            {
                price: property.price ?? null ,
                property_link: property.propertyLink ?? null ,
                total_size: property.totalSize ?? null ,
                total_build: property.totalBuild ,
                bathroom: property.bathroom ?? null ,
                garage: property.garage ?? null ,
                toilete: property.toilete ?? null
            }
        ]);

        if (errorResponse) {
            console.error("Error inserting data:", errorResponse);
          } else {
            console.log("Data inserted successfully:", dataResponse);
          }

      await newTab.close();
    }
  }

  await browser.close();
})();
