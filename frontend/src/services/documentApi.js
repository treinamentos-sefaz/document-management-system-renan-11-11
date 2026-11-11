const API_PREFIX = '/api';

async function responseError(response) {
  try {
    const payload = await response.json();
    return payload?.error?.message || 'Não foi possível concluir a operação.';
  } catch {
    return 'Não foi possível concluir a operação.';
  }
}

export async function listDocuments() {
  const response = await fetch(`${API_PREFIX}/documents`);
  if (!response.ok) {
    throw new Error(await responseError(response));
  }

  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await responseError(response));
  }

  return response.json();
}

export async function downloadDocument(documentRecord) {
  const response = await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(documentRecord.id)}/download`,
  );

  if (!response.ok) {
    throw new Error(await responseError(response));
  }

  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  const downloadLink = window.document.createElement('a');
  downloadLink.href = objectUrl;
  downloadLink.download = documentRecord.originalName;
  downloadLink.hidden = true;
  window.document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}