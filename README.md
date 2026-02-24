# Tech Blog

Static site for Alessandro Garavaglia's technical blog, hosted on GitHub Pages.

**Live site**: https://agaravaglia.github.io/tech-blog

## Stack

- Pure HTML/CSS/JS — no build step, no framework
- `index.json` as the article metadata index
- Client-side search and tag filtering via `main.js`
- Syntax highlighting via [highlight.js](https://highlightjs.org/) (CDN)

## Structure

```
tech-blog/
├── index.html          # Homepage
├── index.json          # Article metadata index
├── assets/
│   ├── style.css       # Styles
│   └── main.js         # Client-side rendering and filtering
└── articles/
    └── <slug>/
        └── index.html  # Individual article pages
```
