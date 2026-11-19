# Mostrelli

Gioco di creature originale ambientato in Emilia-Romagna: 180 luoghi tra città, paesi e frazioni,
battaglie con comandi a tempo, meteo, e multiplayer online (sfide, cooperativa, scambi, partita veloce).

## Struttura

- `frontend/` — il gioco (Expo / React Native). Gira su iPhone, Android e nel browser.
- `backend/` — il server (FastAPI + MongoDB): account, salvataggi e stanze online.
- `gb/` — versione Game Boy Color separata e più piccola (`mostrelli.gbc`).
- `memory/PRD.md` — storia di tutte le modifiche.

## Pubblicare gratis la versione web

Servono tre account gratuiti: MongoDB Atlas, Render e Netlify, più questo repository su GitHub.

1. **Database (MongoDB Atlas)**: crea un cluster gratuito "M0", un utente con password e, in
   "Network Access", consenti l'accesso da ovunque (`0.0.0.0/0`). Copia la stringa di connessione.
2. **Server (Render)**: New → Blueprint → scegli questo repository. Render legge `render.yaml`.
   Incolla la stringa di Atlas in `MONGO_URL`. Alla fine avrai un indirizzo tipo
   `https://mostrelli-api.onrender.com` (controlla che `/health` risponda `{"status":"ok"}`).
3. **Sito (Netlify)**: Add new site → Import from GitHub → questo repository. Netlify legge
   `netlify.toml`. In Site settings → Environment variables aggiungi
   `EXPO_PUBLIC_BACKEND_URL` = indirizzo del server Render (senza `/api`), poi rifai il deploy.
4. **Su iPhone**: apri l'indirizzo Netlify in Safari → Condividi → "Aggiungi alla schermata Home".

Nota: sul piano gratuito di Render il server si addormenta dopo 15 minuti senza uso; il primo
accesso dopo una pausa può impiegare circa un minuto.

## Provarlo sul computer

```
cd backend && cp .env.example .env   # compila i valori
pip install -r requirements.txt && uvicorn server:app --port 8001
cd frontend && cp .env.example .env  # EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
npm install && npx expo start --web
```

Comandi da tastiera: frecce o WASD per camminare, Z / Invio / Spazio = A, X = B, Esc = menu.
