/* OpenWorld – Epoker (progresjonslagene) */
window.OW = window.OW || {};

OW.EPOKER = [
  {
    id: 'landsby',
    navn: 'Landsby',
    ikon: '🛖',
    slagord: 'Røyk fra tolv piper og en drøm om mer.',
    farge: '#7fb069',
    krav: null,
    intro: 'Du har tolv sultne sjeler, en øks og en veldig optimistisk holdning. Sett i gang.'
  },
  {
    id: 'by',
    navn: 'By',
    ikon: '🏘️',
    slagord: 'Gater, marked og folk som klager på gatene.',
    farge: '#6fa8dc',
    krav: { radhus: 5, bygg: 6 },
    intro: 'Landsbyen har vokst seg for stor for én brønn. Velkommen til bylivet — nå med skatteregninger.'
  },
  {
    id: 'kongerike',
    navn: 'Kongerike',
    ikon: '👑',
    slagord: 'Krone på hodet, ansvar i fanget.',
    farge: '#c9a227',
    krav: { radhus: 12, omrader: 2, tech: 4 },
    intro: 'Naboene kaller deg «Deres Høyhet» nå. Noen av dem mener det til og med.'
  },
  {
    id: 'imperium',
    navn: 'Imperium',
    ikon: '🏛️',
    slagord: 'Solen går aldri helt ned over regnskapet ditt.',
    farge: '#b06fd6',
    krav: { radhus: 20, omrader: 5, tech: 9, militaer: 250 },
    intro: 'Kartet ditt trenger et større bord. Imperiet er født.'
  },
  {
    id: 'kontinent',
    navn: 'Kontinent',
    ikon: '🗺️',
    slagord: 'Et helt landskap lystrer flagget ditt.',
    farge: '#e08a3c',
    krav: { radhus: 30, omrader: 9, tech: 15, militaer: 900 },
    intro: 'Fjellkjeder, ørkener og tre tidssoner. Alt ditt. Prøv å ikke miste noe.'
  },
  {
    id: 'verdensmakt',
    navn: 'Verdensmakt',
    ikon: '🌍',
    slagord: 'Historien skriver seg selv — du holder pennen.',
    farge: '#e0554b',
    krav: { radhus: 42, omrader: 13, tech: 22, militaer: 2500 },
    intro: 'Da er det bare universet igjen. Vi jobber med den oppdateringen.'
  }
];

OW.RESSURSER = [
  { id: 'tre', navn: 'Tre', ikon: '🪵', farge: '#a3703f' },
  { id: 'stein', navn: 'Stein', ikon: '🪨', farge: '#9aa5b1' },
  { id: 'mat', navn: 'Mat', ikon: '🌾', farge: '#d9b52b' },
  { id: 'jern', navn: 'Jern', ikon: '⛓️', farge: '#8fa0b5' },
  { id: 'gull', navn: 'Gull', ikon: '🪙', farge: '#f2c14e' },
  { id: 'kunnskap', navn: 'Kunnskap', ikon: '📜', farge: '#7fd1c8' }
];

/* Kunnskap får tre ganger så stort lager som de fysiske ressursene
   (se OW.E.beregn) – tanker tar mindre plass enn tømmerstokker. */
