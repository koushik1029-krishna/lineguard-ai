import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident, getOptions } from '../api.js';
import { toDatetimeLocalValue, validateIncident } from '../validation.js';
import { ErrorNote, Loading } from './Feedback.jsx';

const EMPTY_FORM = {
  production_line: '',
  equipment: '',
  category: '',
  severity: '',
  description: '',
  occurred_at: toDatetimeLocalValue(new Date()),
  reported_by: '',
};

export default function IncidentForm() {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const summaryRef = useRef(null);
  const focusSummary = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError('');
    getOptions(controller.signal)
      .then((data) => setOptions(data))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setLoadError(err.message);
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (!focusSummary.current || !summaryRef.current) return;
    summaryRef.current.focus();
    focusSummary.current = false;
  });

  const equipment =
    options?.lines.find((line) => line.name === form.production_line)?.equipment || [];

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'production_line') {
        const allowed = options?.lines.find((line) => line.name === value)?.equipment || [];
        if (!allowed.includes(current.equipment)) next.equipment = '';
      }
      return next;
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validateIncident(form, options?.lines || []);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) {
      focusSummary.current = true;
      return;
    }

    setSaving(true);
    try {
      const result = await createIncident({
        ...form,
        occurred_at: new Date(form.occurred_at).toISOString(),
      });
      navigate(`/incidents/${result.incident.id}`, { state: { created: true } });
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
        focusSummary.current = true;
      } else setFormError(err.message);
      setSaving(false);
    }
  }

  if (loadError && !options) {
    return <ErrorNote message={loadError} onRetry={() => setReloadKey((value) => value + 1)} />;
  }
  if (!options) return <Loading label="Loading the incident form" />;

  const errorEntries = Object.entries(errors);

  return (
    <div className="page page-narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">New record</p>
          <h1>Report an incident</h1>
          <p className="lede">
            Write down the line, the equipment, and what the operator saw. New reports start as open.
          </p>
        </div>
      </div>

      <form className="stack-form" onSubmit={onSubmit} noValidate>
        {formError ? <ErrorNote message={formError} /> : null}
        {errorEntries.length > 0 ? (
          <div className="form-error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
            <p>Fix the following before saving:</p>
            <ul>
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <a href={`#${field}`}>{message}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="production_line">Production line</label>
            <select
              id="production_line"
              name="production_line"
              value={form.production_line}
              onChange={updateField}
              aria-required="true"
              aria-invalid={errors.production_line ? 'true' : 'false'}
              aria-describedby={errors.production_line ? 'production_line-error' : undefined}
            >
              <option value="">Choose a line</option>
              {options.lines.map((line) => (
                <option key={line.name} value={line.name}>
                  {line.name}
                </option>
              ))}
            </select>
            {errors.production_line ? (
              <p id="production_line-error" className="field-error">
                {errors.production_line}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="equipment">Equipment</label>
            <select
              id="equipment"
              name="equipment"
              value={form.equipment}
              onChange={updateField}
              aria-required="true"
              aria-invalid={errors.equipment ? 'true' : 'false'}
              aria-describedby={errors.equipment ? 'equipment-error' : 'equipment-hint'}
              disabled={!form.production_line}
            >
              <option value="">{form.production_line ? 'Choose equipment' : 'Choose a line first'}</option>
              {equipment.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <p id="equipment-hint" className="hint">
              Equipment is limited to the assets on the selected line.
            </p>
            {errors.equipment ? (
              <p id="equipment-error" className="field-error">
                {errors.equipment}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="category">Issue category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={updateField}
              aria-required="true"
              aria-invalid={errors.category ? 'true' : 'false'}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value="">Choose a category</option>
              {options.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category ? (
              <p id="category-error" className="field-error">
                {errors.category}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="severity">Severity</label>
            <select
              id="severity"
              name="severity"
              value={form.severity}
              onChange={updateField}
              aria-required="true"
              aria-invalid={errors.severity ? 'true' : 'false'}
              aria-describedby={errors.severity ? 'severity-error' : undefined}
            >
              <option value="">Choose a severity</option>
              {options.severities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
            {errors.severity ? (
              <p id="severity-error" className="field-error">
                {errors.severity}
              </p>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label htmlFor="occurred_at">When it happened</label>
          <input
            id="occurred_at"
            name="occurred_at"
            type="datetime-local"
            value={form.occurred_at}
            onChange={updateField}
            aria-required="true"
            aria-invalid={errors.occurred_at ? 'true' : 'false'}
            aria-describedby={errors.occurred_at ? 'occurred_at-error' : undefined}
          />
          {errors.occurred_at ? (
            <p id="occurred_at-error" className="field-error">
              {errors.occurred_at}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows="6"
            maxLength="2000"
            value={form.description}
            onChange={updateField}
            aria-required="true"
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={errors.description ? 'description-error description-hint' : 'description-hint'}
          />
          <p id="description-hint" className="hint">
            What happened, what the operator saw, and what they already tried. At least 20 characters.
          </p>
          {errors.description ? (
            <p id="description-error" className="field-error">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="reported_by">Reported by</label>
          <input
            id="reported_by"
            name="reported_by"
            type="text"
            autoComplete="name"
            maxLength="80"
            value={form.reported_by}
            onChange={updateField}
            aria-required="true"
            aria-invalid={errors.reported_by ? 'true' : 'false'}
            aria-describedby={errors.reported_by ? 'reported_by-error' : undefined}
          />
          {errors.reported_by ? (
            <p id="reported_by-error" className="field-error">
              {errors.reported_by}
            </p>
          ) : null}
        </div>

        <div className="form-actions">
          <button type="submit" className="button" disabled={saving} aria-busy={saving}>
            {saving ? 'Saving incident…' : 'Save incident'}
          </button>
        </div>
      </form>
    </div>
  );
}
