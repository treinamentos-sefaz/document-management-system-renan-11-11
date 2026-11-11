# Especificação do Document Management System

> Esta especificação descreve o comportamento desejado para implementação futura. O seed atual ainda não implementa os fluxos de documentos: o backend expõe somente `GET /health` e o frontend é um placeholder.

## 1. Objetivo

Permitir que um usuário envie, consulte e baixe documentos, armazenados no filesystem local da aplicação, com metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos registrados durante a execução atual da aplicação.
- Download de um documento pelo identificador.
- Registro dos metadados `id`, `originalName`, `size`, `uploadedAt` e `owner`.
- Interface React para as operações de upload, listagem e download.

### Fora do escopo

- Armazenamento em nuvem ou em serviço externo.
- Banco de dados persistente para metadados.
- Versionamento, edição ou colaboração em documentos.
- Autenticação, autorização e isolamento de documentos entre usuários nesta fase de demonstração.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve aceitar o envio de um arquivo por `POST /upload`, usando `multipart/form-data`. | Uma requisição válida grava o arquivo em armazenamento local e retorna os metadados criados. |
| RF-02 | O sistema deve atribuir um identificador único a cada documento. | Dois uploads não sobrescrevem um ao outro e cada documento pode ser localizado pelo seu `id`. |
| RF-03 | O sistema deve registrar `originalName`, tamanho em bytes, data/hora de upload e `owner`. | A resposta do upload e a listagem contêm esses metadados, sem expor o caminho físico do arquivo. |
| RF-04 | O sistema deve listar documentos registrados por `GET /documents`. | A resposta contém uma coleção de metadados, sem conteúdo binário nem caminhos internos. |
| RF-05 | O sistema deve permitir baixar um documento por `GET /documents/:id/download`. | Para um documento existente, a resposta contém os bytes do arquivo como anexo com o nome original seguro. |
| RF-06 | O sistema deve informar erros de entrada, documento inexistente e falhas internas em formato consistente. | O cliente recebe um código HTTP apropriado e uma resposta JSON de erro, sem detalhes internos ou caminhos locais. |
| RF-07 | A interface deve permitir enviar, listar e iniciar o download de documentos usando a API. | As operações apresentam estado de carregamento e mensagem compreensível em caso de falha. |
| RF-08 | Nesta fase, a aplicação não deve exigir autenticação nem alegar isolamento por usuário. | `owner` é apenas metadado; sua origem/atribuição deve ser decidida antes da implementação do backend. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local em `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. Eles são perdidos ao reiniciar a aplicação; arquivos físicos podem permanecer no disco. |
| RNF-03 | A configuração operacional deve usar variáveis de ambiente quando aplicável, seguindo o princípio 12-Factor. |
| RNF-04 | O backend deve manter a separação `routes -> controllers -> services -> repositories`; camadas internas não devem depender de Express ou de detalhes HTTP. |
| RNF-05 | O nome físico do arquivo deve ser gerado pela aplicação. Nunca usar entrada do cliente como caminho de destino ou permitir que caminhos internos sejam retornados pela API. |
| RNF-06 | O frontend deve chamar a API com `fetch` pelo prefixo `/api`; o proxy de desenvolvimento Vite encaminha para o backend e remove esse prefixo. |
| RNF-07 | A aplicação deve validar entradas e tratar erros de upload, leitura, escrita e remoção, sem retornar stack traces ao cliente. |

## 5. Modelo de dados

O documento a seguir representa os metadados expostos pela API. O caminho e o nome físico usados para localizar o arquivo são detalhes internos do repositório e não fazem parte do DTO público.

| Campo | Tipo | Descrição e regra |
| --- | --- | --- |
| `id` | string | Identificador único e opaco do documento. Deve ser gerado pelo servidor. UUID é a recomendação inicial. |
| `originalName` | string | Nome original fornecido para o arquivo, tratado como dado não confiável e exibido/baixado de forma segura. |
| `size` | number | Tamanho do arquivo em bytes, inteiro não negativo. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601, normalizada para UTC. |
| `owner` | string | Identificador descritivo do dono. Nesta fase não autentica nem concede autorização; a fonte do valor precisa ser definida antes da implementação. |

A coleção em memória associa cada `id` aos metadados e à referência interna do arquivo em disco. A política para reconciliar arquivos que sobrevivam a um reinício sem metadados não faz parte desta fase; esses arquivos não devem aparecer na listagem nem ser baixáveis por ID.

## 6. Contratos de API

Os caminhos abaixo são os caminhos do backend. No frontend, as chamadas usam `/api` como prefixo de desenvolvimento; conforme a configuração atual do Vite, esse prefixo é removido antes de encaminhar a requisição ao backend.

### Formato comum de erro

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` deve ser estável para tratamento pelo cliente. `message` deve ser seguro para exibição. Erros internos, stack traces e caminhos do filesystem não devem ser incluídos.

### `POST /upload`

- **Content-Type:** `multipart/form-data`.
- **Campo do arquivo:** `file` (nome recomendado para o campo multipart).
- **Sucesso:** `201 Created`, corpo JSON com os metadados do documento criado.

```json
{
  "id": "<id gerado pelo servidor>",
  "originalName": "relatorio.pdf",
  "size": 2048,
  "uploadedAt": "2026-11-11T12:00:00.000Z",
  "owner": "<valor definido pela aplicação>"
}
```

