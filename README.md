# 🏰 OpenWorld

Et strategisk «bygg ditt eget imperium»-spill. Du starter med tolv innbyggere og
en øks, og jobber deg gjennom seks lag med progresjon:

**🛖 Landsby → 🏘️ By → 👑 Kongerike → 🏛️ Imperium → 🗺️ Kontinent → 🌍 Verdensmakt**

Hver gang du tror du er ferdig, åpner det seg et nytt system.

## Kom i gang

Ingen installasjon, ingen byggesteg, ingen avhengigheter:

```bash
# åpne index.html i nettleseren – f.eks.
xdg-open index.html        # Linux
open index.html            # macOS
start index.html           # Windows
```

Spillet lagres automatisk i nettleseren (localStorage). Under ⚙️ finner du en
kode du kan kopiere for å flytte riket til en annen maskin.

## Hva som er med

| System | Gratis | Hva det gjør |
|---|---|---|
| 🏛️ **28 bygninger** | ✅ | Ni kategorier, egne oppgraderingskurver og effekter |
| 🔨 **Byggekø** | ✅ (1–2 plasser) | Flere plasser via rådhus nivå 15, leie eller premium |
| 📚 **24 forskninger** | ✅ | Teknologitre med krav, fordelt over alle epokene |
| 🗺️ **14 områder** | ✅ | Send ekspedisjoner, få permanente bonuser |
| ⚓ **8 handelsruter** | ✅ | Send varer ut, få mer tilbake. Begrenset av havna |
| 🏪 **Marked** | ✅ | Priser som svinger hvert 90. sekund – kjøp lavt, selg høyt |
| 📜 **18 oppdrag** | ✅ | Hovedhistorie i åtte kapitler med historietekst |
| 🎲 **11 hendelser** | ✅ | Dilemmaer med to valg og ekte konsekvenser |
| 🏆 **Riksmesterskap** | ✅ | Seks rivaler som vokser mens du sover |
| 🏅 **20 bragder** | ✅ | Gir krystaller, som også kjøpes i butikken |
| 🌅 **Sesong (25 nivåer)** | ✅ | Hele sporet kan spilles gratis |
| 🧭 **Spesialisering** | ✅ (én vei) | Handel, krig eller kunnskap – permanent valg |

## Betalingsmodellen

> ⚠️ **Butikken i spillet er en ren demo.** Ingen betaling gjennomføres,
> ingen kortopplysninger etterspørres, og ingen data forlater maskinen din.
> Se `src/core/payments.js` for hvor en ekte betalingsløsning ville koblet seg på.

Prinsippet er å **selge valg og komfort — ikke seier**:

* **Rikskansler-medlemskap (89 kr/mnd)** – ekstra byggekø, +10 % produksjon,
  24 t offline-inntekt i stedet for 8, halv pris på hastverk.
* **Sesongpass (99 kr)** – premium-sporet i sesongen. Alle 25 nivåene kan
  spilles gratis uansett; passet gir de ekstra belønningene.
* **Laug (149 kr)** – du velger **én** vei gratis. Har du bygget riket rundt
  handel, kan du låse opp handelslauget med *nye ruter og mekanikker* — dette er
  spesialiseringsmekanikken, ikke en ren tallbonus.
* **Kosmetikk (49–79 kr)** – gullstatuer, hagelabyrinter, drageflagg.
* **Forsyningskonvoi (39 kr)** – bevisst begrenset: **maks ett kjøp i døgnet**, og
  mengden tilsvarer omtrent 30 minutters produksjon i *ditt* rike. Aldri nok til
  å hoppe over spillet.

## Kodekart

```
index.html            skallet: topplinje, faner, modaler
styles.css            all stil (mørkt tema, responsivt)
src/data/             alt innhold – rediger her for å legge til nytt
  eras.js               de seks epokene og ressursene
  buildings.js          28 bygninger med kostnads- og tidskurver
  tech.js               forskningstreet
  world.js              områder, handelsruter, hendelser, rivaler
  progress.js           oppdrag, laug, sesong, bragder
  shop.js               butikkvarer og priser
src/core/
  format.js             tallformatering på norsk
  state.js              tilstand, lagring, import/eksport
  engine.js             all regnelogikk (produksjon, kø, poeng, tikk)
  payments.js           simulert kjøpslag + hvor ekte betaling hører hjemme
src/ui/
  panels.js             én funksjon per fane
  app.js                spilløkke, klikk, modaler, varsler
tools/
  simulering.js         spiller spillet automatisk og sjekker balansen
  nettlesertest.js      klikker seg gjennom spillet i ekte Chromium
```

## Testing

```bash
node tools/simulering.js 14     # simuler 14 dagers spilling + 15 kontroller
node tools/nettlesertest.js     # 15 UI-tester i ekte nettleser (krever Playwright)
```

Simuleringen er ikke pynt — den har allerede avdekket tre reelle feil under
utviklingen:

1. **Hardlås på lager.** Byggekostnader vokser eksponentielt, lagerkapasitet
   vokste lineært. Rådhus nivå 12 kostet mer enn lageret kunne romme, og riket
   stod bom fast. Lageret vokser nå geometrisk (`OW.E.LAGERVEKST`), med en
   invariant: veksten må være høyere enn den høyeste `kostMult` i spillet.
2. **Permanent dødlås.** Brukte du opp all steinen, kunne du aldri få mer —
   steinbruddet kostet selv stein. Nå koster det bare tømmer, og innbyggerne har
   i tillegg en `GRUNNSANKING` som alltid tikker uansett hva du har bygget.
3. **Veggen kom for tidlig.** Produksjon vokste lineært mens kostnadene vokste
   1,5× per nivå, så riket stagnerte etter få dager. Kurvene er dempet til
   1,38–1,50 og fordelt slik at hverdagsbygg er billigst å løfte.

## Slik utvider du spillet

Innholdet er rene datalister — nesten alt nytt kan legges til uten å røre motoren:

* **Ny bygning:** legg til et objekt i `src/data/buildings.js`. Feltene i `gir`
  (`prod`, `popTak`, `lager`, `lykke`, `militaer`, `byggfart`, `ruter` …) plukkes
  automatisk opp av `OW.E.beregn`.
* **Ny forskning / område / rute / hendelse:** samme mønster i `tech.js` og `world.js`.
* **Nytt kapittel:** legg til i `OW.OPPDRAG`. Måltypene finnes i `OW.E.malStatus`.
* **Ny sesong:** bytt ut `OW.SESONG` og `OW.SESONG_BELONNING`.
* **Ny epoke:** legg til i `OW.EPOKER` med krav — resten av spillet retter seg etter det.

Kjør `node tools/simulering.js` etterpå. Den fanger opp balansefeil før spillerne gjør det.
