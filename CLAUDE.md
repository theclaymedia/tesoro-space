# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static HTML mockup redesigning **Tesoro Space** (https://tesorospace.com), a
maker of luxury outdoor furniture in Los Angeles. The live site is Shopify,
using the stock "Broadcast" theme, and **stays on Shopify**. This mockup is
the spec for a new Shopify theme, not a WordPress build. Port the pages to
Liquid once the design is agreed.

The goal is a complete cosmetic refresh. Keep the site's **pages, products,
photos and specs**. Don't copy the Broadcast styling.

## Running locally

There's no build step and no dependencies. Serve the repo root:

```bash
python3 -m http.server 8000
```

## Code structure

- `css/styles.css` is the only stylesheet. Colour tokens live on `:root`.
  Fonts are **sans-serif only** (client request): Jost for display and
  Hanken Grotesk for text, both self-hosted variable woff2 files in
  `assets/fonts/`. The logo gold `--gold` (#AB9865) is 2.8:1 on white, so it
  is decorative only, or text on `--ink`. Use `--gold-ink` for gold text on
  light grounds.
- `js/site.js` (the global `Tesoro`) loads both JSON files, renders the shared
  header, footer and quote dialog, and holds the helpers and `productCard()`.
  Header and footer exist only here. Pages contain the `data-site-header` and
  `data-site-footer` hooks.
- Each page has its own script (`js/home.js`, `js/product.js`) that runs
  after `Tesoro.init()`. `product.html?p=<handle>` is the one template for all
  21 products.
- The quote dialog **doesn't send anything** in the mockup. It shows a
  confirmation naming the chosen region's rep. Real delivery is decided at
  the Shopify stage.
- Pages not built yet are linked from the nav: `collection.html?c=…`,
  `samples.html`, `about.html` and `contact.html`.

## Data and assets

- `data/shopify-products.json` is a raw copy of the live store's
  `/products.json` (21 products). It's the source of truth for product names,
  handles, options and spec text (`body_html`). The mockup reads product data
  from here, or from a file derived from it, rather than hard-coding it into
  the HTML. That keeps the Liquid port a direct mapping, because
  `product.options`, `variants`, `images` and `tags` keep their Shopify shape.
- Refresh it with:
  `curl -sL "https://tesorospace.com/products.json?limit=250" -o data/shopify-products.json`
- `assets/products/<handle>/NN.jpg` holds the live product photos, numbered
  in Shopify image order. They're 1600px JPG at q80. The originals are 2000px
  PNG on white and live in the gitignored `assets/_raw/`.
- `assets/site/` holds the homepage hero images (`hero-1..3.jpg`, 2400px,
  studio shots on white, so text never sits over them) and the logos.
  `logo-ink.png` is a dark recolour of `logo-white.png`.
- `assets/swatches/<finish-slug>.jpg` are cropped from the client's own
  sample-set photos (`sample-sets` product). `ipe.jpg` is cropped from a Sola
  chair close-up.
- `data/catalog.json` is our config layered on the Shopify data: finish
  labels and slugs, `baseFinish`, `imageOption`, the `finishImages` manifest,
  reps, collections and featured pieces. Adding a finish image means placing
  the file and adding one line to `finishImages`.
- Don't filter products by `vendor`. The Lux Lounge Sofa is vendor
  `TESOROMOCK` in Shopify. Exclude `sample-sets` by its handle.

## Site map, mirroring the live site

- Home
- Collections: Seating, Tables, Sets, and Assortment (all products). On the
  live store these are filled automatically from the product type and tags,
  which are inconsistent (e.g. "Chair, Sofa, Sectional, Bun, Sets").
- Product pages: 21 in total. `sample-sets` is a free sample product, not
  furniture.
- About, Contact, and Samples (the free metal/fabric/stone sample set).
- The live `/blogs/news` has no posts and isn't linked from anywhere, so
  **drop it**.

## Client decisions

- **No visible prices, no cart, no checkout.** The pieces cost roughly
  $1k–$50k. Every product page leads to **Request a Quote** plus call and
  email links.
- **Inquiries go to the nearest regional rep.** The visitor picks a region,
  and the quote form carries the chosen configuration (piece + metal + fabric
  + stone/wood). The reps, taken from the live Contact page:
  - LA Studio: 2624 Yates Avenue, Commerce, CA 90040, Tel (323) 721-1900
  - Los Angeles: Vicent V, vicentv@tesorospace.com, 626.922.2119
  - Toronto: James Loppie, jamesl@tesorospace.com, 647.466.1600
  - Chicago: Allen Meyer, allenm@tesorospace.com, 847.606.6272
  - Miami – Calabasas CA: Jamie Luterman, jaimel@tesorospace.com,
    267.242.9417. The name and email spelling differ ("Jamie" vs "jaimel"),
    and so does the region label. Confirm both with the client.
  - General: info@tesorospace.com, 626.922.2119
- **Option set per piece. Keep it to these; don't add more:**
  - Metal (4): High Gloss White, Satin Silver, Matte Black, Brass
  - Wood (1): Ipê
  - Fabric (4, all Sunbrella): Caprino Aruba, Bliss Linen, Charter Cloud,
    Tailored Guava
  - Stone (4, **kept**): Pure Black Polish Quartz, Calacatta Viola, Pure White
    Quartz, Calacatta Marble

  Each product only offers the option groups listed in its own `options` in
  the JSON.
- **Changing the image with the finish.** Clicking a metal swatch swaps the
  main image. Fabric or stone swatches only update the selection label,
  except on mainly upholstered pieces, where fabric may drive the image. Only
  1 of the 21 products has per-finish photos today. Every missing version
  shows a **placeholder** until John supplies the image, and a missing image
  must fall back to the current photo rather than break.
- **New designer pieces will be added over time.** On the live site the
  client adds them as normal Shopify products, and tags fill the collections
  (plan: a "Designer Collection" tag). No developer should be needed for each
  new piece, so new pieces have to fit the existing product template.
