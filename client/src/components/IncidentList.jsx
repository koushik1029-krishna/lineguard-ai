import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOptions, listIncidents } from '../api.js';
import { formatWhen, snippet } from '../format.js';
import { Empty, ErrorNote, Loading } from './Feedback.jsx';
import { StatusBadge } from './StatusBadge.jsx';

const EMPTY_FILTERS = {
  q: '',
  status: '',
  severity: '',
  production_line: '',
  category: '',
};

export default function IncidentList() {
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState('');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => ({ ...current, q: query.trim() }));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    getOptions(controller.signal)
      .then((data) => setOptions(data))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listIncidents(filters, controller.signal)
      .then((data) => {
        setPayload(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [filters, reloadKey]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Incident log</p>
          <h1>Search incidents</h1>
          <p className="lede">
            Look through open faults and resolved jobs by line, equipment, or the words in the write-up.
          </p>
        </div>
        <Link className="button" to="/incidents/new">
          Report incident
        </Link>
      </div>

      <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="field field-wide">
          <label htmlFor="incident-search">Search incidents</label>
          <input
            id="incident-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Equipment, description, or reporter"
            maxLength={120}
          />
        </div>
        <div className="field">
          <label htmlFor="filter-line">Production line</label>
          <select
            id="filter-line"
            name="production_line"
            value={filters.production_line}
            onChange={updateFilter}
          >
            <option value="">All lines</option>
            {options?.lines.map((line) => (
              <option key={line.name} value={line.name}>
                {line.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-category">Category</label>
          <select id="filter-category" name="category" value={filters.category} onChange={updateFilter}>
            <option value="">All categories</option>
            {options?.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-severity">Severity</label>
          <select id="filter-severity" name="severity" value={filters.severity} onChange={updateFilter}>
            <option value="">All severities</option>
            {options?.severities.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-status">Status</label>
          <select id="filter-status" name="status" value={filters.status} onChange={updateFilter}>
            <option value="">All statuses</option>
            {options?.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </form>

      {error ? <ErrorNote message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      {loading && !payload ? <Loading label="Loading incidents" /> : null}
      {loading && payload ? (
        <p className="result-count" role="status">
          Updating results…
        </p>
      ) : null}

      {!error && payload?.incidents.length === 0 ? (
        <Empty title={payload.total === 0 ? 'No incidents yet' : 'No incidents match'}>
          <p>
            {payload.total === 0
              ? 'Report the first fault or quality problem so the log has somewhere to start.'
              : 'Try a different word, or clear a filter. The sample log covers the mill, weld cell, test bay, and powder coat booth.'}
          </p>
        </Empty>
      ) : null}

      {!error && payload?.incidents.length > 0 ? (
        <section className="panel" aria-label="Incident results">
          <p className="result-count">
            {payload.incidents.length} shown
            {payload.incidents.length === payload.total ? '' : ` of ${payload.total}`}
          </p>
          <ul className="incident-list">
            {payload.incidents.map((incident) => (
              <li key={incident.id}>
                <Link to={`/incidents/${incident.id}`} className="incident-row">
                  <div>
                    <p className="row-title">{incident.equipment}</p>
                    <p className="row-meta">
                      {incident.production_line} · {incident.category} · {formatWhen(incident.occurred_at)} ·{' '}
                      {incident.reported_by}
                    </p>
                    <p className="row-copy">{snippet(incident.description)}</p>
                  </div>
                  <div className="row-badges">
                    <StatusBadge value={incident.severity} />
                    <StatusBadge value={incident.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
