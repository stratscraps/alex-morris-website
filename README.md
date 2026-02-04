# Alex Morris Website

Split-screen portfolio site with Public Works (dark) and Private Works (light) sections.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deploy to Vercel

### First Time Setup

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/alex-morris-website.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Astro — click "Deploy"

3. **Add Custom Domain:**
   - In Vercel dashboard → Settings → Domains
   - Add your domain and follow DNS instructions

### Pushing Updates

After making changes:

```bash
git add .
git commit -m "Update content"
git push
```

Vercel automatically rebuilds and deploys on every push to `main`.

---

## Editing Content

### Public Works Links

Edit `src/pages/public-works/index.astro`:

```javascript
const sections = [
  {
    title: 'Newsletter',
    links: [
      { label: 'Your Link Text', url: 'https://your-url.com' }
    ]
  },
  // Add more sections...
];
```

### Private Works Accordions

Edit `src/pages/private-works/index.astro`:

```javascript
const sections = [
  {
    id: 'clients',
    title: 'Past Clients',
    content: `<p>Your HTML content here</p>`
  },
  // Add more sections...
];
```

### Logo

Replace `public/logo.svg` with your actual logo file.

### Colors

Edit `src/styles/global.css`:

```css
:root {
  --color-dark: #1a1a1a;
  --color-light: #fafafa;
  --color-accent: #4CAF7C;
}
```

---

## Project Structure

```
alex-morris-website/
├── public/
│   ├── logo.svg
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro          # Homepage (split screen)
│   │   ├── public-works/
│   │   │   └── index.astro      # Public Works page
│   │   └── private-works/
│   │       └── index.astro      # Private Works page
│   └── styles/
│       └── global.css
├── astro.config.mjs
└── package.json
```

---

## Workflow Summary

1. Edit `.astro` files or CSS
2. Test locally with `npm run dev`
3. Commit and push: `git add . && git commit -m "message" && git push`
4. Vercel deploys automatically

Built with [Astro](https://astro.build) • Deployed on [Vercel](https://vercel.com)
