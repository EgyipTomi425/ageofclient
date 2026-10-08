import { Children, cloneElement, createContext, createElement, isValidElement, useContext } from 'react';

const english = {
  'Munkaterület': 'Workspace',
  'Áttekintés': 'Overview',
  'Tornák': 'Tournaments',
  'Menetrend': 'Schedule',
  'Játékosok': 'Players',
  'Elemzés': 'Analytics',
  'Következő esemény': 'Next event',
  'Nevezés nyitva': 'Registration open',
  'Nevezés nyitva ·': 'Registration open ·',
  'nevezett ·': 'entered ·',
  férőhely: 'slots',
  'Részletek': 'Details',
  'Versenyszervező': 'Tournament admin',
  'Profilmenü': 'Profile menu',
  'PostgreSQL kapcsolódva': 'PostgreSQL connected',
  'Új torna': 'New tournament',
  'Versenyközpont · 2026': 'Competition hub · 2026',
  'Jó napot, Admin': 'Welcome, Admin',
  'A közösségi versenyek és élő meccsek állapota.': 'Community tournaments and live match status.',
  'Időpont egyeztetés alatt': 'Time to be confirmed',
  'Menetrend megnyitása': 'Open schedule',
  'Aktív tornák': 'Active tournaments',
  'Élő esemény': 'Live event',
  'Regisztrált játékos': 'Registered players',
  'Lejátszott meccs': 'Matches played',
  'a teljes szezonban': 'this season',
  'most zajlik': 'live now',
  'a közösségi körben': 'in the community',
  'Pálya': 'Map',
  'Civilizáció': 'Civilization',
  'Játékos': 'Player',
  'Mind': 'All',
  'Kiemelt esemény': 'Featured event',
  'Nincs élő torna': 'No live tournament',
  'ÉLŐ': 'LIVE',
  'DÍJAZÁS': 'PRIZE POOL',
  'kezdődött': 'started',
  'Torna megnyitása': 'Open tournament',
  'Pályán': 'On the field',
  'Következő meccsek': 'Upcoming matches',
  'Szűrés': 'Filter',
  'Teljes menetrend': 'Full schedule',
  'Szezon': 'Season',
  'Ranglista': 'Leaderboard',
  'Teljes lista': 'Full list',
  'Szezonkezelés': 'Season management',
  'Nevezések, formátumok és eseményállapotok.': 'Entries, formats, and event status.',
  'Torna létrehozása': 'Create tournament',
  'Torna keresése': 'Search tournaments',
  'Összes torna': 'All tournaments',
  'Esemény kezelése': 'Manage event',
  'A nevezések és meccsek közvetlenül az adatbázisba kerülnek.': 'Entries and matches are saved directly to the database.',
  'Játékos nevezése': 'Add player',
  'Meccs felvétele': 'Add match',
  'Versenyág': 'Bracket',
  'Map és ELO nyomon követés': 'Map and ELO tracking',
  'ELO aktív': 'ELO enabled',
  'ELO ki': 'ELO disabled',
  'Szabad map': 'Open map pool',
  'Nevezettek': 'Entrants',
  'Élő közvetítés · eredmények': 'Live coverage · results',
  'Folyamatban lévő és következő AoE III meccsek.': 'Current and upcoming Age III matches.',
  '2026 · Őszi szezon': '2026 · Autumn season',
  'Meccs / pálya / kör keresése': 'Search matches / maps / rounds',
  'Összes esemény': 'All events',
  'Időrendben': 'Chronological',
  'Közösségi ranglista': 'Community leaderboard',
  'Elo érték és aktív tornák szerint.': 'Ranked by Elo and active tournaments.',
  'Játékos keresése': 'Search players',
  'JÁTÉKOS': 'PLAYER',
  'CIVILIZÁCIÓ': 'CIVILIZATION',
  'TORNÁK': 'TOURNAMENTS',
  'ELO': 'ELO',
  'Nem érhető el az API': 'API unavailable',
  'Ellenőrizd a Proxygen szervert és az adatbázis-kapcsolatot.': 'Check the Proxygen server and database connection.',
  'Újrapróbálás': 'Retry',
  'Nincs megjeleníthető meccs.': 'No matches to display.',
  'Még nincs játékos.': 'No players yet.',
  'VÉGEREDMÉNY': 'FINAL RESULT',
  'NYEREMÉNYALAP': 'PRIZE POOL',
  'Nevezés': 'Registration',
  'Közelgő': 'Upcoming',
  'Lezárult': 'Completed',
  'Torna neve': 'Tournament name',
  'Formátum': 'Format',
  'Kezdés': 'Start time',
  'Játékoslimit': 'Player limit',
  'Korlátlan': 'Unlimited',
  'játékos': 'players',
  'Díjazás · EUR': 'Prize · EUR',
  'ELO ranglistás bajnokság (alapból aktiv)': 'Ranked tournament (ELO enabled by default)',
  'Leírás': 'Description',
  'Rövid versenykiírás': 'Short tournament description',
  'Mégse': 'Cancel',
  'Mentés…': 'Saving…',
  'A torna létrejött.': 'Tournament created.',
  'Játékos hozzáadása': 'Add player',
  'Játékosnév': 'Player name',
  'Játékos neve': 'Player name',
  'Országkód': 'Country code',
  'Nevezés mentése': 'Save entry',
  'Menetrend': 'Schedule',
  'Új meccs': 'New match',
  'Forduló': 'Round',
  'Map neve': 'Map name',
  'Forduló száma': 'Round number',
  'Best of': 'Best of',
  'Résztvevők': 'Participants',
  'Ctrl / Cmd segítségével többet is kiválaszthatsz; legalább kettő kell.': 'Select multiple with Ctrl / Cmd; at least two are required.',
  'Meccs hozzáadása': 'Add match',
  'A meccs felkerült a menetrendbe.': 'Match added to schedule.',
  'Eredményrögzítés': 'Record result',
  'Meccs lezárása': 'Close match',
  'Map': 'Map',
  'JÁTÉKOS': 'PLAYER',
  'PONTSZÁM': 'SCORE',
  'Eredmény mentése': 'Save result',
  'Az eredmény mentve.': 'Result saved.',
  'A nevezés rögzítve.': 'Entry saved.',
  'Fiktív mintaadatok': 'Fictional sample data',
  'Játékelemzés': 'Match analytics',
  'Közösségi adatok': 'Community data',
  'Mintaeredményekből számolt civilizáció- és pályastatisztika.': 'Civilization and map statistics calculated from sample results.',
  'Civilizációk': 'Civilizations',
  'Pályák': 'Maps',
  'Párosítások': 'Matchups',
  'Rangsor típusa': 'Ranking type',
  'Minimum mintajátszma': 'Minimum sample games',
  'Analitika betöltése': 'Loading analytics',
  'Az analitika nem tölthető be: ': 'Could not load analytics: ',
  'Összesített eredmény': 'Overall results',
  'Civ rangsor': 'Civilization ranking',
  'Lezárt játszmák': 'Completed games',
  'JÁTSZMA': 'GAMES',
  'GYŐZELEM': 'WINS',
  'GYŐZELMI ARÁNY': 'WIN RATE',
  'Még nincs elég rögzített mintajátszma.': 'Not enough sample games recorded yet.',
  'Pálya szerinti bontás': 'Map breakdown',
  'Civ teljesítmény a pályán': 'Civilization performance by map',
  'Kiválasztott map': 'Selected map',
  'civ-pick a lezárt játszmákban': 'civilization picks in completed games',
  'Ehhez a maphoz még nincs lezárt mintajátszma.': 'No completed sample games for this map yet.',
  'Egymás ellen': 'Head-to-head',
  'Civilizációs matchupok': 'Civilization matchups',
  'ELLENFÉL': 'OPPONENT',
  'VERESÉG': 'LOSSES',
  'DÖNTETLEN': 'DRAWS',
  'Még nincs elég lezárt mintaeredmény a matchupokhoz.': 'Not enough completed sample results for matchups yet.',
  'Nyílt kupa új és visszatérő játékosoknak.': 'An open cup for new and returning players.',
  'Meghívásos szezonközi torna, nyolc kiemelt játékossal.': 'Invitational mid-season tournament with eight seeded players.',
  'Az őszi liga legjobb négy játékosának döntője.': 'Final for the top four players in the autumn league.',
  'Játszmák elrejtése': 'Hide games',
  'Játszmák és civ választások': 'Games and civ picks',
  'Játszmák betöltése': 'Loading games',
  'Ehhez a meccshez még nincs rögzített játszma.': 'No games recorded for this match yet.',
  'Új mintajátszma': 'New sample game',
  'Map és civ választások': 'Map and civilization picks',
  'Pont': 'Score',
  'Játszma rögzítése': 'Record game',
};

