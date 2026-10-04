export function StatusBadge({ value }) {
  const tone = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${tone}`}>{value}</span>;
}
