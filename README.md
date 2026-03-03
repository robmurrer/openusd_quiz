# OpenUSD Practice Exam Website

This repository hosts a full React website for your OpenUSD practice exam.

## Run locally

1. Install dependencies:

	npm install

2. Start the dev server:

	npm run dev

3. Open the local URL shown in the terminal (usually `http://localhost:5173`).

## Build locally

npm run build

The production output is generated in `dist/`.

## One-command deploy check

Run:

npm run deploy-check

This builds the app and serves the production `dist/` output locally at:

http://localhost:4173

Use this to verify exactly what GitHub Pages will serve.

## Publish to GitHub Pages

This repo already includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push this repository to GitHub (branch: `main`).
2. In GitHub: **Settings → Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.
4. Push any new commit to `main` (or run the workflow manually from Actions).

Your site will be published at:

https://robmurrer.github.io/openusd_quiz/

## Notes

- The Vite `base` path is configured for this repository name (`/openusd_quiz/`).
- If you rename the repo, update `base` in `vite.config.js`.