import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import routes from './routes';
import errorHandler from './middlewares/errorHandler';

const app = express();

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());

app.use(routes);

app.use(errorHandler);

export { app };
