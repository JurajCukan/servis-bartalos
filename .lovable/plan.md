## Výmena loga na verziu bez pozadia (vhodnú pre dark mode)

### Problém
Aktuálne logo v sidebar footeri má biele/svetlé pozadie, ktoré v dark móde vytvára svetlú škvrnu. Nový upload (`autoservis_logo_bez_pozadia-Photoroom.png`) je skutočne transparentný a bude vyzerať dobre na oboch témach.

### Zmeny

1. **Nahrať nový asset**
   - `lovable-assets create --file /mnt/user-uploads/autoservis_logo_bez_pozadia-Photoroom_compressed.png --filename autoservis-logo.png > src/assets/autoservis-logo.png.asset.json`

2. **`src/components/app/AppSidebar.tsx`**
   - Prepnúť import z `autoservis-logo-transparent.png.asset.json` na nový `autoservis-logo.png.asset.json`.
   - Ponechať aktuálny layout (centered, `h-20`, `bg-brand-bg` footer).

3. **Zmazať starý asset**
   - `lovable-assets delete --file src/assets/autoservis-logo-transparent.png.asset.json`

4. **Overiť v preview**
   - Skontrolovať sidebar v dark aj light móde — logo musí byť čitateľné bez svetlého/tmavého pozadia okolo.

### Mimo scope
- Žiadne zmeny farebných tokenov ani iných komponentov — logo je jediná zmena.
