```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_, res) => res.json({ status: 'ok' }));
const PORT = process.env.PORT
