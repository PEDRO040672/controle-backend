const pool = require('../db/pool');

// GET /cados
exports.listar = async (req, res) => {
  try {
    //const result = await pool.query('SELECT * FROM cados ORDER BY os_data');
    const result = await pool.query(
      `SELECT 
        cados.*,
        cadhis.his_desc,
        cadcid.cid_nome,
        cadtit.tit_nome,
        cadeqp.eqp_desc,
        cadope.ope_nome
      FROM cados
      LEFT JOIN cadhis 
        ON cadhis.his_id = cados.os_his
      LEFT JOIN cadcid 
        ON cadcid.cid_id = cados.os_cid
      LEFT JOIN cadtit 
        ON cadtit.tit_id = cados.os_tit
      LEFT JOIN cadeqp 
        ON cadeqp.eqp_id = cados.os_eqp
      LEFT JOIN cadope 
        ON cadope.ope_id = cados.os_ope
      ORDER BY cados.os_data DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar OS.' });
  }
};

// GET /cados/:os_tr
exports.buscarPorOs_tr = async (req, res) => {
  const { os_tr } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        cados.*,
        cadhis.his_desc,
        cadcid.cid_nome,
        cadtit.tit_nome,
        cadeqp.eqp_desc,
        cadope.ope_nome
      FROM cados
      LEFT JOIN cadhis 
        ON cadhis.his_id = cados.os_his
      LEFT JOIN cadcid 
        ON cadcid.cid_id = cados.os_cid
      LEFT JOIN cadtit 
        ON cadtit.tit_id = cados.os_tit
      LEFT JOIN cadeqp 
        ON cadeqp.eqp_id = cados.os_eqp
      LEFT JOIN cadope 
        ON cadope.ope_id = cados.os_ope
        WHERE cados.os_tr = $1`,
      [os_tr]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'OS não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar OS' });
  }
};

// POST /cados
//exports.criar = async (req, res) => {
//  //const { os_tr } = req.params;
//  const { os_tr, os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots } = req.body;
//  try {
//    const result = await pool.query(
//      `INSERT INTO cados (os_tr, os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
//       RETURNING *`,
//      [os_tr, os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots]
//    );
//    res.status(201).json(result.rows[0]);
//  } catch (error) {
//    console.error(error);
//    res.status(500).json({ erro: 'Erro ao cadastrar OS.' });
//  }
//};
exports.criar = async (req, res) => {
  const { os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // pega o valor atual
    const trResult = await client.query(
      'SELECT ds_tr FROM cadds ORDER BY ds_id DESC LIMIT 1 FOR UPDATE'
    );
    let os_tr = (trResult.rows[0]?.ds_tr || 0) + 1;
    // atualiza o contador
    await client.query(
      'UPDATE cadds SET ds_tr = $1 WHERE ds_id = (SELECT ds_id FROM cadds ORDER BY ds_id DESC LIMIT 1)',
      [os_tr]
    );
    // faz o insert com o novo numero
    const result = await client.query(
      `INSERT INTO cados 
      (os_tr, os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [os_tr, os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ erro: 'Erro ao cadastrar OS.' });
  } finally {
    client.release();
  }
};
// PUT /cados/:os_tr
exports.atualizar = async (req, res) => {
  const { os_tr } = req.params;
  const { os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cados
       SET os_os = $2, os_situ = $3, os_data = $4, os_hora = $5, os_his = $6, os_cid = $7, os_tit = $8, os_eqp = $9, os_ope = $10, os_obs = $11, os_htkmi = $12, os_htkmf = $13, os_qtd = $14, os_vlunit = $15, os_vldesc = $16, os_vltots = $17
       WHERE os_tr = $1
       RETURNING *`,
      [os_tr, os_os, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope, os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'OS não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar OS.' });
  }
};

// DELETE /cados/:os_tr
exports.remover = async (req, res) => {
  const { os_tr } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cados WHERE os_tr = $1 RETURNING *',
      [os_tr]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'OS não encontrada' });
    }
    res.json({
      mensagem: 'OS removida com sucesso',
      cados: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover OS' });
  }
};