- **Erros esperados:** `400 Bad Request` para arquivo ausente ou multipart inválido; `413 Payload Too Large` quando o limite configurado for excedido; `415 Unsupported Media Type` quando uma política de tipos permitidos vier a ser definida; `500 Internal Server Error` para falha inesperada de armazenamento.
- Em qualquer falha após a gravação parcial, a aplicação deve remover o arquivo incompleto quando possível e não registrar metadados para um upload que falhou.

### `GET /documents`

- **Sucesso:** `200 OK`, corpo JSON com a coleção de documentos registrados.

```json
{
  "documents": [
    {
      "id": "<id>",
      "originalName": "relatorio.pdf",
      "size": 2048,
      "uploadedAt": "2026-11-11T12:00:00.000Z",
      "owner": "<valor definido pela aplicação>"
    }
  ]
}
```

- A lista pode estar vazia. A resposta não contém bytes nem caminho físico dos arquivos.
- **Erro esperado:** `500 Internal Server Error` se não for possível concluir a operação.

### `GET /documents/:id/download`

- **Sucesso:** `200 OK`, corpo binário do arquivo.
- A resposta deve usar `Content-Disposition: attachment` com o nome original devidamente sanitizado/escapado. O tipo de conteúdo deve ser determinado com segurança; se não for possível, usar `application/octet-stream`.
- **Erros esperados:** `404 Not Found` se o ID não estiver registrado ou se o arquivo correspondente não existir; `500 Internal Server Error` para falha de leitura não classificada como ausência.
- A rota aceita somente o identificador, nunca um caminho de arquivo fornecido pelo cliente.

### Códigos e validações

| Situação | HTTP | Código sugerido |
| --- | --- | --- |
| Campo `file` ausente ou requisição multipart inválida | 400 | `INVALID_UPLOAD` |
| Documento não registrado ou arquivo correspondente ausente | 404 | `DOCUMENT_NOT_FOUND` |
| Arquivo excede o limite definido para a aplicação | 413 | `FILE_TOO_LARGE` |
| Tipo de arquivo não permitido, quando a política for definida | 415 | `UNSUPPORTED_FILE_TYPE` |
| Falha inesperada de filesystem ou aplicação | 500 | `INTERNAL_ERROR` |

Tamanho máximo, tipos MIME/extensões permitidos e política para arquivos vazios são decisões pendentes e devem ser definidos antes de implementar o upload. A validação de tipo não deve confiar exclusivamente no nome ou no `Content-Type` declarado pelo cliente.

## 7. Decisões arquiteturais

### Backend

- Node.js e Express, em CommonJS.
- `routes/` declara caminhos e encaminha para controllers.
- `controllers/` interpreta entrada HTTP, faz validações básicas e monta respostas.
- `services/` contém as regras de negócio de upload, listagem e download.
- `repositories/` mantém os metadados em memória e coordena as referências aos arquivos locais.
- Multer com `diskStorage` grava em `backend/storage`; nomes físicos são gerados no servidor.

### Frontend

- React com componentes funcionais e Hooks.
- Organização por `components/`, `pages/` e `services/`.
- Comunicação com backend via `fetch`, usando `/api` no ambiente de desenvolvimento.

### Armazenamento e ciclo de vida

- Não usar provedores externos nem banco de dados nesta fase.
- O filesystem contém o conteúdo; a memória do processo contém os metadados e a associação entre documento e arquivo.
- Reiniciar o processo perde o catálogo em memória. Não reconstruir o catálogo varrendo o diretório sem requisito explícito.

## 8. Decisões pendentes antes da implementação

1. Definir a origem e o valor atribuído a `owner` sem autenticação.
2. Definir tamanho máximo, tipos de arquivo aceitos e tratamento de arquivos vazios.
3. Confirmar se o nome multipart `file` será adotado como contrato definitivo.
4. Definir política operacional para arquivos órfãos que persistam após reinício ou falha.

As decisões pendentes não alteram a restrição de escopo: sem autenticação e isolamento entre usuários nesta fase; armazenamento somente local e metadados em memória.

## 9. Plano de execução futuro

Este plano descreve etapas posteriores para implementar o produto. Nesta atividade, somente este documento de especificação deve ser criado; não executar nem alterar arquivos de backend ou frontend.

1. Resolver as decisões pendentes desta especificação e registrar limites/configurações de upload.
2. Implementar repositório de metadados em memória e armazenamento local com Multer `diskStorage`, incluindo geração de ID/nome físico e tratamento de falhas.
3. Implementar services e controllers para upload, listagem e download, com validações e respostas de erro consistentes.
4. Registrar as rotas do backend e cobrir os contratos com testes de integração: sucesso, entrada inválida, ID inexistente e falhas de armazenamento.
5. Implementar no frontend os serviços `fetch` e a interface para upload, listagem, download, carregamento e erros.
6. Executar testes do backend e validação do frontend, revisar o fluxo ponta a ponta e atualizar a documentação operacional.

## 10. Critérios de aceite desta especificação

- Todas as seções do modelo em `docs/specs/spec-template.md` estão representadas.
- Os três endpoints previstos têm entrada, saída e erros descritos.
- O modelo de dados contém os cinco metadados previstos e não expõe caminhos locais.
- A Clean Architecture simples, o armazenamento local com Multer e os metadados em memória estão explícitos.
- O documento distingue requisitos futuros do seed atualmente implementado e deixa identificadas as decisões ainda pendentes.
- Nenhum arquivo de implementação de backend ou frontend é criado ou alterado nesta atividade.
