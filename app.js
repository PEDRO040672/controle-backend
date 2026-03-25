const express = require('express');
const cors = require('cors');

const cadcidRoutes = require('./routes/cadcid.routes');
const cadtitRoutes = require('./routes/cadtit.routes');
const cadeqpRoutes = require('./routes/cadeqp.routes');
const cadopeRoutes = require('./routes/cadope.routes');
const cadhisRoutes = require('./routes/cadhis.routes');

const app = express();

app.use(cors());
app.use(express.json());

// rota raiz
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

// rotas
app.use('/cadcid', cadcidRoutes);
app.use('/cadtit', cadtitRoutes);
app.use('/cadeqp', cadeqpRoutes);
app.use('/cadope', cadopeRoutes);
app.use('/cadhis', cadhisRoutes);

module.exports = app;
