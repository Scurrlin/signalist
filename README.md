# Signalist

A [stock market analysis app](https://signalist.seancurrlin.com/) for tracking markets, researching stocks, and managing a personal watchlist. Built with Next.js, Tailwind CSS, TypeScript, MongoDB, Better Auth, TradingView widgets, and the Finnhub API.

![Signalist dashboard preview](public/assets/images/dashboard.jpg)

## Features

- Email/password authentication with guest access
- Personalized stock watchlists backed by MongoDB
- Stock search powered by Finnhub
- Market overview, heatmap, quotes, news, charts, technical analysis, company profile, and financials powered by TradingView
- Responsive dashboard and stock detail pages

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to view the app.

## Useful Commands

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
npm run test:db
npm run build
```

## Deployment Notes

Use Node 20 in production. Configure the deployment environment with MongoDB, Better Auth, and Finnhub settings before building or starting the app.

Required runtime variables:

- `MONGODB_URI` - MongoDB connection string
- `BETTER_AUTH_SECRET` - Better Auth secret
- `BETTER_AUTH_URL` - public URL of the deployed app
- `FINNHUB_BASE_URL` - Finnhub API base URL, usually `https://finnhub.io/api/v1`
- `FINNHUB_API_KEY` - server-side Finnhub API key

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- MongoDB and Mongoose
- Better Auth
- TradingView
- Finnhub API
