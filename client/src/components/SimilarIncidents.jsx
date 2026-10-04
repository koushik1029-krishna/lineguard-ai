import { Link } from 'react-router-dom';
import { formatWhen, snippet } from '../format.js';
import { Empty, ErrorNote, Loading } from './Feedback.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export default function SimilarIncidents({ results, loading, error, onRetry }) {
  return (
    <section className="panel" aria-labelledby="similar-heading">
      <div className="panel-heading">
        <h2 id="similar-heading">Similar incidents</h2>
      </div>
      <p className="hint panel-note">
        Matches come from stored incidents using equipment, category, line, and shared wording. This
        list is not an AI ranking.
      </p>
      {loading ? <Loading label="Looking for similar incidents" /> : null}
      {error ? <ErrorNote message={error} onRetry={onRetry} /> : null}
      {!loading && !error && results.length === 0 ? (
        <Empty title="No close matches">
          <p>No stored incident is close enough to suggest yet.</p>
        </Empty>
      ) : null}
      {!loading && !error && results.length > 0 ? (
        <ul className="incident-list">
          {results.map((result) => (
            <li key={result.incident.id}>
              <Link to={`/incidents/${result.incident.id}`} className="incident-row">
                <div>
                  <p className="row-title">
                    {result.incident.equipment}{' '}
                    <span className="score">{result.score}% match</span>
                  </p>
                  <p className="row-meta">
                    {result.incident.production_line} · {formatWhen(result.incident.occurred_at)}
                  </p>
                  <p className="row-copy">{snippet(result.incident.description, 140)}</p>
                  {result.incident.resolution_notes ? (
                    <p className="row-copy">
                      <strong>Resolution: </strong>
                      {snippet(result.incident.resolution_notes, 180)}
                    </p>
                  ) : null}
                  <ul className="reason-list">
                    {result.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <div className="row-badges">
                  <StatusBadge value={result.incident.severity} />
                  <StatusBadge value={result.incident.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
