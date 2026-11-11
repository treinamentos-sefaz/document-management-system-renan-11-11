import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';
import { formatFileSize } from '../utils/documentFormatters.js';

export default function UploadComponent({ onUploadComplete }) {
  const fileInput = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function selectFile(file) {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setMessage('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');

    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      if (fileInput.current) {
        fileInput.current.value = '';
      }
      setMessage('Arquivo enviado.');
      onUploadComplete();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div
        className={`drop-zone${isDragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <p className="drop-title">Arraste um arquivo para cá</p>
        <span className="drop-caption">ou selecione no seu dispositivo</span>
        <input
          ref={fileInput}
          id="document-file"
          className="visually-hidden"
          type="file"
          onChange={(event) => selectFile(event.target.files[0])}
        />
        <label className="file-picker" htmlFor="document-file">Selecionar arquivo</label>
      </div>

      {selectedFile && (
        <div className="selected-file" aria-live="polite">
          <span className="file-mark" aria-hidden="true">DOC</span>
          <span className="selected-file-details">
            <strong title={selectedFile.name}>{selectedFile.name}</strong>
            <small>{formatFileSize(selectedFile.size)}</small>
          </span>
          <button
            className="remove-file"
            type="button"
            aria-label="Remover arquivo selecionado"
            title="Remover arquivo"
            onClick={() => {
              setSelectedFile(null);
              if (fileInput.current) {
                fileInput.current.value = '';
              }
            }}
            disabled={isUploading}
          >
            ×
          </button>
        </div>
      )}

      <button className="upload-submit" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
        {!isUploading && <span aria-hidden="true">↗</span>}
      </button>

      <p className="upload-limit">Máximo padrão: 10 MiB por arquivo</p>
      {message && <p className="form-message success-message" role="status">{message}</p>}
      {error && <p className="form-message error-message" role="alert">{error}</p>}
    </form>
  );
}