# Flying Pancakes of the World

A travel journal of the world’s pancakes and their griddled cousins. This issue has the edited entries on the home page. The shelf is growing to **1,000**. Every count on the site is the number of edited entries.

You move by hot air balloon, plane, train, and boat. Each pancake page is a stop, with a recipe, an origin, a history, and a **Why it tastes this way** note that ties ingredients, trade, climate, migration, or a religious calendar to the flavor. An **Authentic touch** is the cooking tip. Histories leave out claims that are not solid.

Illustrations are drawn for this site. The route map uses Natural Earth shapes and Leaflet. No paid map key.

The live site is GitHub Pages from `main`:

**https://jonldavis-coder.github.io/flying-pancakes/**

## Pages

- Home: a voyage invitation, search, and filters for region, type, heat, use, diet, and country.
- Route map: journey lines with a vehicle on each leg, plus shaded countries.
- Journeys: curated routes, including Who settled the flavor.
- Explore: by region, by type, and by use.
- Recipe books: the top 100, regional books, and breakfast, savory, and dessert booklets. Each has a cover, a schematic route, a contents list, and a printable view. The shop is coming soon. Prices are placeholders. The Complete Collection is 30% off the sum of those prices, computed from the config, not stored as its own amount.
- Pancake pages: recipe, print full recipe, print ingredients only, Recipe JSON-LD, and a next stop.
- Pancake 101 and a glossary.
- Community: 1–5 star reviews, comments, hearts, recipe additions (“twists”), and a form to submit a pancake.
- About, guidelines, affiliate disclosure, draft privacy, draft terms, and a 404 page.

Until Supabase is connected, a banner says that community notes stay in this browser.

## Run it locally

```bash
npm test
npm run preview
```

Open http://127.0.0.1:4173/flying-pancakes/

`npm test` rebuilds the pages and checks the catalog.

## Demo mode and Supabase

Leave `SUPABASE_URL` and `SUPABASE_ANON_KEY` empty in `config.js`. The site then uses `localStorage`.

Passwords are hashed in the browser. That only keeps them out of plain text. Demo mode is for trying the kitchen, not for a private multi-user site.

To turn on Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor.
3. Set the site URL to `https://jonldavis-coder.github.io/flying-pancakes/` and the redirect to `https://jonldavis-coder.github.io/flying-pancakes/login.html`.
4. Copy the project URL and the anon key into `config.js`. Never commit the service-role key.
5. After you create an account, insert your user id into `public.owners`.

Ads stay off while `ads-config.js` says `provider: "none"`. Slots are omitted from print views.

## Food

Recipes are home cooking. They are not professional food-safety or medical advice. Diet tags match the written recipe. Cassava pages use commercial cassava flour, tapioca starch, or yuca sold ready to cook. They do not explain how to process bitter cassava.
