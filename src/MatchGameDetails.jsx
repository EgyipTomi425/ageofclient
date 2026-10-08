import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react';
import { apiRequest } from './api.js';
import { CIV_FLAGS, MAP_ART } from './gameAssets.js';
import { TranslationLayer, useLanguage } from './i18n.js';

function CivPick({ participant }) {
  const flag = CIV_FLAGS[participant.civilization];
  return <div className="game-player-pick">
    {flag ? <img className="civ-flag" src={flag} alt="" loading="lazy" decoding="async" /> : <span className="civ-flag-fallback" aria-hidden="true">{participant.civilization.slice(0, 2).toUpperCase()}</span>}
    <strong>{participant.handle}</strong><span>{participant.civilization}</span><b>{participant.score}</b>
  </div>;
}

export default function MatchGameDetails({ match, onSeriesScores }) {
  const language = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [games, setGames] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadGames() {
    setLoading(true);
    setError('');
    try {
      setGames(await apiRequest(`/matches/${match.id}/games`));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDetails() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (games !== null || loading) return;
    await loadGames();
  }

  async function addGame(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const participants = match.participants.map((player) => ({
      playerId: Number(player.id),
      civilization: form.get(`civ-${player.id}`),
      score: Number(form.get(`score-${player.id}`)),
    }));
    try {
      const saved = await apiRequest(`/matches/${match.id}/games`, {
        method: 'POST',
        body: JSON.stringify({
          gameNumber: Math.max(0, ...(games ?? []).map((game) => game.gameNumber)) + 1,
          mapName: form.get('mapName'),
          participants,
        }),
      });
      onSeriesScores?.(saved.seriesScores ?? []);
      await loadGames();
      formElement.reset();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="match-detail-area">
    <TranslationLayer language={language}>
    <button className="text-button game-details-toggle" type="button" onClick={toggleDetails} aria-expanded={expanded}>
      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      {expanded ? 'Játszmák elrejtése' : `Játszmák és civ választások${games?.length ? ` · ${games.length}` : ''}`}
    </button>
    {expanded && <div className="match-games-detail">
      {loading && <div className="loading-inline"><span className="spinner" /> Játszmák betöltése</div>}
      {error && <div className="game-log-error" role="alert">{error}<button className="icon-button" type="button" onClick={loadGames} aria-label="Újrapróbálás"><RefreshCw size={14} /></button></div>}
      {!loading && !error && games?.length === 0 && <div className="empty-inline">Ehhez a meccshez még nincs rögzített játszma.</div>}
      {!!games?.length && <div className="game-log-grid">{games.map((game) => <article className="game-log-card" key={game.id}>
        {MAP_ART[game.mapName] ? <img className="game-map-art" src={MAP_ART[game.mapName]} alt={`${game.mapName} minimap`} loading="lazy" decoding="async" /> : <div className="game-map-placeholder"><span>{game.mapName}</span></div>}
        <div className="game-log-content"><span className="eyebrow">Játszma {game.gameNumber}</span><h3>{game.mapName}</h3><div className="game-player-picks">{game.participants.map((participant) => <CivPick key={participant.id} participant={participant} />)}</div></div>
      </article>)}</div>}
      {match.status !== 'completed' && match.participants?.length >= 2 && <form className="game-entry-form" onSubmit={addGame}>
        <div className="game-entry-heading"><div><span className="eyebrow">Új mintajátszma</span><h3>Map és civ választások</h3></div><span className="subtle-tag">{(games?.length ?? 0) + 1}. játszma</span></div>
        <label>Map<input name="mapName" required maxLength="120" placeholder="pl. Great Plains" /></label>
        <div className="game-entry-participants">{match.participants.map((player) => <div className="game-entry-player" key={player.id}>
          <strong>{player.handle}</strong>
          <label>Civilizáció<input name={`civ-${player.id}`} required maxLength="120" defaultValue={player.civilization} /></label>
          <label>Pont<input name={`score-${player.id}`} type="number" min="0" max="99" required defaultValue="0" /></label>
        </div>)}</div>
        <button className="button button-secondary" disabled={saving}><Plus size={15} />{saving ? 'Mentés…' : 'Játszma rögzítése'}</button>
      </form>}
    </div>}
    </TranslationLayer>
  </div>;
}
