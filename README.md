# Arssh Kumar — portfolio

Single-page editorial "index" portfolio. Plain HTML/CSS/JS, no build step.

## Files
- `index.html` — the homepage (9 sections, 00–08).
- `styles.css` — design tokens + layout. Dark "ink" default, light "paper" via `[data-theme="light"]`.
- `main.js` — vanilla behaviors: scroll-spy + sliding rail, reveal-on-enter, scroll-progress, parallax, theme toggle.
- `portrait.jpg` — profile photo (referenced from section 01).
- `.nojekyll` — tells GitHub Pages to serve files as-is.

## Local preview
```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy (GitHub Pages)
Push to the repo's default branch and enable Pages → "Deploy from a branch" → root.
No build step required.

## Editing
Search for `EDIT:` comments and `data-edit` attributes — those mark the spots that
still need real content (URLs, email, dates, roles). The `data-edit` markers render
with a dashed outline so they're easy to spot in the browser; remove the attribute
once filled in.
