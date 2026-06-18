## Výmena loga a redesign appky podľa loga Autoservis Bartalos

### Cieľ
Nahradiť staré logo s čiernym pozadím novým transparentným logom a upraviť vizuálny štýl aplikácie tak, aby ladil s neónovo-červeno-čiernym garážovým štýlu loga.

### Problém
- Aktuálne logo má pevné čierne pozadie, ktoré v svetlom móde pôsobí ako tmavá škvrna
- Footer sidebaru má natvrdo `bg-black`, čo nekorešponduje s light theme
- Farebné tokeny sú teraz príliš „generické“ — neodrážajú garážový/neónový charakter loga

### Zmeny

#### 1. Asset — nové logo
- Nahrať `user-uploads://generated-image_compressed.png` cez `lovable-assets` ako transparentný PNG
- Vytvoriť `.asset.json` pointer v `src/assets/autoservis-logo-transparent.png.asset.json`
- Zmazať starý `src/assets/autoservis-logo.jpg.asset.json`

#### 2. Sidebar footer (`src/components/app/AppSidebar.tsx`)
- Odstrániť `bg-black` wrapper okolo loga
- Nahradiť starý JPG import za nový PNG asset
- Upraviť padding/rozmery tak, aby logo vyzeralo dobre na oboch témach

#### 3. Color tokeny (`src/styles.css`)
- **Dark mode**: zosvetliť surface odtiene na čistejšiu čiernu `#0a0a0a` → `#111111` → `#1a1a1a` (už takmer tam)
- **Accent**: upraviť `--color-brand-accent` na hodnotu lepšie ladiacu s neónom loga (aktuálne `#ff2a1a` je blízko, mierne doladiť teplšie)
- **Glow**: pridať / upraviť `--color-brand-accent-glow` na oranžovo-červenú `#ff5e1a`
- **Light mode surfaces**: zmeniť na veľmi svetlé teplé neutrály, aby kontrast s logom bol čistý
- **Sidebar footer**: odstrániť pevné `bg-black`, použiť `bg-brand-surface` / `bg-brand-bg`

#### 4. Prípadné drobné úpravy komponentov
- Ak sa niekde vyskytuje starý asset import, prepísať
- Overiť, že `StatusBadge` a tlačidlá s `bg-brand-accent` stále majú `text-white`

### Technické detaily
- Nepoužijeme žiadny nový npm balík
- Žiadna zmena routing, auth ani DB
- Čisto frontend: asset + CSS tokeny + 1 komponent

### Overenie
- Logo v sidebar footeri je čitateľné v dark aj light mode
- Žiadne čierne pozadie okolo loga v light mode
- Accent farby (tlačidlá, active sidebar item) ladí s logom
- Dark mode pôsobí „garage neon“ atmosférou