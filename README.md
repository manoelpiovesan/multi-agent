<div align="center">
  <h1>Simple TSOA Backend</h1>
  <p>A Node.js backend application with JWT authentication, optional Google OAuth and PostgreSQL integration.</p>
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

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables for PostgreSQL and JWT. Configure the Google variables only if you also want to keep the OAuth flow enabled.

   > Or you can use a development PostgreSQL docker container with default values:

    ```bash
    docker run --name postgres-dev -e POSTGRES_DB=backend_node -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
    ```

3. Start the application:
    ```bash
    npm start
    ```

## Documentation

The API documentation is available at `/api-docs` when the application is running.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
