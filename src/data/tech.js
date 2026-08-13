/* OpenWorld – Forskning */
window.OW = window.OW || {};

OW.TECH = [
  { id: 'hjulet', navn: 'Hjulet', ikon: '🎡', era: 0, kost: 40, krev: [],
    tekst: 'Rundt. Ruller. Revolusjonerende.', bonus: { prodPst: { tre: 0.15, stein: 0.15 } } },

  { id: 'plogen', navn: 'Tungplogen', ikon: '🐂', era: 0, kost: 60, krev: ['hjulet'],
    tekst: 'Mer mat per rygg. Ryggene takker.', bonus: { prodPst: { mat: 0.3 } } },

  { id: 'skrift', navn: 'Skriftspråk', ikon: '✒️', era: 0, kost: 90, krev: [],
    tekst: 'Nå kan uenigheter vare i århundrer.', bonus: { prodPst: { kunnskap: 0.25 } } },

  { id: 'mynt', navn: 'Myntøkonomi', ikon: '🪙', era: 1, kost: 150, krev: ['skrift'],
    tekst: 'Byttehandel var sjarmerende. Dette er bedre.', bonus: { prodPst: { gull: 0.25 } } },

  { id: 'arkitektur', navn: 'Arkitektur', ikon: '📐', era: 1, kost: 220, krev: ['hjulet'],
    tekst: 'Bygg raskere, og med færre ulykker.', bonus: { byggfart: 0.12 } },

  { id: 'smelteverk', navn: 'Smelteverk', ikon: '🔥', era: 1, kost: 300, krev: ['hjulet'],
    tekst: 'Jern blir stål, stål blir makt.', bonus: { prodPst: { jern: 0.4 } } },

  { id: 'kartografi', navn: 'Kartografi', ikon: '🧭', era: 1, kost: 380, krev: ['skrift'],
    tekst: 'Kart med færre drager og flere fakta.', bonus: { ekspfart: 0.2 } },

  { id: 'lagerhold', navn: 'Lagerhold', ikon: '🗄️', era: 1, kost: 420, krev: ['arkitektur'],
    tekst: 'Systemhyller. Undervurdert, men avgjørende.', bonus: { lagerPst: 0.3 } },

  { id: 'navigasjon', navn: 'Navigasjon', ikon: '🧭', era: 2, kost: 700, krev: ['kartografi'],
    tekst: 'Stjernene som veiviser. Fungerer overraskende bra.', bonus: { ruter: 1, handelsbonus: 0.15 } },

  { id: 'taktikk', navn: 'Militærtaktikk', ikon: '⚔️', era: 2, kost: 850, krev: ['smelteverk'],
    tekst: 'Formasjoner slår entusiasme.', bonus: { militaerPst: 0.25 } },

  { id: 'vanning', navn: 'Vanningsanlegg', ikon: '💧', era: 2, kost: 900, krev: ['plogen'],
    tekst: 'Regnet kommer når du bestemmer det.', bonus: { prodPst: { mat: 0.35 }, popTakPst: 0.1 } },

  { id: 'trykkpresse', navn: 'Trykkpressen', ikon: '🖨️', era: 2, kost: 1200, krev: ['skrift'],
    tekst: 'Ideer sprer seg fortere enn brann.', bonus: { prodPst: { kunnskap: 0.5 }, forskrabatt: 0.1 } },

  { id: 'bankvesen', navn: 'Bankvesen', ikon: '🏦', era: 3, kost: 1800, krev: ['mynt'],
    tekst: 'Renter: den eneste hæren som marsjerer om natten.', bonus: { prodPst: { gull: 0.45 } } },

  { id: 'kanaler', navn: 'Kanalsystem', ikon: '🚤', era: 3, kost: 2200, krev: ['arkitektur'],
    tekst: 'Vann som veier. Billig og vakkert.', bonus: { prodPst: { tre: 0.25, stein: 0.25 }, ruter: 1 } },

  { id: 'kruttet', navn: 'Kruttet', ikon: '💥', era: 3, kost: 2600, krev: ['taktikk'],
    tekst: 'Endrer alle samtaler om grenser.', bonus: { militaerPst: 0.5 } },

  { id: 'byplan', navn: 'Byplanlegging', ikon: '🏙️', era: 3, kost: 3000, krev: ['lagerhold'],
    tekst: 'Færre gjørmete gater, flere fornøyde skattebetalere.', bonus: { popTakPst: 0.25, lykke: 6 } },

  { id: 'dampmaskin', navn: 'Dampmaskin', ikon: '🚂', era: 4, kost: 5200, krev: ['smelteverk', 'kanaler'],
    tekst: 'Framtiden lukter kull og lyder som torden.', bonus: { globalProd: 0.2, byggfart: 0.1 } },

  { id: 'telegraf', navn: 'Telegraf', ikon: '📡', era: 4, kost: 6000, krev: ['trykkpresse'],
    tekst: 'Ordre på sekunder i stedet for uker.', bonus: { omradeBonus: 0.15, diplomati: 20 } },

  { id: 'statsvitenskap', navn: 'Statsvitenskap', ikon: '⚖️', era: 4, kost: 7000, krev: ['byplan'],
    tekst: 'Å styre mange er en egen vitenskap.', bonus: { lykke: 10, prodPst: { gull: 0.3 } } },

  { id: 'stalverk', navn: 'Stålverk', ikon: '🏭', era: 4, kost: 8500, krev: ['dampmaskin'],
    tekst: 'Bygg høyere enn det som burde være mulig.', bonus: { prodPst: { jern: 0.8 }, militaerPst: 0.3 } },

  { id: 'elektrisitet', navn: 'Elektrisitet', ikon: '⚡', era: 5, kost: 14000, krev: ['stalverk'],
    tekst: 'Natten er avlyst.', bonus: { globalProd: 0.3, lykke: 8 } },

  { id: 'masseutdanning', navn: 'Masseutdanning', ikon: '🏫', era: 5, kost: 16000, krev: ['statsvitenskap'],
    tekst: 'Hver innbygger et bibliotek.', bonus: { prodPst: { kunnskap: 1.0 }, popTakPst: 0.2 } },

  { id: 'global_logistikk', navn: 'Global logistikk', ikon: '🌐', era: 5, kost: 22000, krev: ['telegraf', 'dampmaskin'],
    tekst: 'Alt du eier, akkurat der det trengs.', bonus: { ruter: 2, handelsbonus: 0.4, omradeBonus: 0.2 } },

  { id: 'verdensarv', navn: 'Verdensarv', ikon: '🏆', era: 5, kost: 30000, krev: ['elektrisitet', 'masseutdanning'],
    tekst: 'Det du bygde vil overleve alle som husker deg.', bonus: { globalProd: 0.5, lykke: 15, militaerPst: 0.4 } }
];

OW.TECH_INDEX = {};
OW.TECH.forEach(function (t) { OW.TECH_INDEX[t.id] = t; });
