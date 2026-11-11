import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/documentFormatters.js';

function formatDate(dateString) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

export default function DocumentList({ documents, isLoading, error }) {
  if (isLoading) {
    return <p className="list-state">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-state list-error" role="alert">
        <p>{error}</p>
        <span>Verifique se o servidor está disponível.</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">0</span>
        <p>Nenhum documento nesta sessão.</p>
      </div>
    );
  }

  return (
    <div className="document-table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((documentRecord) => (
            <tr key={documentRecord.id}>
              <td className="document-name-cell">
                <span className="file-mark" aria-hidden="true">DOC</span>
                <span className="document-name" title={documentRecord.originalName}>
                  {documentRecord.originalName}
                </span>
              </td>
              <td className="muted-cell">{formatFileSize(documentRecord.size)}</td>
              <td className="muted-cell">{formatDate(documentRecord.uploadedAt)}</td>
              <td className="action-cell">
                <DownloadButton documentRecord={documentRecord} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}