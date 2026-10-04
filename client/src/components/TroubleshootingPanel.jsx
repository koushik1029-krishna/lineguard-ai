import { useEffect, useState } from 'react';
import { getAssistantStatus, troubleshoot } from '../api.js';
import { ErrorNote, Loading } from './Feedback.jsx';

export default function TroubleshootingPanel({ incidentId }) {
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError('');
    setStatus(null);
    setStatusError('');
    getAssistantStatus(controller.signal)
      .then((payload) => setStatus(payload))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setStatusError(err.message);
      });
    return () => controller.abort();
  }, [incidentId]);

  async function ask() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = await troubleshoot(incidentId);
      if (payload.mode === 'live' && !payload.answer) {
        setError(payload.message || 'No troubleshooting answer was generated.');
      } else {
        setResult(payload);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const demo = status?.mode === 'demo' || result?.mode === 'demo';

  return (
    <section className="panel" aria-labelledby="assist-heading">
      <div className="panel-heading">
        <h2 id="assist-heading">Troubleshooting assistant</h2>
        {status ? <span className={demo ? 'mode-flag mode-demo' : 'mode-flag mode-live'}>{status.label}</span> : null}
      </div>

      {statusError ? <ErrorNote message={statusError} /> : null}

      {demo ? (
        <div className="demo-banner" role="status">
          <strong>Demo mode.</strong>
          <p>
            No API key is configured. LineGuard will not call a language model, and this panel will not
            show a made-up answer. A request only lists the approved maintenance documents that would be
            sent as context.
          </p>
        </div>
      ) : null}

      {status?.mode === 'live' ? (
        <p className="hint panel-note">
          Live requests stay on the server and use approved maintenance documents as context. Model:{' '}
          {status.model}.
        </p>
      ) : null}

      <button type="button" className="button" onClick={ask} disabled={loading || !incidentId}>
        {loading ? 'Checking the troubleshooting service…' : 'Ask for troubleshooting help'}
      </button>

      {loading ? <Loading label="Checking the troubleshooting service" /> : null}
      {error ? <ErrorNote message={error} onRetry={ask} /> : null}

      {result?.mode === 'demo' ? (
        <div className="assist-result" aria-live="polite">
          <div className="demo-banner">
            <strong>Demo mode.</strong>
            <p>{result.message}</p>
          </div>
          <DocumentContext documents={result.documents} />
        </div>
      ) : null}

      {result?.mode === 'live' && result.answer ? (
        <div className="assist-result" aria-live="polite">
          <article className="ai-answer">
            <p className="eyebrow">Live AI response</p>
            <div className="answer-body">{result.answer}</div>
          </article>
          <DocumentContext documents={result.documents} />
        </div>
      ) : null}
    </section>
  );
}

function DocumentContext({ documents }) {
  return (
    <div className="source-docs">
      <h3>Approved source documents</h3>
      <p className="hint">These are stored maintenance documents, not an AI answer.</p>
      {documents.length === 0 ? (
        <p>No approved maintenance document matched this incident.</p>
      ) : (
        documents.map((document) => (
          <details key={document.id}>
            <summary>
              {document.document_code} · {document.title}
            </summary>
            <p className="row-meta">
              {document.doc_type}
              {document.equipment ? ` · ${document.equipment}` : ''}
              {document.match_reasons?.length ? ` · ${document.match_reasons.join(' · ')}` : ''}
            </p>
            <p className="doc-label">Source document</p>
            <pre className="doc-body">{document.body}</pre>
          </details>
        ))
      )}
    </div>
  );
}
