import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, Award, CalendarDays,
  Check, ChevronDown, Clock3, Filter, Gamepad2, Languages, Map,
  MoreHorizontal, Plus, Search, Shield, Swords, Trophy, Users,
  X,
} from 'lucide-react';
import Analytics from './Analytics.jsx';
import MatchGameDetails from './MatchGameDetails.jsx';
import { apiRequest } from './api.js';
import { TranslationLayer, translateText, useLanguage } from './i18n.js';

function dateLabel(value, withTime = false, language = 'hu') {
  if (!value) return 'Időpont egyeztetés alatt';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'hu-HU', withTime
    ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric' }).format(new Date(value));
}

function money(cents, language = 'hu') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'hu-HU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
}

function statusLabel(status) {
  return ({ live: 'Élő', registration: 'Nevezés', upcoming: 'Közelgő', completed: 'Lezárult' })[status] ?? status;
}

function flagFor(country) {
  const code = String(country ?? '').trim().toUpperCase();
  if (!code) return '🏆';
  return Array.from(code).map((character) => String.fromCodePoint(character.charCodeAt(0) + 127397)).join('');
}

function civLabel(value, index = 0) {
  const raw = String(value ?? '').trim();
  if (!raw) return `CIV ${index + 1}`;

  const lettersOnly = raw.replace(/[^A-Za-z]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!lettersOnly) return `CIV ${index + 1}`;

  const compact = lettersOnly.split(' ').filter(Boolean).slice(0, 2).map((part) => part.slice(0, 3).toUpperCase()).join('');
  const tooNoisy = raw.length > 14 || (raw.match(/\d/g) || []).length >= 2;

  if (tooNoisy) return compact || `CIV ${index + 1}`;
  return lettersOnly.length <= 6 ? lettersOnly.toUpperCase() : lettersOnly.slice(0, 6).toUpperCase();
}

function eloDeltaText(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const delta = Number(value);
  return `${delta > 0 ? '+' : ''}${delta}`;
}

function matchSizeLabel(match) {
  const participantCount = match?.participants?.length ?? 0;
  if (participantCount <= 2) return '1v1';
  if (participantCount === 4) return '2v2';
  if (participantCount === 6) return '3v3';
  if (participantCount === 8) return '4v4';
  return `${participantCount} fő`;
}

function Modal({ title, eyebrow, onClose, children, wide = false }) {
  const language = useLanguage();
  return (
    <TranslationLayer language={language}><div className="modal-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <div><span className="eyebrow">{translateText(language, eyebrow)}</span><h2 id="modal-title">{translateText(language, title)}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Bezárás"><X size={18} /></button>
        </div>
        {children}
      </section>
    </div></TranslationLayer>
  );
}

