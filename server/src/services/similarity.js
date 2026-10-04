const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'is', 'was',
  'be', 'at', 'by', 'from', 'that', 'this', 'it', 'as', 'are', 'were', 'after', 'before',
  'into', 'then', 'than', 'not', 'has', 'had', 'have', 'its', 'but', 'out',
]);

export function tokens(text) {
  return [
    ...new Set(
      String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
    ),
  ];
}

export function scoreIncident(source, candidate) {
  let score = 0;
  const reasons = [];

  if (source.equipment === candidate.equipment) {
    score += 45;
    reasons.push('Same equipment');
  }
  if (source.category === candidate.category) {
    score += 20;
    reasons.push('Same issue category');
  }
  if (source.production_line === candidate.production_line) {
    score += 10;
    reasons.push('Same production line');
  }
  if (candidate.resolution_notes) {
    reasons.push('Has resolution notes');
  }

  const sourceTokens = new Set(tokens(`${source.description} ${source.resolution_notes || ''}`));
  const candidateTokens = new Set(
    tokens(`${candidate.description} ${candidate.resolution_notes || ''}`),
  );
  const shared = [...sourceTokens].filter((word) => candidateTokens.has(word));
  const union = sourceTokens.size + candidateTokens.size - shared.length;
  if (union > 0) {
    score += Math.round((shared.length / union) * 20);
  }
  if (shared.length > 0) {
    reasons.push(`Shared terms: ${shared.slice(0, 4).join(', ')}`);
  }

  return { score: Math.min(100, score), reasons };
}

export function findSimilar(source, candidates, limit = 5) {
  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => {
      const match = scoreIncident(source, candidate);
      return { incident: candidate, score: match.score, reasons: match.reasons };
    })
    .filter((match) => match.score >= 40)
    .sort((a, b) => b.score - a.score || b.incident.id - a.incident.id)
    .slice(0, limit);
}

export function scoreDocument(incident, document) {
  let score = 0;
  const reasons = [];

  if (document.equipment && document.equipment === incident.equipment) {
    score += 50;
    reasons.push('Same equipment');
  }
  if (document.category && document.category === incident.category) {
    score += 25;
    reasons.push('Same issue category');
  }

  const incidentTokens = new Set(tokens(`${incident.description} ${incident.equipment}`));
  const documentTokens = new Set(tokens(`${document.title} ${document.body}`));
  const shared = [...incidentTokens].filter((word) => documentTokens.has(word));
  const union = incidentTokens.size + documentTokens.size - shared.length;
  if (union > 0) {
    score += Math.round((shared.length / union) * 25);
  }
  if (shared.length > 0) {
    reasons.push(`Shared terms: ${shared.slice(0, 4).join(', ')}`);
  }

  return { score: Math.min(100, score), reasons };
}

export function selectDocuments(incident, documents, limit = 3) {
  return documents
    .filter((document) => document.approved === 1)
    .map((document) => {
      const match = scoreDocument(incident, document);
      return { ...document, score: match.score, match_reasons: match.reasons };
    })
    .filter((document) => document.score >= 40)
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, limit);
}
