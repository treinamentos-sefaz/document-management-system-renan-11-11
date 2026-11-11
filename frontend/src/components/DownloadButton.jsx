import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ documentRecord }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    try {
      await downloadDocument(documentRecord);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <span className="download-control">
      <button
        className="download-button"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`Baixar ${documentRecord.originalName}`}
        title={error || `Baixar ${documentRecord.originalName}`}
      >
        <span aria-hidden="true">{isDownloading ? '...' : '↓'}</span>
        <span className="download-label">{isDownloading ? 'Baixando' : 'Baixar'}</span>
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </span>
  );
}