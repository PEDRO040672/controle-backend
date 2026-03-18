const pool = require('../db/pool');

// GET /cadeqp
exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cadeqp ORDER BY eqp_desc');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Equipamento.' });
  }
};

// GET /cadeqp/:eqp_id
exports.buscarPorEqp_id = async (req, res) => {
  const { eqp_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cadeqp WHERE eqp_id = $1',
      [eqp_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Equipamento.' });
  }
};

// POST /cadeqp
exports.criar = async (req, res) => {
  const { eqp_desc, eqp_htkm } = req.body;
  if (!eqp_desc) {
    return res.status(400).json({ erro: 'Descrição do Equipamento é obrigatório.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO cadeqp (eqp_desc, eqp_htkm)
       VALUES ($1, $2)
       RETURNING *`,
      [eqp_desc, eqp_htkm]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao cadastrar Equipamento.' });
  }
};

// PUT /cadeqp/:eqp_id
exports.atualizar = async (req, res) => {
  const { eqp_id } = req.params;
  const { eqp_desc, eqp_htkm } = req.body;
  if (!eqp_desc) {
    return res.status(400).json({ erro: 'Descrição do Equipamento é obrigatório.' });
  }
  try {
    const result = await pool.query(
      `UPDATE cadeqp
       SET eqp_desc = $1, eqp_htkm = $2
       WHERE eqp_id = $3
       RETURNING *`,
      [eqp_desc, eqp_htkm, eqp_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar Equipamento.' });
  }
};

// DELETE /cadeqp/:eqp_id
exports.remover = async (req, res) => {
  const { eqp_id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cadeqp WHERE eqp_id = $1 RETURNING *',
      [eqp_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    }
    res.json({
      mensagem: 'Equipamento removida com sucesso',
      cadeqp: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover Equipamento.' });
  }
};
