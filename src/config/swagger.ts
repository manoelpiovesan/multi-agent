import express from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

export function configureSwagger(app: express.Application) {
  app.use('/api-docs', swaggerUi.serve);

  const swaggerPath = path.join(__dirname, '../../../build/swagger.json');

  app.get('/api-docs', swaggerUi.setup(
    require(swaggerPath),
    {
      swaggerOptions: {
        url: '/swagger.json',
        persistAuthorization: true,
        displayRequestDuration: true
      },
    }
  ));
}
