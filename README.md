# Servisná knižka Bartalos

Offline desktopová aplikácia pre správu autoservisu — evidencia zákazníkov, vozidiel, servisných záznamov a plánovaných úloh s fotografiami.

![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-0.39-B8DBE4?logo=pocketbase&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![License](https://img.shields.io/badge/license-private-red)

---

## 📋 Obsah

- [O aplikácii](#-o-aplikácii)
- [Systémové požiadavky](#-systémové-požiadavky)
- [Inštalácia (používateľ)](#-inštalácia-používateľ)
- [Inštalácia pre vývojárov](#-inštalácia-pre-vývojárov)
- [Zostavenie inštalačky](#-zostavenie-inštalačky)
- [Export a import údajov](#-export-a-import-údajov)
- [Aktualizácia aplikácie](#-aktualizácia-aplikácie)
- [Štruktúra projektu](#-štruktúra-projektu)
- [Riešenie problémov](#-riešenie-problémov)

---

## 🚗 O aplikácii

**Servisná knižka Bartalos** je plne offline desktopová aplikácia pre Windows, ktorá umožňuje:

- 👥 Evidenciu **zákazníkov** (meno, telefón, e-mail, poznámky)
- 🚙 Správu **vozidiel** s fotografiami (ŠPZ, VIN, značka, model, palivo, stav)
- 🔧 Servisné záznamy s **fotografiami** (typ servisu, nájazd, cena, vymenené diely)
- 📅 **Plánované úlohy** (dátum, priorita, stav — automatické vytváranie zo servisných záznamov)
- 📦 **Export a import** údajov vrátane všetkých fotografií (prenos medzi zariadeniami)
- 🖼️ Automatická **kompresia fotografií** pred uložením (WebP, max 1920px)
- 🌙 Tmavý a svetlý režim

Všetky údaje sú uložené **lokálne na zariadení** — nepotrebujete internet, server ani registráciu.

---

## 💻 Systémové požiadavky

| Požiadavka | Minimum |
|---|---|
| Operačný systém | Windows 10 (64-bit) alebo novší |
| RAM | 4 GB |
| Voľné miesto na disku | 200 MB (+ miesto pre fotografie) |
| Internet | **Nie je potrebný** (iba na stiahnutie inštalačky a aktualizácií) |

---

## 📥 Inštalácia (používateľ)

Táto sekcia je pre koncového používateľa, ktorý chce aplikáciu nainštalovať a používať.

### Krok 1 — Stiahnite inštalačku z GitHub

1. Otvorte stránku **Releases** tohto repozitára:
   ```
   https://github.com/JurajCukan/servis-bartalos/releases
   ```

2. Pri najnovšej verzii (napr. `v1.1.0`) kliknite na súbor:
   ```
   Servisná knižka Bartalos Setup X.X.X.exe
   ```
   kde `X.X.X` je číslo verzie.

3. Počkajte na dokončenie sťahovania (~95 MB).

### Krok 2 — Spustite inštaláciu

1. Otvorte stiahnutý `.exe` súbor.

2. Ak sa zobrazí varovanie **Windows SmartScreen** („Windows protected your PC"):
   - Kliknite na **Ďalšie informácie** (More info)
   - Potom kliknite **Napriek tomu spustiť** (Run anyway)

   > ⚠️ Toto varovanie sa zobrazuje preto, lebo aplikácia nemá komerčný podpisový certifikát. Aplikácia je bezpečná.

3. V inštalačnom sprievodcovi:
   - Kliknite **Ďalej** (Next)
   - Nechajte predvolenú cestu inštalácie a kliknite **Inštalovať** (Install)
   - Počkajte na dokončenie inštalácie
   - Kliknite **Dokončiť** (Finish)

### Krok 3 — Prvé spustenie

1. Spustite aplikáciu z **pracovnej plochy** (ikona „Servisná knižka Bartalos") alebo zo **Štart menu**.

2. Pri prvom spustení aplikácia:
   - Automaticky spustí lokálnu databázu (PocketBase)
   - Naimportuje schému databázy (vytvorí tabuľky)
   - Otvorí hlavné okno aplikácie

3. **Hotovo!** Aplikácia je pripravená na používanie.

> 💡 Všetky údaje sa ukladajú do priečinka `%APPDATA%\servisna-knizka-bartalos\pocketbase_data\`. Tento priečinok **nezmazávajte** — obsahuje celú databázu a nahrané fotografie.

### Krok 4 — Overenie funkčnosti

1. Kliknite na **+ Pridať vozidlo** a skúste pridať testovacie vozidlo.
2. Otvorte detail vozidla a pridajte servisný záznam s fotografiou.
3. Prejdite do **Nastavení** a skontrolujte, že PocketBase status je zelený (pripojený).

---

## 🛠️ Inštalácia pre vývojárov

Ak chcete aplikáciu ďalej vyvíjať alebo zostaviť vlastnú inštalačku.

### Predpoklady

- [Node.js](https://nodejs.org/) v20 alebo novší
- [Git](https://git-scm.com/)
- Windows 10/11 (64-bit)

### Krok 1 — Klonovanie repozitára

```bash
git clone https://github.com/JurajCukan/servis-bartalos.git
cd servis-bartalos
```

### Krok 2 — Inštalácia závislostí

```bash
npm install
```

### Krok 3 — Konfigurácia prostredia

Vytvorte súbor `.env` v koreňovom priečinku (ak neexistuje):

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### Krok 4 — Spustenie vo vývojárskom režime

```bash
npm run dev
```

Tento príkaz:
1. Skompiluje Electron TypeScript súbory (`predev`)
2. Spustí Vite dev server na `http://127.0.0.1:5173`
3. Spustí Electron, ktorý:
   - Automaticky spustí PocketBase na `http://127.0.0.1:8090`
   - Otvorí aplikáciu s DevTools

> 💡 **Vo vývojárskom režime** je PocketBase admin UI dostupný na `http://127.0.0.1:8090/_/` pre debugging. V produkčnom builde je admin UI blokovaný.

### Krok 5 — Prvé nastavenie databázy (iba raz)

Pri prvom spustení sa databáza vytvorí automaticky. Ak potrebujete manuálne naimportovať schému:

1. Otvorte `http://127.0.0.1:8090/_/` v prehliadači
2. Vytvorte administrátorský účet
3. Prejdite do **Settings** → **Import collections**
4. Nahrajte súbor `pocketbase/pb_schema.json`
5. Kliknite **Review** → **Confirm and import**

---

## 📦 Zostavenie inštalačky

### Zostavenie pre Windows (NSIS inštalačka)

```bash
npm run build
```

Tento príkaz postupne:
1. Zostaví frontend (`vite build` → `dist/`)
2. Skompiluje Electron (`tsc` → `electron/dist/`)
3. Vytvorí Windows inštalačku (`electron-builder` → `release/`)

Po dokončení nájdete inštalačku v:
```
release/Servisná knižka Bartalos Setup X.X.X.exe
```

### Publikovanie na GitHub Releases

```bash
npm run dist
```

Tento príkaz zostaví aplikáciu a automaticky publikuje release na GitHub. Vyžaduje `GH_TOKEN` environment variable s GitHub Personal Access Token s oprávnením `repo`.

---

## 📤 Export a import údajov

Aplikácia umožňuje prenášať údaje medzi zariadeniami.

### Export

1. Otvorte **Nastavenia** (ikona ozubeného kolesa v bočnom paneli)
2. Nájdite kartu **Export a import údajov**
3. Kliknite **Exportovať údaje**
4. Vyberte cestu na uloženie súboru

Export vytvorí:
- **`.json` súbor** — hlavný exportný súbor (obsahuje všetky záznamy + fotografie v base64)
- **`_customers.csv`** — zákazníci (pre čítanie v Exceli)
- **`_vehicles.csv`** — vozidlá
- **`_service_records.csv`** — servisné záznamy
- **`_scheduled_tasks.csv`** — plánované úlohy

### Import

1. Na **druhom zariadení** nainštalujte aplikáciu (viď sekcia [Inštalácia](#-inštalácia-používateľ))
2. Otvorte **Nastavenia** → **Export a import údajov**
3. Kliknite **Importovať údaje**
4. Potvrďte import v dialógovom okne
5. Vyberte `.json` exportný súbor
6. Počkajte na dokončenie importu (aplikácia zobrazuje priebeh)

> ⚠️ Import **pridáva** záznamy do existujúcej databázy — neprepisuje ani nemaže existujúce údaje. Opakovaný import toho istého súboru vytvorí duplicitné záznamy.

---

## 🔄 Aktualizácia aplikácie

Aplikácia podporuje automatické aktualizácie cez GitHub Releases:

1. Po spustení aplikácia automaticky skontroluje, či je dostupná nová verzia
2. Ak áno, zobrazí sa banner s informáciou o aktualizácii
3. Kliknite **Aktualizovať** — aplikácia sa reštartuje a nainštaluje novú verziu

Vaše údaje sa pri aktualizácii **zachovajú** — databáza je uložená mimo inštalačný priečinok.

---

## 📁 Štruktúra projektu

```
servis-bartalos/
├── build/
│   └── icon.png                    # Ikona aplikácie pre Windows
├── electron/
│   ├── main.ts                     # Hlavný proces Electron (PocketBase lifecycle, IPC)
│   ├── preload.ts                  # Context bridge (updater + export/import API)
│   └── updater.ts                  # Auto-updater logika
├── pocketbase/
│   ├── pocketbase.exe              # PocketBase binárka (bundled)
│   └── pb_schema.json              # Schéma databázy (4 kolekcie)
├── src/
│   ├── components/                 # React UI komponenty
│   │   ├── app/                    # Shell, sidebar, bannery
│   │   ├── garage/                 # Vozidlá, servisné záznamy, fotografie
│   │   ├── plan/                   # Plánované úlohy
│   │   ├── service-history/        # História servisov
│   │   ├── settings/               # Nastavenia, export/import
│   │   └── ui/                     # shadcn/ui komponenty
│   ├── lib/
│   │   ├── queries/                # PocketBase query definície + typy
│   │   ├── pocketbase.ts           # PocketBase klient
│   │   ├── imageCompression.ts     # Kompresia obrázkov (WebP)
│   │   └── exportImport.ts         # Export/import logika
│   └── routes/                     # TanStack Router stránky
├── electron-builder.yml            # Konfigurácia Windows inštalačky
├── package.json                    # NPM konfigurácia a skripty
└── vite.config.ts                  # Vite konfigurácia
```

### Databázové kolekcie

| Kolekcia | Popis | Vzťahy |
|---|---|---|
| `customers` | Zákazníci | — |
| `vehicles` | Vozidlá s fotografiou | → `customers` (cascade delete) |
| `service_records` | Servisné záznamy s fotografiami (max 10) | → `vehicles` (cascade delete) |
| `scheduled_tasks` | Plánované úlohy | → `vehicles` (cascade delete) |

---

## ❓ Riešenie problémov

| Problém | Riešenie |
|---|---|
| Windows SmartScreen blokuje inštaláciu | Kliknite **Ďalšie informácie** → **Napriek tomu spustiť** |
| Aplikácia sa nespustí / prázdne okno | Skontrolujte, či nie je iný PocketBase proces na porte 8090: `netstat -ano \| findstr 8090` |
| PocketBase status v nastaveniach je červený | Reštartujte aplikáciu. Ak pretrváva, vymažte priečinok `%APPDATA%\servisna-knizka-bartalos\pocketbase_data` a spustite znova (⚠️ stratíte dáta) |
| Fotografie sa nenahrávajú | Skontrolujte, či má disk dostatok miesta. Max veľkosť fotky: 10 MB |
| Import hlási chybu | Skontrolujte, či importujete `.json` súbor (nie `.csv`). CSV súbory sú iba na čítanie |
| Chcem zálohovať dáta | Skopírujte priečinok `%APPDATA%\servisna-knizka-bartalos\pocketbase_data\` na externý disk, alebo použite funkciu **Export** v nastaveniach |
| Aplikácia beží pomaly | Skúste reštartovať aplikáciu. Veľký počet fotografií vo vysokom rozlíšení môže spomaliť načítanie |
| Chcem odinštalovať | Štart menu → „Pridať alebo odobrať programy" → Servisná knižka Bartalos → Odinštalovať |

### Dáta a zálohovanie

- **Databáza**: `%APPDATA%\servisna-knizka-bartalos\pocketbase_data\`
- **Fotografie**: uložené priamo v databáze PocketBase (v priečinku `storage/` vo vnútri `pocketbase_data`)
- **Záloha**: Použite funkciu **Export** v nastaveniach, alebo manuálne skopírujte celý priečinok `pocketbase_data`

---

## 📄 Licencia

Súkromný projekt. Všetky práva vyhradené.

---

*Vytvorené s ❤️ pre Autoservis Bartalos*
