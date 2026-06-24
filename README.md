# vakilzadeh.com

Personal resume site for Hamid Vakilzadeh — a single static page, no build step,
no dependencies. Hosted on GitHub Pages at **[vakilzadeh.com](https://vakilzadeh.com)**.

## Structure

| File | Concern |
| --- | --- |
| `index.html` | Content & structure |
| `styles.css` | Design system — theme variables, light/dark, tag styles, print rules |
| `script.js` | Behavior — theme toggle, print/PDF, focus-area filters |
| `CNAME` | Custom domain for GitHub Pages |

The page was originally authored in a design canvas; it has been ported to a
self-contained static site (the original export is kept locally in the
gitignored `offline/` folder).

## Develop

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Features

- **Light / dark theme** — toggled in the header, persisted in `localStorage`.
- **Print / PDF** — print-optimized stylesheet (`@media print`), letter size.
- **Focus filters** — click a focus area or a skill tag to show only the
  matching work, with animated show/hide and sidebar highlighting.
