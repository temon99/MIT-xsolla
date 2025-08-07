export class Webshop_Main {
  async goto() {

    await this.page.goto(`${process.env.WEB_SHOP_Main}`, {
      waitUntil: 'domcontentloaded'
    });
}}
