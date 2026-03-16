const pool = require('../db/pool');

// GET /cadcid
exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cadcid ORDER BY cid_nome');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Cidade.' });
  }
};

// GET /cadcid/:cid_id
exports.buscarPorCid_id = async (req, res) => {
  const { cid_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cadcid WHERE cid_id = $1',
      [cid_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Cidade não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar Cidade' });
  }
};

// POST /cadcid
exports.criar = async (req, res) => {
  const { cid_nome, cid_uf } = req.body;
  if (!cid_nome || !cid_uf) {
    return res.status(400).json({ erro: 'Nome e Uf são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO cadcid (cid_nome, cid_uf)
       VALUES ($1, $2)
       RETURNING *`,
      [cid_nome, cid_uf]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao cadastrar Cidade.' });
  }
};

// PUT /cadcid/:cid_id
exports.atualizar = async (req, res) => {
  const { cid_id } = req.params;
  const { cid_nome, cid_uf } = req.body;
  if (!cid_nome || !cid_uf) {
    return res.status(400).json({ erro: 'Nome e Uf são obrigatórios' });
  }
  try {
    const result = await pool.query(
      `UPDATE cadcid
       SET cid_nome = $1, cid_uf = $2
       WHERE cid_id = $3
       RETURNING *`,
      [cid_nome, cid_uf, cid_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Cidade não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar Cidade.' });
  }
};

// DELETE /cadcid/:cid_id
exports.remover = async (req, res) => {
  const { cid_id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cadcid WHERE cid_id = $1 RETURNING *',
      [cid_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Cidade não encontrada' });
    }
    res.json({
      mensagem: 'Cidade removida com sucesso',
      cadcid: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover Cidade' });
  }
};