function App() {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('ageof-language') === 'en' ? 'en' : 'hu';
    } catch {
      return 'hu';
    }
  });
  const [dashboard, setDashboard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState('overview');
  const [dialog, setDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [mapFilter, setMapFilter] = useState('all');
  const [civFilter, setCivFilter] = useState('all');
  const [playerFilter, setPlayerFilter] = useState('all');

  useEffect(() => {
    try {
      localStorage.setItem('ageof-language', language);
    } catch {
      setNotice({ kind: 'error', text: 'A nyelvválasztás nem menthető ebben a böngészőben.' });
    }
  }, [language]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await apiRequest('/dashboard', {}, { enabled: true, ttlMs: 15000 });
      setDashboard(data);
      setSelectedId((current) => current ?? data.tournaments[0]?.id ?? null);
    } catch (error) {
      setNotice({ kind: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    if (!id) return setDetail(null);
    try {
      setDetail(await apiRequest(`/tournaments/${id}`, {}, { enabled: true, ttlMs: 15000 }));
    } catch (error) {
      setNotice({ kind: 'error', text: error.message });
    }
  }

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { loadDetail(selectedId); }, [selectedId]);
  useEffect(() => {
    try {
      localStorage.setItem('ageof-language', language);
    } catch {
      setNotice({ kind: 'error', text: 'A nyelvválasztás nem menthető ebben a böngészőben.' });
    }
  }, [language]);

  async function submitAction(event) {
    event.preventDefault();
    if (!dialog) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (dialog.type === 'tournament') {
        await apiRequest('/tournaments', {
          method: 'POST',
          body: JSON.stringify({
            name: form.get('name'), format: form.get('format'),
            startsAt: new Date(form.get('startsAt')).toISOString(),
            maxPlayers: form.get('maxPlayers') === '' ? 0 : Number(form.get('maxPlayers')),
            prizeCents: Math.round(Number(form.get('prize') || 0) * 100),
            rated: form.get('rated') === 'on',
            description: form.get('description'),
          }),
        });
        setNotice({ kind: 'success', text: 'A torna létrejött.' });
        setPage('tournaments');
      } else if (dialog.type === 'entry') {
        await apiRequest(`/tournaments/${dialog.tournamentId}/entries`, {
          method: 'POST',
          body: JSON.stringify({ handle: form.get('handle'), country: form.get('country').toUpperCase(), civilization: form.get('civilization') }),
        });
        setNotice({ kind: 'success', text: 'A nevezés rögzítve.' });
      } else if (dialog.type === 'match') {
        const playerIds = Array.from(form.getAll('playerIds'), Number);
        await apiRequest(`/tournaments/${dialog.tournamentId}/matches`, {
          method: 'POST',
          body: JSON.stringify({
            round: form.get('round'), mapName: form.get('mapName'),
            scheduledAt: new Date(form.get('scheduledAt')).toISOString(),
            matchNumber: Number(form.get('matchNumber') || 1),
            bestOf: Number(form.get('bestOf') || 1), playerIds,
          }),
        });
        setNotice({ kind: 'success', text: 'A meccs felkerült a menetrendbe.' });
      } else if (dialog.type === 'result') {
        const participants = Array.from(event.currentTarget.querySelectorAll('[data-score-player]'), (input) => ({
          playerId: Number(input.dataset.scorePlayer), score: Number(input.value),
        }));
        await apiRequest(`/matches/${dialog.match.id}/result`, {
          method: 'POST', body: JSON.stringify({ mapName: form.get('mapName'), participants }),
        });
        setNotice({ kind: 'success', text: 'Az eredmény mentve.' });
      }
      setDialog(null);
      await loadDashboard();
      if (selectedId) await loadDetail(selectedId);
    } catch (error) {
      setNotice({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  const tournaments = dashboard?.tournaments ?? [];
  const allPlayers = dashboard?.players ?? [];
  const allMatches = dashboard?.matches ?? [];
  const playerLookup = Object.fromEntries(allPlayers.map((player) => [player.id, player]));
  const mapOptions = [...new Set(allMatches.map((match) => match.mapName).filter(Boolean))].sort();
  const civOptions = [...new Set(allPlayers.map((player) => player.civilization).filter(Boolean))].sort();
  const filteredTournaments = useMemo(
    () => tournaments.filter((item) => `${item.name} ${item.format}`.toLowerCase().includes(search.toLowerCase())),
    [search, tournaments],
  );

  const matchesBySelectedFilters = useMemo(
    () => (match) => {
      const mapMatch = mapFilter === 'all' || match.mapName === mapFilter;
      const civMatch = civFilter === 'all' || match.participants.some((participant) => (playerLookup[participant.id]?.civilization ?? '') === civFilter);
      const playerMatch = playerFilter === 'all' || match.participants.some((participant) => Number(participant.id) === Number(playerFilter));
      return mapMatch && civMatch && playerMatch;
    },
    [civFilter, mapFilter, playerFilter, playerLookup],
  );

  const upcomingMatches = useMemo(
    () => allMatches.filter((item) => item.status !== 'completed' && matchesBySelectedFilters(item)),
    [allMatches, matchesBySelectedFilters],
  );
  const overviewMatches = useMemo(() => upcomingMatches.slice(0, 3), [upcomingMatches]);
  const filteredScheduleMatches = useMemo(
    () => allMatches.filter((match) => {
      const searchMatch = !search || `${match.round} ${match.mapName} ${match.tournament ?? ''}`.toLowerCase().includes(search.toLowerCase());
      return searchMatch && matchesBySelectedFilters(match);
    }),
    [allMatches, matchesBySelectedFilters, search],
  );

  const summary = dashboard?.summary ?? {};
  const topCivItems = (dashboard?.insights?.topCivilizations ?? []).map((entry, index) => ({
    label: civLabel(entry.civilization, index),
    value: Number(entry.players ?? 0),
  }));
  const topCiv = dashboard?.insights?.topCivilizations?.[0] ?? null;
  const momentumSeries = useMemo(() => {
    const topPlayers = dashboard?.insights?.topPlayers ?? [];
    if (!topPlayers.length) return [42, 48, 52, 51, 58, 64, 68, 72];
    return topPlayers.slice(0, 8).map((player, index) => Math.min(100, Math.max(35, player.elo / 16 + index * 5)));
  }, [dashboard]);

  function openTournament(id) {
    setSelectedId(id);
    setPage('detail');
  }

  function updateSeriesScores(matchId, seriesScores) {
    const scores = new Map(seriesScores.map((entry) => [Number(entry.playerId), entry.score]));
    const updateMatch = (match) => match.id === matchId
      ? { ...match, participants: match.participants.map((player) => ({ ...player, score: scores.get(Number(player.id)) ?? player.score })) }
      : match;
    setDashboard((current) => current && ({ ...current, matches: current.matches.map(updateMatch) }));
    setDetail((current) => current && ({ ...current, matches: current.matches.map(updateMatch) }));
  }

  return (
    <TranslationLayer language={language}>
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setPage('overview'); }}>
          <span className="brand-mark"><Gamepad2 size={21} /></span>
          <span className="brand-copy"><strong>FRONTIER</strong><small>AGE III · COMPETITIVE</small></span>
        </a>
        <div className="season-switch"><span className="season-dot" /><span>2026 / Autumn circuit</span><ChevronDown size={14} /></div>
        <span className="nav-label">Munkaterület</span>
        <nav className="nav-list" aria-label="Fő navigáció">
          <button className={page === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('overview')}><Activity size={17} /> Áttekintés</button>
          <button className={page === 'tournaments' || page === 'detail' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('tournaments')}><Trophy size={17} /> Tornák <span className="nav-count">{tournaments.length}</span></button>
          <button className={page === 'schedule' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('schedule')}><CalendarDays size={17} /> Menetrend</button>
          <button className={page === 'players' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('players')}><Users size={17} /> Játékosok</button>
          <button className={page === 'analytics' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('analytics')}><Activity size={17} /> Elemzés</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="season-card"><span className="season-card-kicker">Következő esemény</span><strong>Frontier Open</strong><span>Nevezés nyitva · {dateLabel(tournaments.find((t) => t.slug === 'frontier-open-2026')?.startsAt, false, language)}</span><button onClick={() => openTournament(tournaments.find((t) => t.slug === 'frontier-open-2026')?.id)}>Részletek <ArrowRight size={14} /></button></div>
          <div className="profile-row"><div className="profile-avatar">A</div><div><strong>Admin</strong><span>Versenyszervező</span></div><button className="icon-button subtle" aria-label="Profilmenü"><MoreHorizontal size={18} /></button></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Gamepad2 size={18} /></span><strong>FRONTIER</strong></div>
          <div className="breadcrumb"><span>Age III</span><span className="crumb-slash">/</span><strong>{page === 'detail' ? detail?.name ?? 'Torna' : ({ overview: 'Áttekintés', tournaments: 'Tornák', schedule: 'Menetrend', players: 'Játékosok', analytics: 'Elemzés' })[page]}</strong></div>
          <div className="top-actions"><div className="connection"><span /> PostgreSQL kapcsolódva</div><button className="language-toggle" type="button" data-no-translate="true" onClick={() => setLanguage((current) => current === 'hu' ? 'en' : 'hu')} aria-label={language === 'hu' ? 'Switch to English' : 'Switch to Hungarian'}><Languages size={15} /><span>{language === 'hu' ? 'EN' : 'HU'}</span></button><button className="button button-primary button-small" onClick={() => setDialog({ type: 'tournament' })}><Plus size={16} /> Új torna</button></div>
        </header>

        {notice && <div className={`notice ${notice.kind}`} role="status"><span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Értesítés bezárása"><X size={15} /></button></div>}

        {loading && !dashboard ? <div className="loading-state"><span className="spinner" /> Adatok betöltése</div> : null}
        {!loading && !dashboard ? <section className="empty-state"><Shield size={26} /><h2>Nem érhető el az API</h2><p>Ellenőrizd a Proxygen szervert és az adatbázis-kapcsolatot.</p><button className="button button-secondary" onClick={loadDashboard}>Újrapróbálás</button></section> : null}

        {dashboard && page === 'overview' && (
          <div className="page-content">
            <div className="page-heading"><div><span className="eyebrow">Versenyközpont · 2026</span><h1>Jó napot, Admin</h1><p>A közösségi versenyek és élő meccsek állapota.</p></div><button className="button button-secondary" onClick={() => setPage('schedule')}><CalendarDays size={16} /> Menetrend megnyitása</button></div>
            <section className="stat-grid">
              <StatCard label="Aktív tornák" value={dashboard.counts.tournaments} icon={<Trophy size={18} />} delta="a teljes szezonban" tone="terra" />
              <StatCard label="Élő esemény" value={dashboard.counts.live} icon={<Activity size={18} />} delta="most zajlik" tone="mint" />
              <StatCard label="Regisztrált játékos" value={dashboard.counts.players} icon={<Users size={18} />} delta="a közösségi körben" tone="blue" />
              <StatCard label="Lejátszott meccs" value={dashboard.counts.completedMatches} icon={<Swords size={18} />} delta={`${dashboard.counts.scheduledMatches} van hátra`} tone="gold" />
              <StatCard label="Átlag win rate" value={`${Number(summary.averageWinRate ?? 0).toFixed(1)}%`} icon={<Award size={18} />} delta="játékosok teljesítménye" tone="blue" />
              <StatCard label="ELO spread" value={summary.eloSpread ?? 0} icon={<Trophy size={18} />} delta={`peak ${summary.peakElo ?? 0}`} tone="terra" />
            </section>
            <section className="chart-grid">
              <article className="panel chart-panel">
                <div className="panel-heading">
                  <div><span className="eyebrow">Trend</span><h2>Legnépszerűbb civ</h2></div>
                  <span className="subtle-tag">Top 4</span>
                </div>
                <TopCivChart items={topCivItems.length ? topCivItems : [{ label: 'CIV', value: 0 }]} color="#7aa9ff" />
              </article>
              <article className="panel chart-panel">
                <div className="panel-heading">
                  <div><span className="eyebrow">Aktivitás</span><h2>Játszma-arány</h2></div>
                  <span className="subtle-tag">Szezon</span>
                </div>
                <RingGauge value={Math.min(100, Math.round(((dashboard.counts.completedMatches ?? 0) / Math.max(1, (dashboard.counts.completedMatches ?? 0) + (dashboard.counts.scheduledMatches ?? 0))) * 100))} total={100} label="lejátszott" color="#5fe0c0" />
              </article>
            </section>
            <section className="premium-grid">
              <article className="panel premium-panel">
                <div className="panel-heading">
                  <div><span className="eyebrow">Momentum</span><h2>Competitive momentum</h2></div>
                  <span className="subtle-tag">Last 8</span>
                </div>
                <div className="premium-hero">
                  <div>
                    <span className="premium-kicker">Szezon trend</span>
                    <strong>{Math.round((momentumSeries.at(-1) ?? 0))}%</strong>
                    <p>Versenyképesség a legjobb játékosok körében.</p>
                  </div>
                  <TrendSparkline values={momentumSeries} color="#ff7853" />
                </div>
                <div className="premium-metrics">
                  <div className="premium-metric">
                    <span>Peak ELO</span>
                    <strong>{summary.peakElo ?? 0}</strong>
                  </div>
                  <div className="premium-metric">
                    <span>Win rate</span>
                    <strong>{(summary.averageWinRate ?? 0).toFixed(1)}%</strong>
                  </div>
                  <div className="premium-metric">
                    <span>Upcoming</span>
                    <strong>{summary.upcomingEvents ?? 0}</strong>
                  </div>
                </div>
              </article>
              <article className="panel premium-side">
                <div className="panel-heading">
                  <div><span className="eyebrow">Top performance</span><h2>Front runners</h2></div>
                </div>
                <div className="mini-rank-list">
                  {(dashboard.insights?.topPlayers ?? []).slice(0, 4).map((player, index) => (
                    <div className="mini-rank-item" key={player.id}>
                      <span className="mini-rank">#{index + 1}</span>
                      <div>
                        <strong>{player.handle}</strong>
                        <small>{player.civilization}</small>
                      </div>
                      <em>{player.elo}</em>
                    </div>
                  ))}
                </div>
              </article>
            </section>
            <section className="pulse-grid">
              <article className="panel pulse-card">
                <div className="panel-heading"><div><span className="eyebrow">Top form</span><h2>Játékosok</h2></div></div>
                <div className="info-list">
                  {(dashboard.insights?.topPlayers ?? []).slice(0, 3).map((player) => (
                    <div className="info-row" key={player.id}><div className="info-meta"><strong>{player.handle}</strong><span>{player.civilization}</span></div><span className="pill-metric">{player.elo} ELO</span></div>
                  ))}
                </div>
              </article>
              <article className="panel pulse-card">
                <div className="panel-heading"><div><span className="eyebrow">Map trend</span><h2>Legnépszerűbb pályák</h2></div></div>
                <div className="info-list">
                  {(dashboard.insights?.topMaps ?? []).slice(0, 3).map((map, index) => (
                    <div className="info-row" key={map.mapName}><div className="info-meta"><strong>#{index + 1} {map.mapName}</strong><span>{map.games} játszma</span></div><span className="pill-metric">{map.games}x</span></div>
                  ))}
                </div>
              </article>
              <article className="panel pulse-card">
                <div className="panel-heading"><div><span className="eyebrow">Szezon</span><h2>Pulse</h2></div></div>
                <div className="info-list compact">
                  <div className="info-row"><div className="info-meta"><strong>Nyitott nevezések</strong><span>Aktuális szezonban</span></div><span className="pill-metric">{dashboard.summary?.registrationsOpen ?? 0}</span></div>
                  <div className="info-row"><div className="info-meta"><strong>Hamarosan</strong><span>Felkészülő események</span></div><span className="pill-metric">{dashboard.summary?.upcomingEvents ?? 0}</span></div>
                  <div className="info-row"><div className="info-meta"><strong>Leggyakoribb civ</strong><span>{topCiv?.civilization ?? 'n/a'}</span></div><span className="pill-metric">{topCiv?.players ?? 0}</span></div>
                  <div className="info-row"><div className="info-meta"><strong>Átlagos szint</strong><span>Win rate</span></div><span className="pill-metric">{(dashboard.summary?.averageWinRate ?? 0).toFixed(1)}%</span></div>
                </div>
              </article>
            </section>
            <div className="quick-filters">
              <div className="filter-group compact"><span>Pálya</span><select value={mapFilter} onChange={(event) => setMapFilter(event.target.value)}><option value="all">Mind</option>{mapOptions.map((mapName) => <option key={mapName} value={mapName}>{mapName}</option>)}</select></div>
              <div className="filter-group compact"><span>Civilizáció</span><select value={civFilter} onChange={(event) => setCivFilter(event.target.value)}><option value="all">Mind</option>{civOptions.map((civilization) => <option key={civilization} value={civilization}>{civilization}</option>)}</select></div>
              <div className="filter-group compact"><span>Játékos</span><select value={playerFilter} onChange={(event) => setPlayerFilter(event.target.value)}><option value="all">Mind</option>{allPlayers.map((player) => <option key={player.id} value={player.id}>{player.handle}</option>)}</select></div>
            </div>
            <div className="content-grid">
              <section className="panel feature-panel">
                <div className="panel-heading"><div><span className="eyebrow">Kiemelt esemény</span><h2>{tournaments.find((item) => item.status === 'live')?.name ?? 'Nincs élő torna'}</h2></div><span className="live-pill"><span /> ÉLŐ</span></div>
                {(() => {
                  const live = tournaments.find((item) => item.status === 'live');
                  if (!live) return <div className="empty-inline">Jelenleg nincs élő esemény.</div>;
                  return <>
                    <div className="feature-strip"><div className="feature-emblem"><Trophy size={26} /></div><div className="feature-meta"><span>{live.game}</span><strong>{live.format}</strong><span>{live.entrants} nevezett · {live.maxPlayers ?? 'korlátlan'} férőhely</span></div><div className="feature-prize"><small>DÍJAZÁS</small><strong>{money(live.prizeCents, language)}</strong></div></div>
                    <div className="feature-footer"><span><Clock3 size={15} /> {dateLabel(live.startsAt, true, language)} kezdődött</span><button className="text-button" onClick={() => openTournament(live.id)}>Torna megnyitása <ArrowRight size={15} /></button></div>
                  </>;
                })()}
              </section>
              <section className="panel next-panel">
                <div className="panel-heading"><div><span className="eyebrow">Pályán</span><h2>Következő meccsek</h2></div><button className="icon-button" aria-label="Szűrés"><Filter size={17} /></button></div>
                <MatchList matches={overviewMatches} onReport={(match) => setDialog({ type: 'result', match })} onSeriesScores={updateSeriesScores} playerLookup={playerLookup} />
                <button className="panel-link" onClick={() => setPage('schedule')}>Teljes menetrend <ArrowRight size={14} /></button>
              </section>
              <section className="panel tournaments-panel">
                <div className="panel-heading"><div><span className="eyebrow">Szezon</span><h2>Tornák</h2></div><button className="text-button" onClick={() => setPage('tournaments')}>Mind <ArrowRight size={15} /></button></div>
                <TournamentTable tournaments={tournaments.slice(0, 4)} onOpen={openTournament} />
              </section>
              <section className="panel players-panel">
                <div className="panel-heading"><div><span className="eyebrow">Ranglista</span><h2>Játékosok</h2></div><button className="text-button" onClick={() => setPage('players')}>Teljes lista <ArrowRight size={15} /></button></div>
                <PlayerList players={allPlayers.slice(0, 5)} />
              </section>
            </div>
          </div>
        )}

        {dashboard && page === 'tournaments' && (
          <div className="page-content">
            <div className="page-heading"><div><span className="eyebrow">Szezonkezelés</span><h1>Tornák</h1><p>Nevezések, formátumok és eseményállapotok.</p></div><button className="button button-primary" onClick={() => setDialog({ type: 'tournament' })}><Plus size={16} /> Torna létrehozása</button></div>
            <div className="toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Torna keresése" /></div><div className="toolbar-note">{filteredTournaments.length} esemény</div></div>
            <section className="tournament-grid">{filteredTournaments.map((item) => <TournamentCard key={item.id} tournament={item} onOpen={openTournament} />)}</section>
          </div>
        )}

        {dashboard && page === 'detail' && detail && (
          <div className="page-content">
            <button className="back-link" onClick={() => setPage('tournaments')}><ArrowRight size={14} className="back-arrow" /> Összes torna</button>
            <div className="detail-hero" style={{ '--event-accent': detail.accent }}><div className="detail-mark"><Trophy size={30} /></div><div className="detail-title"><span className={`status-pill ${detail.status}`}>{statusLabel(detail.status)}</span><h1>{detail.name}</h1><p>{detail.description}</p><div className="detail-meta"><span><Gamepad2 size={15} /> {detail.game}</span><span><CalendarDays size={15} /> {dateLabel(detail.startsAt, true, language)}</span><span><Users size={15} /> {detail.entries.length} / {detail.maxPlayers ?? '∞'} játékos</span><span><Award size={15} /> {detail.rated ? 'Ranked' : 'Casual'}</span></div></div><div className="detail-prize"><small>NYEREMÉNYALAP</small><strong>{money(detail.prizeCents, language)}</strong><span>{detail.format} · {detail.rated ? 'ELO aktív' : 'ELO ki'}</span></div></div>
            <div className="detail-actions"><div><span className="eyebrow">Esemény kezelése</span><p>A nevezések és meccsek közvetlenül az adatbázisba kerülnek.</p></div><div className="action-row"><button className="button button-secondary" onClick={() => setDialog({ type: 'entry', tournamentId: detail.id })}><Users size={16} /> Játékos nevezése</button><button className="button button-primary" onClick={() => setDialog({ type: 'match', tournamentId: detail.id })}><Plus size={16} /> Meccs felvétele</button></div></div>
            <div className="detail-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Versenyág</span><h2>Meccsek · {detail.matches.length}</h2></div><span className="subtle-tag"><Map size={14} /> {detail.matches.length ? 'Map és ELO nyomon követés' : 'Szabad map'}</span></div><MatchList matches={detail.matches} onReport={(match) => setDialog({ type: 'result', match })} onSeriesScores={updateSeriesScores} playerLookup={playerLookup} /></section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Nevezettek</span><h2>Játékosok · {detail.entries.length}</h2></div><button className="icon-button" onClick={() => setDialog({ type: 'entry', tournamentId: detail.id })} aria-label="Játékos nevezése"><Plus size={17} /></button></div><PlayerList players={detail.entries} showSeed /></section></div>
          </div>
        )}

        {dashboard && page === 'schedule' && (
          <div className="page-content"><div className="page-heading"><div><span className="eyebrow">Élő közvetítés · eredmények</span><h1>Menetrend</h1><p>Folyamatban lévő és következő AoE III meccsek.</p></div><span className="schedule-date"><CalendarDays size={16} /> 2026 · Őszi szezon</span></div><div className="toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Meccs / pálya / kör keresése" /></div><div className="filter-group"><span>Pálya</span><select value={mapFilter} onChange={(event) => setMapFilter(event.target.value)}><option value="all">Mind</option>{mapOptions.map((mapName) => <option key={mapName} value={mapName}>{mapName}</option>)}</select></div><div className="filter-group"><span>Civilizáció</span><select value={civFilter} onChange={(event) => setCivFilter(event.target.value)}><option value="all">Mind</option>{civOptions.map((civilization) => <option key={civilization} value={civilization}>{civilization}</option>)}</select></div><div className="filter-group"><span>Játékos</span><select value={playerFilter} onChange={(event) => setPlayerFilter(event.target.value)}><option value="all">Mind</option>{allPlayers.map((player) => <option key={player.id} value={player.id}>{player.handle}</option>)}</select></div></div><section className="panel schedule-panel"><div className="panel-heading"><div><span className="eyebrow">Összes esemény</span><h2>{filteredScheduleMatches.length} meccs</h2></div><span className="subtle-tag"><Clock3 size={14} /> Időrendben</span></div><MatchList matches={filteredScheduleMatches} onReport={(match) => setDialog({ type: 'result', match })} showTournament onSeriesScores={updateSeriesScores} playerLookup={playerLookup} /></section></div>
        )}

        {dashboard && page === 'players' && (
          <div className="page-content"><div className="page-heading"><div><span className="eyebrow">Közösségi ranglista</span><h1>Játékosok</h1><p>Elo érték és aktív tornák szerint.</p></div><div className="search-box compact"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Játékos keresése" /></div></div><section className="panel leaderboard-panel"><div className="leaderboard-head"><span>#</span><span>JÁTÉKOS</span><span>CIVILIZÁCIÓ</span><span>TORNÁK</span><span>ELO</span></div><PlayerList players={allPlayers.filter((item) => `${item.handle} ${item.civilization}`.toLowerCase().includes(search.toLowerCase()))} showRank showEvents /></section></div>
        )}

        {dashboard && page === 'analytics' && <Analytics />}
      </main>

      {dialog?.type === 'tournament' && <Modal eyebrow="Új esemény" title="Torna létrehozása" onClose={() => setDialog(null)}><form className="form-stack" onSubmit={submitAction}><label>Torna neve<input name="name" required maxLength="120" placeholder="pl. Frontier Open" /></label><div className="form-row"><label>Formátum<input name="format" required placeholder="Single elimination · Bo3" /></label><label>Kezdés<input name="startsAt" type="datetime-local" required /></label></div><div className="form-row"><label>Játékoslimit<select name="maxPlayers" defaultValue=""><option value="">Korlátlan</option><option value="8">8 játékos</option><option value="16">16 játékos</option><option value="32">32 játékos</option><option value="64">64 játékos</option></select></label><label>Díjazás · EUR<input name="prize" type="number" min="0" step="1" defaultValue="0" /></label></div><label className="toggle-row"><input name="rated" type="checkbox" defaultChecked /> ELO ranglistás bajnokság (alapból aktiv)</label><label>Leírás<textarea name="description" rows="3" placeholder="Rövid versenykiírás" /></label><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setDialog(null)}>Mégse</button><button className="button button-primary" disabled={busy}><Plus size={16} /> {busy ? 'Mentés…' : 'Torna létrehozása'}</button></div></form></Modal>}

      {dialog?.type === 'entry' && <Modal eyebrow="Nevezés" title="Játékos hozzáadása" onClose={() => setDialog(null)}><form className="form-stack" onSubmit={submitAction}><label>Játékosnév<input name="handle" required maxLength="80" placeholder="Játékos neve" /></label><div className="form-row"><label>Országkód<input name="country" required minLength="2" maxLength="2" defaultValue="HU" /></label><label>Civilizáció<input name="civilization" required placeholder="pl. Magyar" /></label></div><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setDialog(null)}>Mégse</button><button className="button button-primary" disabled={busy}><Users size={16} /> Nevezés mentése</button></div></form></Modal>}

      {dialog?.type === 'match' && <Modal eyebrow="Menetrend" title="Új meccs" onClose={() => setDialog(null)} wide><form className="form-stack" onSubmit={submitAction}><div className="form-row"><label>Forduló<input name="round" required placeholder="pl. Csoportkör · 1. forduló" /></label><label>Map neve<input name="mapName" required placeholder="Bármilyen map" /></label></div><div className="form-row"><label>Kezdés<input name="scheduledAt" type="datetime-local" required /></label><label>Forduló száma<input name="matchNumber" type="number" min="1" defaultValue="1" /></label><label>Best of<input name="bestOf" type="number" min="1" defaultValue="1" /></label></div><label>Résztvevők <span className="field-note">Ctrl / Cmd segítségével többet is kiválaszthatsz; legalább kettő kell.</span><select className="multi-select" name="playerIds" multiple required size={Math.min(8, Math.max(4, detail?.entries.length ?? 4))}>{(detail?.entries ?? []).map((player) => <option value={player.id} key={player.id}>{player.handle} · {player.civilization} · #{player.seed}</option>)}</select></label><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setDialog(null)}>Mégse</button><button className="button button-primary" disabled={busy}><Swords size={16} /> Meccs hozzáadása</button></div></form></Modal>}

      {dialog?.type === 'result' && <Modal eyebrow="Eredményrögzítés" title="Meccs lezárása" onClose={() => setDialog(null)} wide><form className="form-stack" onSubmit={submitAction}><div className="result-context"><span>{dialog.match.round}</span><strong>{dialog.match.mapName}</strong><small>{dialog.match.tournament}</small></div><label>Map<input name="mapName" required defaultValue={dialog.match.mapName} /></label><div className="score-grid"><div className="score-head"><span>JÁTÉKOS</span><span>CIVILIZÁCIÓ</span><span>PONTSZÁM</span></div>{dialog.match.participants.map((player) => <div className="score-row" key={player.id}><strong>{player.handle}</strong><span>{player.civilization}</span><input data-score-player={player.id} type="number" min="0" max="99" defaultValue={player.score ?? 0} required aria-label={`${player.handle} pontszáma`} /></div>)}</div><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setDialog(null)}>Mégse</button><button className="button button-primary" disabled={busy}><Check size={16} /> Eredmény mentése</button></div></form></Modal>}
    </div>
    </TranslationLayer>
  );
}

function TrendSparkline({ values, color = '#ff7853' }) {
  if (!values.length) return null;
  const width = 420;
  const height = 130;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / Math.max(1, max - min)) * (height - 18) - 8;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Trend chart">
      <defs>
        <linearGradient id="sparklineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#sparklineFill)" opacity="0.9" />
    </svg>
  );
}

function TopCivChart({ items, color = '#7aa9ff' }) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="civ-bar-chart" aria-label="Top civilizations chart">
      {items.map((item, index) => (
        <div className="civ-bar-row" key={`${item.label}-${index}`}>
          <span className="civ-bar-label">{item.label}</span>
          <div className="civ-bar-track">
            <span className="civ-bar-fill" style={{ width: `${(item.value / maxValue) * 100}%`, background: color }} />
          </div>
          <span className="civ-bar-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function RingGauge({ value, total, label, color }) {
  const percentage = Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div className="ring-meter" style={{ background: `conic-gradient(${color} 0 ${percentage}%, rgba(255,255,255,0.08) ${percentage}% 100%)` }}>
      <div className="ring-core">
        <strong>{percentage}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, delta, tone }) {
  const language = useLanguage();
  return <TranslationLayer language={language}><article className={`stat-card ${tone}`}><div className="stat-top"><span>{translateText(language, label)}</span><span className="stat-icon">{icon}</span></div><strong className="stat-value">{value}</strong><span className="stat-delta">{translateText(language, delta)}</span></article></TranslationLayer>;
}

function TournamentTable({ tournaments, onOpen }) {
  const language = useLanguage();
  if (!tournaments.length) return <TranslationLayer language={language}><div className="empty-inline">Még nincs torna.</div></TranslationLayer>;
  return <TranslationLayer language={language}><div className="table-wrap"><table><thead><tr><th>ESEMÉNY</th><th>STÁTUSZ</th><th>NEVEZÉS</th><th>DÍJAZÁS</th><th /></tr></thead><tbody>{tournaments.map((item) => <tr key={item.id} onClick={() => onOpen(item.id)}><td><span className="event-cell"><span className="event-swatch" style={{ background: item.accent }} /><span><strong>{item.name}</strong><small>{item.format}</small></span></span></td><td><span className={`status-pill ${item.status}`}>{statusLabel(item.status)}</span></td><td>{item.entrants} / {item.maxPlayers ?? '∞'}</td><td>{money(item.prizeCents, language)}</td><td><ArrowRight size={15} /></td></tr>)}</tbody></table></div></TranslationLayer>;
}

function TournamentCard({ tournament, onOpen }) {
  const language = useLanguage();
  return <TranslationLayer language={language}><button className="tournament-card" onClick={() => onOpen(tournament.id)} style={{ '--event-accent': tournament.accent }}><div className="card-top"><span className={`status-pill ${tournament.status}`}>{statusLabel(tournament.status)}</span><span className="card-date">{dateLabel(tournament.startsAt, false, language)}</span></div><div className="card-title-row"><span className="card-emblem"><Trophy size={21} /></span><div><h2>{tournament.name}</h2><span>{tournament.game}</span></div></div><p>{tournament.description}</p><div className="card-bottom"><span><Users size={15} /> {tournament.entrants} / {tournament.maxPlayers ?? '∞'}</span><span><Award size={15} /> {tournament.rated ? 'Ranked' : 'Casual'}</span><ArrowRight size={17} /></div></button></TranslationLayer>;
}

function MatchList({ matches, onReport, onSeriesScores, showTournament = false, playerLookup = {} }) {
  const language = useLanguage();
  if (!matches?.length) return <TranslationLayer language={language}><div className="empty-inline">Nincs megjeleníthető meccs.</div></TranslationLayer>;
  return <TranslationLayer language={language}><div className="match-list">{matches.map((match) => {
    const enrichedParticipants = (match.participants ?? []).map((player) => ({
      ...player,
      country: playerLookup[player.id]?.country ?? '',
      civilization: player.civilization || playerLookup[player.id]?.civilization || 'Unknown',
      eloDelta: player.eloAfter != null && player.eloBefore != null ? Number(player.eloAfter) - Number(player.eloBefore) : null,
    }));
    return <article className="match-row" key={match.id}><div className="match-date"><strong>{dateLabel(match.scheduledAt, true, language)}</strong><span className={match.status === 'live' ? 'live-text' : ''}>{match.status === 'live' ? 'ÉLŐ' : statusLabel(match.status)}</span></div><div className="match-main"><div className="match-meta"><span>{match.round}</span>{showTournament && <span>{match.tournament}</span>}<span>{matchSizeLabel(match)}</span></div><div className="match-players">{enrichedParticipants.map((player, index) => <span className="match-player" key={player.id}><span className="flag-chip">{flagFor(player.country)}</span><b>{player.handle}</b><small>{player.civilization}</small>{player.score !== null && <em>{player.score}</em>}{player.eloDelta != null && <span className={`elo-delta ${player.eloDelta >= 0 ? 'positive' : 'negative'}`}>{eloDeltaText(player.eloDelta)}</span>}{index < enrichedParticipants.length - 1 && <i>·</i>}</span>)}</div><span className="match-map"><Map size={13} /> {match.mapName} <small>· Bo{match.bestOf}</small></span></div><div className="match-action">{match.status === 'completed' ? <span className="result-label">VÉGEREDMÉNY</span> : <button className="icon-button report-button" onClick={() => onReport(match)} title="Eredmény rögzítése"><ArrowUpRight size={17} /></button>}</div><MatchGameDetails match={{ ...match, participants: enrichedParticipants }} onSeriesScores={(scores) => onSeriesScores?.(match.id, scores)} /></article>;
  })}</div></TranslationLayer>;
}

function PlayerList({ players, showSeed = false, showRank = false, showEvents = false }) {
  const language = useLanguage();
  if (!players?.length) return <TranslationLayer language={language}><div className="empty-inline">Még nincs játékos.</div></TranslationLayer>;
  return <TranslationLayer language={language}><div className="player-list">{players.map((player, index) => <div className="player-row" key={player.id}><span className="player-rank">{showRank ? String(index + 1).padStart(2, '0') : <span className="player-avatar" style={{ '--avatar-hue': (index * 47 + 18) % 360 }}>{player.handle?.slice(0, 1).toUpperCase()}</span>}</span><div className="player-name"><strong>{flagFor(player.country)} {player.handle}</strong><span>{player.country} · {player.civilization}</span></div>{showSeed && <span className="seed-label">#{player.seed}</span>}{showEvents && <span className="player-events">{translateText(language, `${player.events} torna`)}</span>}<span className="elo-value">{player.elo}<small> ELO</small></span></div>)}</div></TranslationLayer>;
}

export default App;
