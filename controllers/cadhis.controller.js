const pool = require('../db/pool');

// GET /cadhis
exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cadhis ORDER BY his_desc');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Histórico.' });
  }
};

// GET /cadhis/:his_id
exports.buscarPorHis_id = async (req, res) => {
  const { his_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cadhis WHERE his_id = $1',
      [his_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Histórico não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Histórico.' });
  }
};

// POST /cadhis
exports.criar = async (req, res) => {
  const { his_desc, his_cc, his_intervalo } = req.body;
  if (!his_desc) {
    return res.status(400).json({ erro: 'Descrição do Histórico é obrigatório.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO cadhis (his_desc, his_cc, his_intervalo)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [his_desc, his_cc, his_intervalo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao cadastrar Histórico.' });
  }
};

// PUT /cadhis/:his_id
exports.atualizar = async (req, res) => {
  const { his_id } = req.params;
  const { his_desc, his_cc, his_intervalo } = req.body;
  if (!his_desc) {
    return res.status(400).json({ erro: 'Descrição do Histórico é obrigatório.' });
  }

  try {
    const result = await pool.query(
      `UPDATE cadhis
       SET his_desc = $1, his_cc = $2, his_intervalo = $3
       WHERE his_id = $4
       RETURNING *`,
      [his_desc, his_cc, his_intervalo, his_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Histórico não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar Histórico.' });
  }
};

// DELETE /cadhis/:his_id
exports.remover = async (req, res) => {
  const { his_id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cadhis WHERE his_id = $1 RETURNING *',
      [his_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Histórico não encontrado.' });
    }
    res.json({
      mensagem: 'Histórico removido com sucesso',
      cadhis: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover Histórico.' });
  }
};
