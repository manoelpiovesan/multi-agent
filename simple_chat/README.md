# Simple Chat (HTML/CSS/JS)

Mini cliente web para conversar com um supervisor via WebSocket (`/ws/chat`).

## Arquivos

- `index.html`
- `style.css`
- `app.js`

## Como usar

1. Rode sua API normalmente (porta padrao: `3000`).
2. Abra o chat localmente com um servidor estatico.
3. Preencha `Server URL` (ex: `http://localhost:3000`).
4. Faça login com email/password para obter `access_token`.
5. Clique em `Connect WS`.
6. Envie uma mensagem mesmo sem `Thread ID`: o backend cria a thread automaticamente.

## Comportamento automatico

- Se `thread_id` vier vazio no evento `user_message`, o backend cria uma thread de supervisor para o usuario.
- Voce pode informar `supervisor_id` no front para escolher o alvo da primeira mensagem.
- Se nao informar, o backend usa o supervisor generico (quando existir) ou o primeiro supervisor habilitado.
- O `thread_id` retornado no evento `processing` e salvo automaticamente no front.

## Bootstrap de supervisor generico

No startup da API, se nao existir nenhum supervisor, o backend tenta criar `Generic Supervisor` automaticamente.
Isso depende de existir ao menos um `llm_engine` habilitado.

## Importante sobre CORS

Nao abra o `index.html` com `file://...` no navegador. Isso gera `origin: null` e costuma quebrar preflight em APIs.
Sempre sirva a pasta por HTTP local.

## Servir o front simples

Exemplo com Python:

```bash
cd simple_chat
python3 -m http.server 8081
```

Depois abra `http://localhost:8081`.

## CORS no backend

O backend agora aceita origens locais comuns por padrao (`localhost`/`127.0.0.1` em `8080`, `8081`, `5173`).
Se quiser customizar, configure a variavel `CORS_ORIGINS` com lista separada por virgula:

```bash
CORS_ORIGINS=http://localhost:8081,http://localhost:3001
```

## Contrato usado

### Login HTTP

- `POST /api/v1/auth/login`
- Body JSON:

```json
{
  "email": "user@example.com",
  "password": "sua_senha"
}
```

### Criar thread via HTTP (opcional)

- `POST /api/v1/threads`
- Header: `Authorization: Bearer <access_token>`
- Body JSON:

```json
{
  "supervisor_id": "<uuid>"
}
```

### WebSocket

- URL: `ws://<host>/ws/chat?token=<access_token>`
- Mensagem enviada com thread existente:

```json
{
  "type": "user_message",
  "thread_id": "<uuid-thread>",
  "content": "Ola supervisor"
}
```

- Mensagem enviada sem thread (criacao automatica):

```json
{
  "type": "user_message",
  "content": "Ola supervisor"
}
```

- Opcional para escolher supervisor na primeira mensagem:

```json
{
  "type": "user_message",
  "supervisor_id": "<uuid-supervisor>",
  "content": "Ola supervisor"
}
```

- Eventos recebidos: `connected`, `processing`, `assistant_message`, `error`.
