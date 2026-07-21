# PocketBase — návod na inštaláciu (Windows + LAN)

Tento návod vás krok za krokom prevedie spustením lokálnej databázy PocketBase pre aplikáciu **Servisná knižka Bartalos** tak, aby bola dostupná z viacerých zariadení v jednej domácej/firemnej sieti (Wi-Fi alebo Ethernet).

---

## 1. Stiahnutie PocketBase pre Windows

1. Otvorte stránku [https://github.com/pocketbase/pocketbase/releases](https://github.com/pocketbase/pocketbase/releases).
2. Z poslednej verzie stiahnite súbor s názvom `pocketbase_X.XX.X_windows_amd64.zip` (kde `X.XX.X` je verzia).
3. Rozbaľte ZIP archív do priečinka, napríklad `C:\pocketbase\`.
   Vo vnútri by mal byť jediný spustiteľný súbor `pocketbase.exe`.

---

## 2. Prvé spustenie servera

1. Otvorte **Príkazový riadok** (Win + R → `cmd` → Enter).
2. Prejdite do priečinka s PocketBase:
   ```
   cd C:\pocketbase
   ```
3. Spustite server tak, aby počúval na všetkých sieťových adaptéroch (potrebné pre prístup z iných zariadení v LAN):
   ```
   pocketbase.exe serve --http=0.0.0.0:8090
   ```
4. V termináli sa zobrazí niečo ako:
   ```
   > Server started at http://0.0.0.0:8090
     ├─ REST API:  http://0.0.0.0:8090/api/
     └─ Admin UI:  http://0.0.0.0:8090/_/
   ```
   **Toto okno nechajte otvorené** — kým beží, beží aj databáza.

> 💡 **Tip:** Ak chcete, aby sa PocketBase spúšťal automaticky po štarte počítača, vytvorte si v Plánovači úloh (Task Scheduler) úlohu, ktorá spustí ten istý príkaz pri prihlásení používateľa.

---

## 3. Vytvorenie administrátorského účtu

1. V prehliadači otvorte: [http://localhost:8090/\_/](http://localhost:8090/_/)
2. Vyplňte **email** a **heslo** pre administrátora.
3. Kliknite **Create and login**.

---

## 4. Import schémy databázy (jedným klikom)

1. V administrácii (Admin UI) v ľavom dolnom rohu kliknite na ikonu ⚙️ **Settings**.
2. V sekcii **Sync** vyberte **Import collections**.
3. Kliknite **Load from JSON file** a vyberte súbor:
   ```
   pocketbase\pb_schema.json
   ```
   (nachádza sa v koreňovom priečinku tohto projektu).
4. V náhľade by ste mali vidieť 4 kolekcie:
   `customers`, `vehicles`, `service_records`, `scheduled_tasks`.
5. Zaškrtnite **Merge with existing collections** (ak je k dispozícii) a kliknite **Review**, potom **Confirm and import**.

Hotovo — všetky tabuľky, polia, väzby a indexy sú vytvorené.

---

## 5. Overenie verejných pravidiel (žiadne prihlasovanie)

Aplikácia je navrhnutá pre **lokálne použitie bez autentifikácie**, preto musia mať všetky kolekcie verejné API pravidlá.

Pre každú kolekciu (`customers`, `vehicles`, `service_records`, `scheduled_tasks`):

1. V Admin UI kliknite na kolekciu v ľavom paneli.
2. Kliknite na ikonu ⚙️ pri názve kolekcie → **API Rules**.
3. Všetkých päť polí musí byť **prázdnych** (žiadny text, ani `@request.auth.id != ""`):
   - **List rule**
   - **View rule**
   - **Create rule**
   - **Update rule**
   - **Delete rule**
4. Kliknite **Save changes**.

Schéma `pb_schema.json` toto nastavenie už obsahuje — tento krok je iba pre kontrolu.

---

## 6. Zistenie LAN IP adresy vášho počítača

1. V Príkazovom riadku napíšte:
   ```
   ipconfig
   ```
2. Nájdite sekciu **Wireless LAN adapter Wi-Fi** alebo **Ethernet adapter**.
3. Skopírujte hodnotu pri **IPv4 Address**, napríklad:
   ```
   IPv4 Address. . . . . . . . . . . : 192.168.1.42
   ```

Túto IP adresu budú používať všetky ostatné zariadenia v sieti.

---

## 7. Nastavenie URL v aplikácii

V koreňovom priečinku projektu (`Servisná knižka Bartalos`) otvorte alebo vytvorte súbor `.env` a nastavte:

```
VITE_POCKETBASE_URL=http://192.168.1.42:8090
```

(IP nahraďte tou, ktorú ste zistili v kroku 6.)

Reštartujte dev server (`Ctrl + C` a znova `bun dev` / `npm run dev`).

> 💡 V aplikácii v sekcii **Nastavenia** uvidíte aktuálnu URL a tlačidlo **Testovať pripojenie** na overenie, že server odpovedá.

---

## 8. Povolenie portu 8090 vo firewalle

Aby sa k serveru dostali aj ostatné zariadenia v sieti:

1. Otvorte **Windows Defender Firewall with Advanced Security** (Win → `wf.msc`).
2. **Inbound Rules** → **New Rule…**
3. Vyberte **Port** → Next.
4. **TCP**, **Specific local ports:** `8090` → Next.
5. **Allow the connection** → Next.
6. Zaškrtnite **Private** (a **Domain**, ak používate doménovú sieť). **Public radšej NEzaškrtávajte.**
7. Pomenujte pravidlo `PocketBase 8090` → Finish.

---

## 9. Test z iného zariadenia v sieti

Z mobilu, tabletu alebo notebooku pripojeného na **rovnakú Wi-Fi** otvorte v prehliadači:

```
http://192.168.1.42:8090/_/
```

Ak sa zobrazí prihlasovacie okno PocketBase Admin UI → **LAN prístup funguje** ✅.

Otvorte aplikáciu Servisná knižka v prehliadači — všetky zariadenia sa pripoja k tej istej databáze a realtime sync zabezpečí, že pridanie/úprava vozidla sa okamžite zobrazí na všetkých otvorených oknách bez obnovenia stránky.

---

## 10. ⚠️ Dôležité upozornenie — bezpečnosť

Všetky kolekcie sú **verejné, bez prihlásenia**. Ktokoľvek, kto má prístup na port `8090` vášho počítača, môže čítať a meniť údaje (vrátane osobných údajov zákazníkov).

- ✅ **Vhodné použitie:** lokálna sieť doma alebo v servise (LAN).
- ❌ **NIKDY nevystavujte PocketBase server na verejný internet** (verejná IP, port forwarding, ngrok bez hesla, atď.) bez dodatočného zabezpečenia.
- Pravidelne zálohujte priečinok `C:\pocketbase\pb_data\` — obsahuje celú databázu a nahrané fotky.

---

## Riešenie problémov

| Problém                                                        | Riešenie                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| V aplikácii sa zobrazuje ⚠️ "Nie je možné pripojiť k databáze" | Skontrolujte, či beží `pocketbase.exe`, či sedí IP v `.env`, a či je port 8090 povolený vo firewalle. |
| Iné zariadenie sa nedostane na admin UI                        | Skúste `ping 192.168.1.42` z toho zariadenia. Ak ping prejde, problém je vo firewalle Windows.        |
| Po reštarte PC sa server nespustil sám                         | Vytvorte úlohu v Task Scheduler (krok 2, tip).                                                        |
| Stratené dáta                                                  | Obnovte priečinok `pb_data` zo zálohy.                                                                |
