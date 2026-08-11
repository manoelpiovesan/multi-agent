import 'reflect-metadata';
import express, {Application} from 'express';

require('dotenv').config();
import {RegisterRoutes} from '../build/routes';
import {errorHandler} from "./middlewares/error_handler";
import {configureSwagger} from './config/swagger';
import {passportInitialize} from "./config/passport";
import authRouter from './routes/auth';

const app: Application = express();

app.use(express.json());

// Swagger Configuration
configureSwagger(app);

app.use(passportInitialize);

// Google Auth Routes
app.use(authRouter);

// Register routes
RegisterRoutes(app);

// Error handler (must be registered after routes)
app.use(errorHandler);

export default app;
