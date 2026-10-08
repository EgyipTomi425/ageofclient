import { useEffect, useState } from 'react';
import { BarChart3, Flame, Map, Swords, Target, TrendingUp, Trophy } from 'lucide-react';
import { apiRequest } from './api.js';
import { CIV_FLAGS, MAP_ART } from './gameAssets.js';
import { TranslationLayer, translateText, useLanguage } from './i18n.js';

const TABS = [
  { id: 'civilizations', label: 'Civilizációk', icon: Trophy },
  { id: 'maps', label: 'Pályák', icon: Map },
  { id: 'matchups', label: 'Párosítások', icon: Swords },
];

async function loadAnalytics() {
  return apiRequest('/analytics', {}, { enabled: true, ttlMs: 20000 });
}

function CivFlag({ civilization }) {
  const src = CIV_FLAGS[civilization];
  return src
    ? <img className="civ-flag" src={src} alt="" loading="lazy" decoding="async" />
    : <span className="civ-flag-fallback" aria-hidden="true">{civilization?.slice(0, 2).toUpperCase()}</span>;
}

function StatTable({ headings, rows, empty }) {
  const language = useLanguage();
  if (!rows.length) return <TranslationLayer language={language}><div className="empty-inline">{empty}</div></TranslationLayer>;
  return <TranslationLayer language={language}><div className="table-wrap"><table className="analytics-table"><thead><tr>{headings.map((heading) => <th key={heading}>{translateText(language, heading)}</th>)}</tr></thead><tbody>{rows}</tbody></table></div></TranslationLayer>;
}

