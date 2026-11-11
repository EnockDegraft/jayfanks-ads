# Jay Fanks kiosk

A Next.js App Router kiosk page for Jay Fanks hair and skin care, with an automatic product slideshow and a customer-interest form. The product images and logo are sourced from the Jay Fanks website.

## Run locally

```bash
npm install
npm run dev
```

The form submits JSON with `POST /api/leads`. Connect that route to your backend before using the page to collect customer information. The request body contains `name`, `email`, `phone`, `interest`, `consent`, and `submittedAt`. The page reports an error when the endpoint is unavailable; it does not save customer information in the browser.

Add your privacy notice before publishing. Product names, images, prices, address, email, and phone number are based on [jayfanks.com](https://jayfanks.com); verify them before publishing.
