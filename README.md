# OmniaPi Configuratori

Monorepo con Frontend React + Backend Express per i configuratori/preventivatori OmniaPi.

## Struttura

```
OmniaPi_Configurators/
├── BE/        # Express + TypeScript, porta 3001
├── FE/        # React + Vite + TypeScript, base /configuratori/
└── landing/   # Hub statico servito su "/" (nessuna build richiesta)
```

## Avvio rapido (Pi)

```bash
# BE
cd BE && npm install && npm run build && pm2 start ecosystem.config.js

# FE
cd FE && npm install && npm run build
```
