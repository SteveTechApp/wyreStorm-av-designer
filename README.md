# Translator Chat (English ↔ Hungarian)

A simple, phone-friendly website for two people to chat and automatically read messages in their own language.

- Steve: English (`en`)
- Andrea: Hungarian (`hu`)

## Run locally

1. Install Node.js 18+
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser.
   - Quick links:
     - Steve: `http://localhost:3000/?name=Steve&lang=en`
     - Andrea: `http://localhost:3000/?name=Andrea&lang=hu`

## How it works
- Real-time chat via WebSockets
- Translations via [LibreTranslate](https://libretranslate.com/). You can change the API endpoint or add an API key in `.env`.

## Configure translation
Create a `.env` file (copy from `.env.example`) and optionally set:
```
TRANSLATE_API_URL=https://libretranslate.de
TRANSLATE_API_KEY=your_key_if_needed
```

## Deploy (easy options)
- Render: create a new Web Service from this repo; set `Start Command` to `npm start`
- Railway: deploy a Node.js app; default port env is supported
- Fly.io / Heroku-like platforms work too

After deploy, share links like:
- `https://yourapp.com/?name=Steve&lang=en`
- `https://yourapp.com/?name=Andrea&lang=hu`

## Notes
- Public LibreTranslate instances may rate-limit. For reliability, run your own instance or use a paid translation API.