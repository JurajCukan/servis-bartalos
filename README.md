# Servisná knižka Bartalos

Offline desktopová aplikácia pre správu autoservisu — evidencia zákazníkov, vozidiel, servisných záznamov a plánovaných úloh.

## 🚀 Rýchly štart (Vývoj)

### Predpoklady
- Node.js (v20+)
- Windows 10/11

### Spustenie
```bash
# Inštalácia závislostí
npm install

# Spustenie vývojového prostredia
npm run dev
```

## 📦 Zostavenie aplikácie

```bash
# Vytvorenie inštalačky (.exe) v priečinku release/
npm run build
```

## 🛠️ Architektúra (v2.0.0+)

- **Electron** + **React** + **TypeScript**
- **better-sqlite3**: Vstavaná lokálna databáza priamo v Electron procese (`%APPDATA%/servis-bartalos/servis.db`)
- **Fotografie**: Ukladané lokálne v `%APPDATA%/servis-bartalos/photos/` a načítavané cez vlastný protokol `app-photo://`
- Žiadne externé závislosti ani spúšťanie externých služieb.

## 📄 Licencia

Súkromný projekt. Všetky práva vyhradené.
