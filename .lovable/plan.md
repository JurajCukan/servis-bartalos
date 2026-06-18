## Cieľ
Nahradiť text v ľavom dolnom rohu sidebaru ("Autoservis Bartalos / Interná servisná aplikácia") za logo a zladiť farebnú paletu appky s logom (čierna + neónová červeno-oranžová).

## Kroky

### 1. Pridať logo ako asset
- Nahrať `user-uploads://autoservis_logo.jpg` cez `lovable-assets` CLI → `src/assets/autoservis-logo.jpg.asset.json`.
- Importovať pointer JSON v `AppSidebar.tsx`.

### 2. `src/components/app/AppSidebar.tsx` — footer
- Odstrániť oba `<p>` v `SidebarFooter`.
- Vložiť `<img src={logo.url} alt="Autoservis Bartalos" />` v rozumnej veľkosti (~h-16, object-contain, vycentrované). Logo má čierne pozadie, takže v light móde mu dáme jemné zaoblené čierne pozadie aby ladilo (logo už má vlastný black background — nechať tak).
- Header (`SidebarHeader`) zostane textový ("Servisná knižka / Autoservis Bartalos") aby sa neopakovalo logo.

### 3. Zladiť farby s logom (`src/styles.css`)
Logo paleta: čistá čierna, neónová červená `#ff2a1a`, oranžový glow `#ff7a1a`, biela.

Úpravy tokenov:
- `--color-brand-accent: #ff2a1a` (bola `#cc0000`) — sýtejšia neónová červená zhodná s logom.
- `--color-brand-accent-hover: #e01500`.
- Pridať nový token `--color-brand-accent-glow: #ff7a1a` (oranžový sekundárny accent, neregistrovaný v komponentoch hromadne — využije sa lokálne, napr. v subtle hover/border ringoch ak treba).
- Dark mód `--brand-bg`/`--brand-surface` zostávajú (`#111` / `#1a1a` / border `#2a2a`) — sedia s logom.
- Light mód ostáva (svetlosivý povrch + čierny text) — kontrast s červeným accentom funguje.

### 4. Bez zmien
- Žiadne layout zmeny, žiadny redesign stránok, žiadne nové komponenty mimo loga.
- StatusBadge a ostatné saturated buttony zostávajú — používajú stále `bg-brand-accent` token, takže automaticky zdedia novú červenú.

## Súbory dotknuté
- nový `src/assets/autoservis-logo.jpg.asset.json`
- `src/components/app/AppSidebar.tsx` (footer)
- `src/styles.css` (accent tokeny)

## Overenie
- Skontrolovať `/garage` v dark aj light móde: logo v dolnom rohu, akcie (Pridať vozidlo) a aktívna sidebar položka nesú novú neónovú červenú zhodnú s logom.
