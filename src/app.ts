import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import routes from './routes';
import errorHandler from './middlewares/errorHandler';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';

const isProd = env.nodeEnv === 'production';

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 1500,
});

app.use(limiter);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== 'test') {
  app.use(morgan(isProd ? 'combined' : 'dev'));
}
app.use(cors({
  origin: isProd ? (process.env['ALLOWED_ORIGINS'] ?? '').split(',').filter(Boolean) : '*',
  credentials: true,
}));

app.use(routes);

app.use(errorHandler);

export { app };
