# Creative OS Browser V7 — Local PostgreSQL + Gemini/OpenAI

V7 adds a provider-independent AI layer. Gemini is the default provider, OpenAI remains optional.

## 1. Security first
If an API key has ever been pasted into chat, screenshots, source control, or shared files, revoke it and create a new key. Put the replacement only in `.env.local`.

## 2. Database
Use the same local `creative_os_db` from V6. No SQL migration is required for V7.

## 3. Install
```powershell
npm install
```

## 4. Configure `.env.local`
Copy `.env.example` to `.env.local`, then set your local PostgreSQL password and Gemini key:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=creative_os_db
DB_USER=postgres
DB_PASSWORD=YOUR_LOCAL_POSTGRES_PASSWORD
DB_SSL=false

AI_PROVIDER=gemini
GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY
GEMINI_MODEL=gemini-3.6-flash
GEMINI_ENABLE_SEARCH=true
IMAGE_PROVIDER=gemini
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
```

Do not quote the key unless your shell/environment requires it. Do not commit `.env.local`.

## 5. Run
```powershell
npm run dev
```
Open:
- App: http://localhost:3000
- Health: http://localhost:3000/api/health

A healthy Gemini setup should report approximately:
```json
{
  "aiProvider": "gemini",
  "geminiConfigured": true,
  "databaseOk": true,
  "storageMode": "local-filesystem"
}
```

## 6. Pipeline behavior
Research -> Angles -> Hooks -> Concepts -> Briefs -> Production.
Each downstream stage remains locked until the latest upstream run is approved.

For Gemini research, `GEMINI_ENABLE_SEARCH=true` enables Google Search grounding.

## 7. Production behavior
Gemini/Nano Banana generates only the environment/background. The app then composites:
1. canonical real front pack,
2. canonical real cookie reference,
3. exact approved typography,
4. brand UI and export.

The default Gemini image model is `gemini-3.1-flash-image` (Nano Banana 2). You can change it in `.env.local`.

## 8. OpenAI fallback
To use OpenAI instead:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6
IMAGE_PROVIDER=openai
OPENAI_IMAGE_MODEL=gpt-image-2
```
Then restart `npm run dev`.
