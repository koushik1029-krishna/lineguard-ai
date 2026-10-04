export function listApprovedDocuments(db) {
  return db
    .prepare(
      `
      SELECT id, document_code, title, equipment, category, doc_type, body, approved
      FROM documents
      WHERE approved = 1
      ORDER BY document_code
    `,
    )
    .all();
}

export function listAllDocuments(db) {
  return db
    .prepare(
      `
      SELECT id, document_code, title, equipment, category, doc_type, body, approved
      FROM documents
      ORDER BY document_code
    `,
    )
    .all();
}
