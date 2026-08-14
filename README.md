# 🏰 OpenWorld

Et strategisk «bygg ditt eget imperium»-spill. Du starter med tolv innbyggere og
en øks, og jobber deg gjennom seks lag med progresjon:

**🛖 Landsby → 🏘️ By → 👑 Kongerike → 🏛️ Imperium → 🗺️ Kontinent → 🌍 Verdensmakt**

Hver gang du tror du er ferdig, åpner det seg et nytt system.

## 🎭 Velg hvem du er

Før du grunnlegger riket velger du én av åtte herskere — byggmesteren, jordmoren,
den lærde, oppdageren, handelsfyrsten, feltherren, folketaleren eller
mestersmeden. Valget er permanent, gir riket en varig egenskap og en startgave,
og figuren **går faktisk rundt i byen din** med sin egen drakt, kappe og hatt.
Trykk på portrettet for å se hvem du er og hvordan det går med riket.

## 🏙️ Byen er i 3D

By-fanen viser riket ditt som en levende 3D-by du kan snurre, zoome og klikke i.
Bygningene vokser synlig med nivået: én hytte blir til en klynge, klyngen blir
til fleretasjes hus med tårn og flagg. Vinduene lyser når natten faller på,
byggeplasser får stillas, bymuren legger seg rundt hele byen, og landskapet
skifter karakter når du bytter epoke.

3D-en er skrevet fra bunnen i **ren WebGL — uten three.js eller noe annet
bibliotek**. Geometrien bygges bare om når byen faktisk endrer seg. Har du ikke
WebGL, faller spillet automatisk tilbake til en 2D-silhuett, og alt annet virker
som før.

**Husene er ekte hus, ikke kasser med lokk.** Hvert bygg har grunnmur i stein,
vegger i sitt eget materiale — bindingsverk, laftet tre, kvaderstein eller
marmor — dør med håndtak, vinduer med karm og sprosse, tak med utstikk, synlig
tykkelse og mønebjelke, og pipe der det hører hjemme. Ingen to hus er like:
størrelse, høyde, retning, takvinkel og fargetone varierer med et fast frø per
tomt, så byen ser bygget ut i stedet for stemplet.

**Ekte skygger.** Husene, murene, trærne og folkene tegnes en gang til, lagt ned
på bakken langs sollyset. Sola står fast i verden og går sin runde over
himmelen, så skyggene svinger gjennom døgnet — lange om morgenen og kvelden,
korte midt på dagen.

* **Dra** for å snurre kameraet · **rull/knip** for å zoome · **klikk en bygning**
  for å oppgradere den direkte
* Herskeren din og innbyggerne går i gatene — flere folk etter hvert som
  befolkningen vokser
* Døgnsyklus på fire minutter, med bølger på vannet, lys i vinduene og skygger
  som vandrer
* Landskap med innsjø, strandkant, blandingsskog, steiner og snødekte fjell i
  horisonten

## 📱 Laget for mobil

Byen fyller skjermen, fanene ligger som en bunnmeny med tommelvennlige flater,
og panelene kommer opp som en skuff du drar over byen. Portrettet ditt og
byggekøen ligger som brikker rett oppå bybildet. Alt fungerer like godt i en
nettleser på PC.

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
| 🎭 **8 herskere** | ✅ | Egen egenskap, startgave og en figur som går i byen |

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
  karakterer.js         de åtte herskerne med egenskaper og 3D-farger
src/core/
  format.js             tallformatering på norsk
  state.js              tilstand, lagring, import/eksport
  engine.js             all regnelogikk (produksjon, kø, poeng, tikk)
  payments.js           simulert kjøpslag + hvor ekte betaling hører hjemme
src/by3d/               3D-byen – ingen tredjepartsbibliotek
  motor.js              matriser, meshbygger og shaderne
  hus.js                detaljert husbygger: materialer, tak, vinduer, dører
  modeller.js           én oppskrift per bygningstype + terreng
  scene.js              kamera, lys, skygger, døgnsyklus, klikk og etiketter
src/ui/
  panels.js             én funksjon per fane
  app.js                spilløkke, klikk, modaler, varsler
tools/
  simulering.js         spiller spillet automatisk og sjekker balansen
  nettlesertest.js      klikker seg gjennom spillet i ekte Chromium
  mobilbilder.js        tar skjermbilder i mobilformat (390×844)
```

## Testing

```bash
node tools/simulering.js 14        # simuler 14 dagers spilling + 15 kontroller
node tools/simulering.js 45 25     # 45 dager, 25 sekunder per steg (raskere)
node tools/nettlesertest.js        # 25 UI-tester i ekte Chromium, inkl. 3D
node tools/mobilbilder.js          # skjermbilder i mobilformat
```

Slik ser progresjonen ut når boten spiller døgnet rundt (et menneske bruker
grovt regnet 2–3 ganger så lang tid, siden offline-inntekten er begrenset):

| Epoke | Nådd på |
|---|---|
| 🏘️ By | dag 0,0 |
| 👑 Kongerike | dag 0,1 |
| 🏛️ Imperium | dag 2,6 |
| 🗺️ Kontinent | dag 23,2 |
| 🌍 Verdensmakt | ikke nådd på 45 dager |

Det er den formen vi vil ha: rask og belønnende de første timene, og deretter
epoker som hver tar mangedobbelt så lang tid som den forrige.

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

Grafikken har hatt sine egne feller. To verdt å huske hvis du bygger videre:
tåken regnes per hjørne, så én diger bakkeflate fikk bare fire målepunkter —
alle langt unna — og hele sletta ble tåkegrå helt inn til kameraet; bakken må
deles i ruter. Og flater må vende ut fra veggen: vinduene på baksiden av husene
var usynlige fordi hjørnene lå i samme rekkefølge som på forsiden, og WebGL
klipper bort alt som vender fra oss.

## Slik utvider du spillet

Innholdet er rene datalister — nesten alt nytt kan legges til uten å røre motoren:

* **Ny bygning:** legg til et objekt i `src/data/buildings.js`. Feltene i `gir`
  (`prod`, `popTak`, `lager`, `lykke`, `militaer`, `byggfart`, `ruter` …) plukkes
  automatisk opp av `OW.E.beregn`. Gi den en oppskrift i `OW.By3D.MODELL` også,
  så dukker den opp i 3D-byen med egen tomt.
* **Ny forskning / område / rute / hendelse:** samme mønster i `tech.js` og `world.js`.
* **Nytt kapittel:** legg til i `OW.OPPDRAG`. Måltypene finnes i `OW.E.malStatus`.
* **Ny sesong:** bytt ut `OW.SESONG` og `OW.SESONG_BELONNING`.
* **Ny epoke:** legg til i `OW.EPOKER` med krav — resten av spillet retter seg etter det.

Kjør `node tools/simulering.js` etterpå. Den fanger opp balansefeil før spillerne gjør det.
