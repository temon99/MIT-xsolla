export class Webshop {
  constructor(page) {
    this.page = page;
  }
  async goto() {

    await this.page.goto(`${process.env.WEB_SHOP}`, {
      waitUntil: 'domcontentloaded'
    });
}}
