import { useEffect, useState } from 'react';
import { listDocuments } from './services/documentApi.js';
import { formatFileSize } from './utils/documentFormatters.js';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;

    setIsLoading(true);
    setLoadError('');

    listDocuments()
      .then((loadedDocuments) => {
        if (isCurrentRequest) {
          setDocuments(loadedDocuments);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [refreshVersion]);

  function handleUploadComplete() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DMS<span className="brand-divider">/</span>ARQUIVO</span>
        </a>
        <div className="topbar-status">
          <span className="status-dot" />
          Armazenamento local
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">ESPAÇO DE TRABALHO <span>/</span> DOCUMENTOS</p>
          <h1>Seus documentos.</h1>
        </div>
        <p className="heading-note">Organizados em um só lugar.</p>
      </section>

      <section className="overview" aria-label="Resumo dos documentos">
        <div className="overview-item">
          <span className="overview-label">Documentos</span>
          <strong>{isLoading ? '—' : documents.length.toString().padStart(2, '0')}</strong>
        </div>
        <div className="overview-item">
          <span className="overview-label">Espaço catalogado</span>
          <strong>
            {isLoading ? '—' : formatFileSize(documents.reduce((total, document) => total + document.size, 0))}
          </strong>
        </div>
        <div className="overview-item overview-caption">
          <span className="overview-label">Catálogo</span>
          <strong>Ativo nesta sessão</strong>
        </div>
      </section>

      <div className="workspace">
        <aside className="upload-panel">
          <div className="section-heading">
            <span className="section-index">01</span>
            <h2>Adicionar arquivo</h2>
          </div>
          <UploadComponent onUploadComplete={handleUploadComplete} />
        </aside>

        <section className="documents-panel" aria-labelledby="documents-title">
          <div className="section-heading documents-heading">
            <div className="section-title-group">
              <span className="section-index">02</span>
              <h2 id="documents-title">Todos os documentos</h2>
            </div>
            {!isLoading && <span className="document-count">{documents.length} itens</span>}
          </div>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={loadError}
          />
        </section>
      </div>

      <footer className="page-footer">
        <span>DMS <span className="footer-separator">/</span> GESTÃO DE DOCUMENTOS</span>
        <span>Metadados disponíveis durante esta sessão</span>
      </footer>
    </main>
  );
}