export const LanguageContext = createContext('hu');

export function useLanguage() {
  return useContext(LanguageContext);
}

export function translateText(language, value) {
  if (language !== 'en' || typeof value !== 'string') return value;
  if (english[value] !== undefined) return english[value];
  let match = value.match(/^(\d+) meccs$/);
  if (match) return `${match[1]} matches`;
  match = value.match(/^(\d+) esemény$/);
  if (match) return `${match[1]} events`;
  match = value.match(/^(\d+) torna$/);
  if (match) return `${match[1]} tournaments`;
  match = value.match(/^(\d+) játékos$/);
  if (match) return `${match[1]} players`;
  match = value.match(/^(\d+) fő$/);
  if (match) return `${match[1]} players`;
  match = value.match(/^(\d+) nevezett · (.+) férőhely$/);
  if (match) return `${match[1]} entered · ${match[2]} slots`;
  match = value.match(/^(\d+) van hátra$/);
  if (match) return `${match[1]} remaining`;
  match = value.match(/^(\d+) civ-pick a lezárt játszmákban$/);
  if (match) return `${match[1]} civilization picks in completed games`;
  match = value.match(/^(\d+) \/ (.+) játékos$/);
  if (match) return `${match[1]} / ${match[2]} players`;
  match = value.match(/^Meccsek · (\d+)$/);
  if (match) return `Matches · ${match[1]}`;
  match = value.match(/^Játékosok · (\d+)$/);
  if (match) return `Players · ${match[1]}`;
  match = value.match(/^Játszma (\d+)$/);
  if (match) return `Game ${match[1]}`;
  return value;
}

function translateNode(node, language) {
  if (Array.isArray(node)) return Children.map(node, (child) => translateNode(child, language));
  if (typeof node === 'string') {
    if (node.trim() === '') return node;
    const leading = node.match(/^\s*/)?.[0] ?? '';
    const trailing = node.match(/\s*$/)?.[0] ?? '';
    const end = node.length - trailing.length;
    return `${leading}${translateText(language, node.slice(leading.length, end))}${trailing}`;
  }
  if (!isValidElement(node) || node.props['data-no-translate']) return node;

  const props = {};
  for (const key of ['aria-label', 'placeholder', 'title']) {
    if (typeof node.props[key] === 'string') props[key] = translateText(language, node.props[key]);
  }
  return cloneElement(node, props, translateNode(node.props.children, language));
}

export function TranslationLayer({ language, children }) {
  return createElement(LanguageContext.Provider, { value: language }, translateNode(children, language));
}
