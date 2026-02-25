const pool = require('../db/pool');

// GET /pessoas
exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pessoas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('ERRO REAL AO BUSCAR PESSOAS:', error);
    res.status(500).json({ erro: 'Erro ao buscar pessoas' });
  }
};

// GET /pessoas/:id
exports.buscarPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM pessoas WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar pessoa' });
  }
};

// POST /pessoas
exports.criar = async (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ erro: 'Nome e email são obrigatórios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pessoas (nome, email, telefone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nome, email, telefone]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar pessoa' });
  }
};

// PUT /pessoas/:id
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ erro: 'Nome e email são obrigatórios' });
  }

  try {
    const result = await pool.query(
      `UPDATE pessoas
       SET nome = $1, email = $2, telefone = $3
       WHERE id = $4
       RETURNING *`,
      [nome, email, telefone, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar pessoa' });
  }
};

// DELETE /pessoas/:id
exports.remover = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM pessoas WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Pessoa não encontrada' });
    }

    res.json({
      mensagem: 'Pessoa removida com sucesso',
      pessoa: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover pessoa' });
  }
};
