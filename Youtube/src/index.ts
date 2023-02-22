import express from 'express';
import './controllers';
import { router } from './routes.decorator';
import bodyParser from 'body-parser';
import * as MySQLConnector from './utils/mysql.connector';
import 'dotenv/config'

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(router);

// create database pool
MySQLConnector.init();

app.listen(3000, () => {
  console.log('Server is running on port 3000');
}).on('error', (err) => {
  console.log(err);
});