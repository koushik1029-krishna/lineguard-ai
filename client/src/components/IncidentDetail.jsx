import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getIncident, getOptions, getSimilar, updateIncident } from '../api.js';
import { formatWhen } from '../format.js';
import { validateResolution } from '../validation.js';
import { ErrorNote, Loading, Success } from './Feedback.jsx';
import SimilarIncidents from './SimilarIncidents.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import TroubleshootingPanel from './TroubleshootingPanel.jsx';

export default function IncidentDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [incident, setIncident] = useState(null);
  const [options, setOptions] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [similarError, setSimilarError] = useState('');
  const [similarLoading, setSimilarLoading] = useState(true);
  const [status, setStatus] = useState('Open');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState(location.state?.created ? 'Incident saved. It is open and ready for a technician.' : '');
  const [saving, setSaving] = useState(false);
  const summaryRef = useRef(null);
  const focusSummary = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSimilarLoading(true);
    setError('');
    setNotFound(false);
    setSimilarError('');
    setSuccess(
      location.state?.created ? 'Incident saved. It is open and ready for a technician.' : '',
    );

    Promise.all([
      getIncident(id, controller.signal),
      getSimilar(id, controller.signal),
      getOptions(controller.signal),
    ])
      .then(([incidentBody, similarBody, optionsBody]) => {
        setIncident(incidentBody.incident);
        setStatus(incidentBody.incident.status);
        setNotes(incidentBody.incident.resolution_notes || '');
        setSimilar(similarBody.results);
        setOptions(optionsBody);
        setLoading(false);
        setSimilarLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.status === 404) {
          setNotFound(true);
          setLoading(false);
          setSimilarLoading(false);
          return;
        }
        setError(err.message);
        setLoading(false);
        setSimilarLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadKey, location.state]);

  useEffect(() => {
    if (!focusSummary.current || !summaryRef.current) return;
    summaryRef.current.focus();
    focusSummary.current = false;
  });

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validateResolution({ status, resolution_notes: notes });
    setFieldErrors(nextErrors);
    setSaveError('');
    setSuccess('');
    if (Object.keys(nextErrors).length > 0) {
      focusSummary.current = true;
      return;
    }

    setSaving(true);
    try {
      const body = await updateIncident(id, { status, resolution_notes: notes });
      setIncident(body.incident);
      setStatus(body.incident.status);
      setNotes(body.incident.resolution_notes || '');
      const similarBody = await getSimilar(id);
      setSimilar(similarBody.results);
      setSuccess(body.incident.status === 'Resolved' ? 'Incident marked resolved.' : 'Resolution saved.');
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
        focusSummary.current = true;
      }
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading the incident" />;
  if (notFound) {
    return (
      <ErrorNote message="No incident exists with that id." />
    );
  }
  if (error || !incident) {
    return <ErrorNote message={error || 'The incident could not be loaded.'} onRetry={() => setReloadKey((value) => value + 1)} />;
  }

  return (
    <div className="page">
      <p className="back-link">
        <Link to="/incidents">Back to incidents</Link>
      </p>
      {success ? <Success message={success} /> : null}
      <div className="page-heading">
        <div>
          <p className="eyebrow">{incident.production_line}</p>
          <h1>{incident.equipment}</h1>
          <p className="lede">
            {incident.category} · reported by {incident.reported_by} · {formatWhen(incident.occurred_at)}
          </p>
        </div>
        <div className="row-badges">
          <StatusBadge value={incident.severity} />
          <StatusBadge value={incident.status} />
        </div>
      </div>

      <section className="panel">
        <h2>What happened</h2>
        <p className="prose">{incident.description}</p>
        {incident.resolution_notes ? (
          <>
            <h2>Resolution notes</h2>
            <p className="prose">{incident.resolution_notes}</p>
            {incident.resolved_at ? <p className="hint">Resolved {formatWhen(incident.resolved_at)}.</p> : null}
          </>
        ) : null}
      </section>

      <section className="panel" aria-labelledby="resolution-heading">
        <h2 id="resolution-heading">Update status</h2>
        <form className="stack-form" onSubmit={onSubmit} noValidate>
          {saveError ? <ErrorNote message={saveError} /> : null}
          {Object.keys(fieldErrors).length > 0 ? (
            <div className="form-error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
              <p>Fix the following before saving:</p>
              <ul>
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${field}`}>{message}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-invalid={fieldErrors.status ? 'true' : 'false'}
                aria-describedby={fieldErrors.status ? 'status-error' : undefined}
              >
                {(options?.statuses || ['Open', 'In Progress', 'Resolved']).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {fieldErrors.status ? (
                <p id="status-error" className="field-error">
                  {fieldErrors.status}
                </p>
              ) : null}
            </div>
          </div>
          <div className="field">
            <label htmlFor="resolution_notes">Resolution notes</label>
            <textarea
              id="resolution_notes"
              name="resolution_notes"
              rows="5"
              maxLength="2000"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              aria-required={status === 'Resolved' ? 'true' : 'false'}
              aria-invalid={fieldErrors.resolution_notes ? 'true' : 'false'}
              aria-describedby={
                fieldErrors.resolution_notes ? 'resolution_notes-error resolution-hint' : 'resolution-hint'
              }
            />
            <p id="resolution-hint" className="hint">
              Required when the status is Resolved. Say what was checked, replaced, or retested.
            </p>
            {fieldErrors.resolution_notes ? (
              <p id="resolution_notes-error" className="field-error">
                {fieldErrors.resolution_notes}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button" disabled={saving}>
            {saving ? 'Saving resolution…' : 'Save resolution'}
          </button>
        </form>
      </section>

      <SimilarIncidents
        results={similar}
        loading={similarLoading}
        error={similarError}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
      <TroubleshootingPanel key={incident.updated_at} incidentId={incident.id} />
    </div>
  );
}
