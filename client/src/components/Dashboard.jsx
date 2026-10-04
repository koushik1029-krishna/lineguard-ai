import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api.js';
import { formatWhen, snippet } from '../format.js';
import { Empty, ErrorNote, Loading } from './Feedback.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getDashboard(controller.signal)
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  if (loading) return <Loading label="Loading the dashboard" />;
  if (error) return <ErrorNote message={error} onRetry={() => setReloadKey((value) => value + 1)} />;

  const cards = [
    ['Open', data.counts.open],
    ['In progress', data.counts.in_progress],
    ['Resolved', data.counts.resolved],
    ['Critical, still open', data.counts.critical_open],
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Shop floor</p>
          <h1>Incident dashboard</h1>
          <p className="lede">
            Northline Fabrication builds stainless process skids. LineGuard keeps fault and quality
            records in one place so technicians can find what already worked.
          </p>
        </div>
        <Link className="button" to="/incidents/new">
          Report incident
        </Link>
      </div>

      <section aria-label="Incident counts" className="stat-grid">
        {cards.map(([label, value]) => (
          <article key={label} className="stat-card">
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <p className="total-line">{data.counts.total} incidents in the log</p>

      <section className="panel" aria-labelledby="recent-heading">
        <div className="panel-heading">
          <h2 id="recent-heading">Recent incidents</h2>
          <Link to="/incidents">View all</Link>
        </div>
        {data.recent.length === 0 ? (
          <Empty title="No incidents yet">
            <p>Report the first fault or quality problem so the log has somewhere to start.</p>
          </Empty>
        ) : (
          <ul className="incident-list">
            {data.recent.map((incident) => (
              <li key={incident.id}>
                <Link to={`/incidents/${incident.id}`} className="incident-row">
                  <div>
                    <p className="row-title">{incident.equipment}</p>
                    <p className="row-meta">
                      {incident.production_line} · {incident.category} · {formatWhen(incident.occurred_at)}
                    </p>
                    <p className="row-copy">{snippet(incident.description, 140)}</p>
                  </div>
                  <div className="row-badges">
                    <StatusBadge value={incident.severity} />
                    <StatusBadge value={incident.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
