const pool = require('../db/pool');

// GET /cadope
exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cadope ORDER BY ope_nome');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Operador.' });
  }
};

// GET /cadope/:ope_id
exports.buscarPorOpe_id = async (req, res) => {
  const { ope_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cadope WHERE ope_id = $1',
      [ope_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Operador não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Operador.' });
  }
};

// POST /cadope
exports.criar = async (req, res) => {
  const { ope_nome, ope_fixo, ope_perc } = req.body;
  if (!ope_nome) {
    return res.status(400).json({ erro: 'Nome do Operador é obrigatório.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO cadope (ope_nome, ope_fixo, ope_perc)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ope_nome, ope_fixo, ope_perc]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao cadastrar Operador.' });
  }
};

// PUT /cadope/:ope_id
exports.atualizar = async (req, res) => {
  const { ope_id } = req.params;
  const { ope_nome, ope_fixo, ope_perc } = req.body;
  if (!ope_nome) {
    return res.status(400).json({ erro: 'Nome do Operador é obrigatório.' });
  }

  try {
    const result = await pool.query(
      `UPDATE cadope
       SET ope_nome = $1, ope_fixo = $2, ope_perc = $3
       WHERE ope_id = $4
       RETURNING *`,
      [ope_nome, ope_fixo, ope_perc, ope_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Operador não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar Operador.' });
  }
};

// DELETE /cadope/:ope_id
exports.remover = async (req, res) => {
  const { ope_id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cadope WHERE ope_id = $1 RETURNING *',
      [ope_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Operador não encontrado.' });
    }
    res.json({
      mensagem: 'Operador removido com sucesso',
      cadope: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover Operador.' });
  }
};
