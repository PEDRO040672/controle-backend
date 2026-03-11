const pool = require('../db/pool');

// GET /cadtit
exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cadtit ORDER BY tit_nome');
    res.json(result.rows);
  } catch (error) {
    console.error('ERRO REAL AO BUSCAR cadtit:', error);
    res.status(500).json({ erro: 'Erro ao buscar Titular.' });
  }
};

// GET /cadtit/:tit_id
exports.buscarPorTit_id = async (req, res) => {
  const { tit_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cadtit WHERE tit_id = $1',
      [tit_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Titular não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar Titular.' });
  }
};

// POST /cadtit
exports.criar = async (req, res) => {
  const { tit_nome, 
          tit_doc, 
          tit_fone, 
          tit_end, 
          tit_bai, 
          tit_cep, 
          tit_cid, 
          tit_obs
        } = req.body;
  if (!tit_nome || !tit_fone) {
    return res.status(400).json({ erro: 'Nome e Fone são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO cadtit (tit_nome, 
                           tit_doc, 
                           tit_fone, 
                           tit_end, 
                           tit_bai, 
                           tit_cep, 
                           tit_cid, 
                           tit_obs
                           )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [ tit_nome, 
        tit_doc, 
        tit_fone, 
        tit_end, 
        tit_bai, 
        tit_cep, 
        tit_cid, 
        tit_obs
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    //res.status(500).json({ erro: 'Erro ao cadastrar Titular.' });
    console.error('ERRO REAL AO INSERIR TITULAR:', error);
    res.status(500).json({ erro: error.message });
  }
};

// PUT /cadtit/:tit_id
exports.atualizar = async (req, res) => {
  const { tit_id } = req.params;
  const { tit_nome, 
          tit_doc, 
          tit_fone, 
          tit_end, 
          tit_bai, 
          tit_cep, 
          tit_cid, 
          tit_obs 
        } = req.body;
  if (!tit_nome || !tit_fone) {
    return res.status(400).json({ erro: 'Nome e Fone são obrigatórios' });
  }
  try {
    const result = await pool.query(
      `UPDATE cadtit
       SET tit_nome = $1, 
           tit_doc = $2, 
           tit_fone = $3, 
           tit_end = $4, 
           tit_bai = $5, 
           tit_cep = $6, 
           tit_cid = $7, 
           tit_obs = $8
       WHERE tit_id = $9
       RETURNING *`,
      [ tit_nome, 
        tit_doc, 
        tit_fone, 
        tit_end, 
        tit_bai, 
        tit_cep, 
        tit_cid, 
        tit_obs, 
        tit_id
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Titular não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar Titular.' });
  }
};

// DELETE /cadtit/:tit_id
exports.remover = async (req, res) => {
  const { tit_id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cadtit WHERE tit_id = $1 RETURNING *',
      [tit_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Titular não encontrada' });
    }
    res.json({
      mensagem: 'Titular removido com sucesso',
      cadtit: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover Titular' });
  }
};
