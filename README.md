<div align="center">
  <h1>Multi-Agent</h1>
  <p>A Study Backend for Multi-Agent Systems, MCP, and Agentic Workflows</p>
</div>

## Environment Variables

| Variable             | Required | Description                       | Default                                               |
|----------------------|----------|-----------------------------------|-------------------------------------------------------|
| DATABASE_URL         | No       | SQL Database URL                  | postgres://admin:password@localhost:5432/backend_node |
| DATABASE_DIALECT     | No       | Database dialect                  | postgres                                              |
| GOOGLE_CLIENT_ID     | No       | Google OAuth client ID            |                                                       |
| GOOGLE_CLIENT_SECRET | No       | Google OAuth client secret        |                                                       |
| GOOGLE_CALLBACK_URL  | No       | Google OAuth callback URL         |                                                       |
| AUTH_REDIRECT_URL    | No       | Redirect URL after authentication |                                                       |
| JWT_SECRET           | Yes      | Secret for signing JWT tokens     |                                                       |
| OPENAI_API_KEY       | No       | API key for OpenAI-compatible agent runtimes |                                             |

## Running the Application

Prerequisite: Node.js `>= 18.18.0`.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables for PostgreSQL and JWT. Configure the Google variables only if you also want to keep the OAuth flow enabled.

   To invoke supervisors and subagents through LangChain/LangGraph, also configure `OPENAI_API_KEY` or set `llm_engine.config.api_key_env` to the environment variable that stores the provider key.

   > Or you can use a development PostgreSQL docker container with default values:

    ```bash
    docker run --name postgres-dev -e POSTGRES_DB=backend_node -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
    ```

3. Start the application:
    ```bash
    npm start
    ```

## WebSocket Chat (Supervisor)

Use `ws://localhost:3000/ws/chat` to chat in real-time with a supervisor thread.

- Authentication: send `Authorization: Bearer <jwt>` in the WebSocket handshake header.
- Fallback auth: `ws://localhost:3000/ws/chat?token=<jwt>`.
- Each message must target an existing thread created with `target_type = supervisor`.

Client event to send:

```json
{
  "type": "user_message",
  "thread_id": "<thread-id>",
  "content": "Quero planejar uma viagem para Lisboa"
}
```

Server events:

- `connected`: handshake/auth succeeded.
- `processing`: the message was accepted and supervisor execution started.
- `assistant_message`: final supervisor answer for the thread.
- `error`: validation/runtime/auth errors.

## Documentation

The API documentation is available at `/api-docs` when the application is running.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
