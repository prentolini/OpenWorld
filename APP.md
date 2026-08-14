# 📲 Få OpenWorld på telefonen

Det er to nivåer her, og de er ikke like mye jobb. Nivå 1 kan du gjøre i kveld.
Nivå 2 krever en Mac, to utviklerkontoer og litt papirarbeid.

---

## Nivå 1: App på hjemskjermen (virker i dag)

Spillet er en **installerbar app** — en PWA. Du får et ikon på hjemskjermen,
det åpner i fullskjerm uten nettleserlinje, og **det virker helt uten nett**.
Ingen app-butikk, ingen godkjenning, ingen ventetid.

### Steg 1 — gi spillet en nettadresse

Telefonen krever `https` for å tillate installasjon. Velg én:

**a) GitHub Pages (gratis, anbefalt)**

1. Slå sammen denne grenen til `main`.
2. Gå til repoet på GitHub → **Settings** → **Pages**.
3. Under **Source**, velg **GitHub Actions**. Ferdig.

Arbeidsflyten i `.github/workflows/pages.yml` bygger og publiserer automatisk
ved hver endring på `main`. Adressen blir:

```
https://prentolini.github.io/OpenWorld/
```

**b) Hvilken som helst webserver**

```bash
node tools/lagdist.js     # samler alt i dist/ (391 kB)
```

Last opp innholdet i `dist/` til webhotellet ditt. Det er bare statiske filer —
ingen database, ingen backend, ingenting som må kjøre på serveren.

**c) Bare teste raskt over eget wifi**

```bash
node tools/server.js
```

Den skriver ut en adresse som `http://192.168.1.42:8080` — åpne den på
telefonen mens begge er på samme nett. (Da virker spillet, men installasjon
til hjemskjerm krever https, så bruk a eller b for det.)

### Steg 2 — legg den på hjemskjermen

**iPhone / iPad** — må gjøres i **Safari**:
1. Åpne adressen.
2. Trykk **Del**-knappen (firkanten med pil opp).
3. Bla ned → **Legg til på Hjem-skjerm** → **Legg til**.

Chrome på iPhone kan ikke dette — Apple tillater det bare i Safari.

**Android** — i **Chrome**:
1. Åpne adressen.
2. Spillet foreslår det selv etter litt spilling, eller:
   menyen med tre prikker → **Installer app**.

Spillet har også en knapp under ⚙️ **Innstillinger** → *Legg spillet på
hjemskjermen*, som viser framgangsmåten for akkurat din telefon.

### Hva du får — og ikke får

| | PWA på hjemskjermen |
|---|---|
| Ikon på hjemskjermen | ✅ |
| Fullskjerm uten nettleserlinje | ✅ |
| Spillbart uten nett | ✅ |
| Automatiske oppdateringer | ✅ (neste gang du åpner den) |
| I App Store / Google Play | ❌ |
| Kjøp i appen (ekte betaling) | ❌ |
| Push-varsler | ⚠️ Android ja, iOS krever 16.4+ |

---

## Nivå 2: Ekte apper i App Store og Google Play

Spillet er allerede klargjort for **Capacitor**, som pakker de samme filene inn
i et ekte Android- og iOS-prosjekt. `capacitor.config.json` og skriptene i
`package.json` ligger klare.

### Det du trenger

| | Android | iOS |
|---|---|---|
| Maskin | Windows, Mac eller Linux | **Mac** (Xcode finnes ikke ellers) |
| Verktøy | Android Studio | Xcode |
| Utviklerkonto | Google Play, **225 kr én gang** | Apple Developer, **ca. 1 100 kr/år** |
| Godkjenning | Timer til et par dager | Vanligvis 1–3 dager |

### Kommandoene

```bash
npm install                    # henter Capacitor
npm run dist                   # samler spillet i dist/

npx cap add android            # lager android/-prosjektet
npm run app:android            # åpner det i Android Studio → Build → APK/AAB

npx cap add ios                # bare på Mac
npm run app:ios                # åpner det i Xcode → Product → Archive
```

Etter hver endring i spillet: `npm run app:sync`.

> Jeg kunne ikke bygge APK-en ferdig her: utviklingsmiljøet mitt har hverken
> Android SDK-en (nedlastingen fra Google er sperret) eller macOS. Oppsettet er
> gjort og kommandoene er riktige, men selve byggingen må skje hos deg.

### ⚠️ Dette må endres før du sender inn

**Butikken må bli ekte.** Apple og Google krever at digitale varer selges
gjennom deres egen betalingsløsning, og tar 15–30 % provisjon. Dagens butikk er
en tydelig merket demo som ikke tar betalt. Sender du den inn som den er, blir
appen avvist.

Det du må gjøre:
* Bytt ut `OW.Betaling.start()` i `src/core/payments.js` med
  [`@capacitor-community/in-app-purchases`](https://github.com/capacitor-community/in-app-purchases)
  eller RevenueCat.
* Opprett produktene i App Store Connect og Google Play Console med samme
  ID-er som i `src/data/shop.js`.
* **Rettigheter må avgjøres på en server, ikke i klienten.** Slik det er nå
  ligger `premium.medlem` i `localStorage`, der hvem som helst kan sette den
  til `true`. Det er greit for en demo, ikke for en butikk-app.

**Ellers kreves også:** personvernerklæring (URL), aldersgrense, skjermbilder i
riktige størrelser, og et appikon på 1024×1024 — det siste ligger allerede i
`ikoner/ikon-1024.png`.

---

## Hvordan ikonene lages

Ikonene er ikke bildefiler noen har tegnet og glemt. De er kode:

```bash
node tools/lagikoner.js
```

`tools/lagikoner.js` tegner borgen som SVG og fotograferer den i alle
størrelsene som trengs — inkludert et *maskerbart* ikon med ekstra luft, siden
Android beskjærer ikoner til sirkler og andre former.

## Test at appdelen virker

```bash
node tools/apptest.js
```

Starter en lokal server, laster spillet, og kontrollerer manifestet, ikonene,
iOS-taggene, at service workeren tar kontroll, at hele spillet ligger i
offline-bufferen — og **slår faktisk av nettet og laster inn på nytt** for å
bevise at spillet starter uten forbindelse.
