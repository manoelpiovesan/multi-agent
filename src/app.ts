import 'reflect-metadata';
import express, {Application} from 'express';
import cors, {CorsOptions} from 'cors';

require('dotenv').config();
import {RegisterRoutes} from '../build/routes';
import {errorHandler} from "./middlewares/error_handler";
import {configureSwagger} from './config/swagger';
import {passportInitialize} from "./config/passport";
import authRouter from './routes/auth';

const app: Application = express();

const devOrigins = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const configuredOrigins = process.env.CORS_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = configuredOrigins?.length ? configuredOrigins : devOrigins;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origin === 'null' && process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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
