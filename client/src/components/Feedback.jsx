export function Loading({ label }) {
  return (
    <div className="state state-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="state state-empty">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function ErrorNote({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <h2>Something went wrong</h2>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Success({ message }) {
  return (
    <p className="state state-success" role="status">
      {message}
    </p>
  );
}