export default function Analytics() {
  const language = useLanguage();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('civilizations');
  const [selectedMap, setSelectedMap] = useState('');
  const [matchupFilter, setMatchupFilter] = useState('all');
  const [minimumGames, setMinimumGames] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadAnalytics().then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  const mapNames = [...new Set((data?.maps ?? []).map((item) => item.mapName))];
  const currentMap = mapNames.includes(selectedMap) ? selectedMap : mapNames[0] ?? '';
  const mapCivs = (data?.maps ?? []).filter((item) => item.mapName === currentMap && item.games >= minimumGames);
  const civilizations = (data?.civilizations ?? []).filter((item) => item.games >= minimumGames);
  const civNames = [...new Set((data?.civilizations ?? []).map((item) => item.civilization))];
  const matchups = (data?.matchups ?? []).filter((item) => item.games >= minimumGames && (matchupFilter === 'all' || item.civilization === matchupFilter));
  const topCiv = civilizations[0] ?? null;
  const totalRecordedGames = civilizations.reduce((sum, item) => sum + item.games, 0) || 0;
  const avgWinRate = civilizations.length ? civilizations.reduce((sum, item) => sum + item.winRate, 0) / civilizations.length : 0;
  const bestMap = (data?.maps ?? []).reduce((best, item) => (!best || item.games > best.games ? item : best), null);
  const strongestMatchup = matchups[0] ?? null;

  return (
    <TranslationLayer language={language}>
    <div className="page-content">
      <div className="page-heading">
        <div><span className="eyebrow">Közösségi adatok</span><h1>Játékelemzés</h1><p>Mintaeredményekből számolt civilizáció- és pályastatisztika.</p></div>
        <span className="subtle-tag"><BarChart3 size={14} /> Fiktív mintaadatok</span>
      </div>
      <div className="analytics-tabs" role="tablist" aria-label="Rangsor típusa">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'analytics-tab active' : 'analytics-tab'} onClick={() => setActiveTab(id)}><Icon size={15} />{label}</button>)}
      </div>
      <div className="analytics-threshold">
        <label className="filter-group compact"><span>Minimum mintajátszma</span><input type="number" min="1" max="999" value={minimumGames} onChange={(event) => setMinimumGames(Math.max(1, Number(event.target.value) || 1))} /></label>
        <span className="sample-note">{language === 'en' ? 'Rows with fewer games are hidden; low-sample results are flagged.' : 'Kevesebb játszma esetén a sor rejtve; a kis minta külön jelölve.'}</span>
      </div>
      {error ? <div className="empty-inline">Az analitika nem tölthető be: {error}</div> : !data ? <div className="loading-state"><span className="spinner" /> Analitika betöltése</div> : (
        <section className="panel analytics-panel">
          <div className="analytics-summary-grid">
            <div className="analytics-summary-card">
              <span className="analytics-summary-icon"><Trophy size={15} /></span>
              <div>
                <small>Top civ</small>
                <strong>{topCiv ? topCiv.civilization : '—'}</strong>
                <span>{topCiv ? `${topCiv.winRate.toFixed(1)}% WR` : 'Nincs adat'}</span>
              </div>
            </div>
            <div className="analytics-summary-card">
              <span className="analytics-summary-icon"><Map size={15} /></span>
              <div>
                <small>Legnépszerűbb map</small>
                <strong>{bestMap ? bestMap.mapName : '—'}</strong>
                <span>{bestMap ? `${bestMap.games} already played` : 'Nincs adat'}</span>
              </div>
            </div>
            <div className="analytics-summary-card">
              <span className="analytics-summary-icon"><TrendingUp size={15} /></span>
              <div>
                <small>Átlag win rate</small>
                <strong>{avgWinRate ? `${avgWinRate.toFixed(1)}%` : '0.0%'}</strong>
                <span>{totalRecordedGames} összesített játék</span>
              </div>
            </div>
            <div className="analytics-summary-card">
              <span className="analytics-summary-icon"><Flame size={15} /></span>
              <div>
                <small>Legjobb matchup</small>
                <strong>{strongestMatchup ? strongestMatchup.civilization : '—'}</strong>
                <span>{strongestMatchup ? `${strongestMatchup.games} match · ${strongestMatchup.wins} win` : 'Nincs adat'}</span>
              </div>
            </div>
          </div>

          {activeTab === 'civilizations' && <>
            <div className="panel-heading"><div><span className="eyebrow">Összesített eredmény</span><h2>Civ rangsor</h2></div><span className="subtle-tag">Lezárt játszmák</span></div>
            <StatTable headings={['#', 'CIVILIZÁCIÓ', 'JÁTSZMA', 'GYŐZELEM', 'GYŐZELMI ARÁNY']} rows={civilizations.map((item, index) => <tr key={item.civilization}><td className="rank-cell">{String(index + 1).padStart(2, '0')}</td><td><span className="analytics-civ"><CivFlag civilization={item.civilization} />{item.civilization}</span></td><td>{item.games}{item.games < 5 && <span className="sample-warning">{language === 'en' ? 'low sample' : 'kis minta'}</span>}</td><td>{item.wins}</td><td><span className="rate-cell">{item.winRate.toFixed(1)}%</span></td></tr>)} empty="Még nincs elég rögzített mintajátszma." />
          </>}
          {activeTab === 'maps' && <>
            <div className="panel-heading"><div><span className="eyebrow">Pálya szerinti bontás</span><h2>Civ teljesítmény a pályán</h2></div><label className="filter-group compact"><span>Pálya</span><select value={currentMap} onChange={(event) => setSelectedMap(event.target.value)}>{mapNames.map((name) => <option key={name}>{name}</option>)}</select></label></div>
            {currentMap ? <div className="map-analysis-hero">{MAP_ART[currentMap] && <img src={MAP_ART[currentMap]} alt={`${currentMap} minimap`} loading="lazy" decoding="async" />}<div><span className="eyebrow">Kiválasztott map</span><h3>{currentMap}</h3><span>{mapCivs.reduce((sum, item) => sum + item.games, 0)} civ-pick a lezárt játszmákban</span></div></div> : null}
            <StatTable headings={['#', 'CIVILIZÁCIÓ', 'JÁTSZMA', 'GYŐZELEM', 'GYŐZELMI ARÁNY']} rows={mapCivs.map((item, index) => <tr key={item.civilization}><td className="rank-cell">{String(index + 1).padStart(2, '0')}</td><td><span className="analytics-civ"><CivFlag civilization={item.civilization} />{item.civilization}</span></td><td>{item.games}{item.games < 5 && <span className="sample-warning">{language === 'en' ? 'low sample' : 'kis minta'}</span>}</td><td>{item.wins}</td><td><span className="rate-cell">{item.winRate.toFixed(1)}%</span></td></tr>)} empty="Ehhez a maphoz még nincs lezárt mintajátszma." />
          </>}
          {activeTab === 'matchups' && <>
            <div className="panel-heading"><div><span className="eyebrow">Egymás ellen</span><h2>Civilizációs matchupok</h2></div><label className="filter-group compact"><span>Civilizáció</span><select value={matchupFilter} onChange={(event) => setMatchupFilter(event.target.value)}><option value="all">Mind</option>{civNames.map((name) => <option key={name}>{name}</option>)}</select></label></div>
            <StatTable headings={['CIV', 'ELLENFÉL', 'JÁTSZMA', 'GYŐZELEM', 'VERESÉG', 'DÖNTETLEN']} rows={matchups.map((item, index) => <tr key={`${item.civilization}-${item.opponentCivilization}-${index}`}><td><span className="analytics-civ"><CivFlag civilization={item.civilization} />{item.civilization}</span></td><td><span className="analytics-civ"><CivFlag civilization={item.opponentCivilization} />{item.opponentCivilization}</span></td><td>{item.games}{item.games < 5 && <span className="sample-warning">{language === 'en' ? 'low sample' : 'kis minta'}</span>}</td><td>{item.wins}</td><td>{item.losses}</td><td>{item.draws}</td></tr>)} empty="Még nincs elég lezárt mintaeredmény a matchupokhoz." />
          </>}
        </section>
      )}
    </div>
    </TranslationLayer>
  );
}
