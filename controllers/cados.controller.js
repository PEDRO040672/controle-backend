const pool = require('../db/pool');

// =======================================================
// FUNÇÕES AUXILIARES
// =======================================================
async function atualizarHTKM(client, os_eqp, os_htkmf) {
  await client.query(
    `UPDATE cadeqp
     SET eqp_htkm = $1
     WHERE eqp_id = $2
       AND eqp_htkm < $1`,
    [os_htkmf, os_eqp]
  );
}

async function inserirFinanceiro(client, dados) {
  const {
    os_tr, os_situ, os_data,
    os_tit, os_eqp, os_htkmf,
    os_obs, os_vltots,
    os_his, os_qtd, os_vlunit
  } = dados;
  await client.query(
    `INSERT INTO cadapr
    (apr_tr, apr_os, apr_tipo, apr_situ, apr_data, apr_tit, apr_eqp, apr_htkm, apr_obs, apr_vltot)
    VALUES ($1,$2,'OS',$3,$4,$5,$6,$7,$8,$9)`,
    [
      os_tr,
      os_situ === "Quitado" ? "Quitado" : "Ñ Quitado",
      os_data,
      os_tit,
      os_eqp,
      os_htkmf,
      os_obs,
      os_vltots
    ]
  );
  await client.query(
    `INSERT INTO cadipr
    (ipr_tr, ipr_it, ipr_his, ipr_obs, ipr_qtd, ipr_vlunit, ipr_vltoti)
    VALUES ($1,1,$2,$3,$4,$5,$6)`,
    [os_tr, os_his, os_obs, os_qtd, os_vlunit, os_vltots]
  );
  await client.query(
    `INSERT INTO cadppr
    (ppr_tr, ppr_pc, ppr_dtv, ppr_obs, ppr_vlpc)
    VALUES ($1,1,$2,$3,$4)`,
    [os_tr, os_data, os_obs, os_vltots]
  );
}

async function inserirBaixa(client, os_tr, os_data, os_obs, os_vltots) {
  await client.query(
    `INSERT INTO cadbpr
    (bpr_tr, bpr_pc, bpr_it, bpr_dtb, bpr_obs, bpr_vlb)
    VALUES ($1,1,1,$2,$3,$4)`,
    [os_tr, os_data, os_obs, os_vltots]
  );
}

async function removerBaixa(client, os_tr) {
  await client.query(
    `DELETE FROM cadbpr WHERE bpr_tr = $1`,
    [os_tr]
  );
}

async function removerFinanceiro(client, os_tr) {
  await client.query(`DELETE FROM cadppr WHERE ppr_tr = $1`, [os_tr]);
  await client.query(`DELETE FROM cadipr WHERE ipr_tr = $1`, [os_tr]);
  await client.query(`DELETE FROM cadapr WHERE apr_tr = $1`, [os_tr]);
}

async function atualizarSituacaoFinanceiro(client, os_tr, situacao) {
  await client.query(
    `UPDATE cadapr
     SET apr_situ = $2
     WHERE apr_tr = $1`,
    [os_tr, situacao]
  );
}

//========================================================================
// GET /cados
exports.listar = async (req, res) => {
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
      LEFT JOIN cadhis ON cadhis.his_id = cados.os_his
      LEFT JOIN cadcid ON cadcid.cid_id = cados.os_cid
      LEFT JOIN cadtit ON cadtit.tit_id = cados.os_tit
      LEFT JOIN cadeqp ON cadeqp.eqp_id = cados.os_eqp
      LEFT JOIN cadope ON cadope.ope_id = cados.os_ope
      ORDER BY cados.os_data DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar OS.' });
  }
};

//========================================================================
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
      LEFT JOIN cadhis ON cadhis.his_id = cados.os_his
      LEFT JOIN cadcid ON cadcid.cid_id = cados.os_cid
      LEFT JOIN cadtit ON cadtit.tit_id = cados.os_tit
      LEFT JOIN cadeqp ON cadeqp.eqp_id = cados.os_eqp
      LEFT JOIN cadope ON cadope.ope_id = cados.os_ope
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

//========================================================================
// POST /cados
exports.criar = async (req, res) => {
  const dados = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const trResult = await client.query(
      'SELECT ds_tr FROM cadds ORDER BY ds_id DESC LIMIT 1 FOR UPDATE'
    );
    let os_tr = (trResult.rows[0]?.ds_tr || 0) + 1;
    await client.query(
      `UPDATE cadds 
       SET ds_tr = $1 
       WHERE ds_id = (SELECT ds_id FROM cadds ORDER BY ds_id DESC LIMIT 1)`,
      [os_tr]
    );
    const result = await client.query(
      `INSERT INTO cados 
      (os_tr, os_situ, os_data, os_hora, os_his, os_cid, os_tit, os_eqp, os_ope,
       os_obs, os_htkmi, os_htkmf, os_qtd, os_vlunit, os_vldesc, os_vltots)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        os_tr,
        dados.os_situ, dados.os_data, dados.os_hora,
        dados.os_his, dados.os_cid, dados.os_tit, dados.os_eqp,
        dados.os_ope, dados.os_obs, dados.os_htkmi, dados.os_htkmf,
        dados.os_qtd, dados.os_vlunit, dados.os_vldesc, dados.os_vltots
      ]
    );
    await atualizarHTKM(client, dados.os_eqp, dados.os_htkmf);
    if (dados.os_situ === "Fechado" || dados.os_situ === "Quitado") {
      await inserirFinanceiro(client, { os_tr, ...dados });
      if (dados.os_situ === "Quitado") {
        await inserirBaixa(client, os_tr, dados.os_data, dados.os_obs, dados.os_vltots);
      }
    }
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

//========================================================================
// PUT /cados/:os_tr
exports.atualizar = async (req, res) => {
  const { os_tr } = req.params;
  const dados = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const old = await client.query(
      `SELECT os_situ FROM cados WHERE os_tr = $1 FOR UPDATE`,
      [os_tr]
    );
    if (old.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'OS não encontrada' });
    }
    const oldSitu = old.rows[0].os_situ;
    const result = await client.query(
      `UPDATE cados SET
       os_situ=$2, os_data=$3, os_hora=$4,
       os_his=$5, os_cid=$6, os_tit=$7, os_eqp=$8,
       os_ope=$9, os_obs=$10, os_htkmi=$11, os_htkmf=$12,
       os_qtd=$13, os_vlunit=$14, os_vldesc=$15, os_vltots=$16
       WHERE os_tr=$1
       RETURNING *`,
      [
        os_tr,
        dados.os_situ, dados.os_data, dados.os_hora,
        dados.os_his, dados.os_cid, dados.os_tit, dados.os_eqp,
        dados.os_ope, dados.os_obs, dados.os_htkmi, dados.os_htkmf,
        dados.os_qtd, dados.os_vlunit, dados.os_vldesc, dados.os_vltots
      ]
    );
    await atualizarHTKM(client, dados.os_eqp, dados.os_htkmf);
    if (oldSitu === "Aberto" && (dados.os_situ === "Fechado" || dados.os_situ === "Quitado")) {
      await inserirFinanceiro(client, { os_tr, ...dados });
      if (dados.os_situ === "Quitado") {
        await inserirBaixa(client, os_tr, dados.os_data, dados.os_obs, dados.os_vltots);
      }
    }
    if (oldSitu === "Fechado" && dados.os_situ === "Quitado") {
      await inserirBaixa(client, os_tr, dados.os_data, dados.os_obs, dados.os_vltots);
      await atualizarSituacaoFinanceiro(client, os_tr, "Quitado");
    }
    if (oldSitu === "Quitado" && dados.os_situ === "Fechado") {
      await removerBaixa(client, os_tr);
      await atualizarSituacaoFinanceiro(client, os_tr, "Ñ Quitado");
    }
    if (oldSitu === "Quitado" && dados.os_situ === "Aberto") {
      await removerBaixa(client, os_tr);
      await removerFinanceiro(client, os_tr);
    }
    if (oldSitu === "Fechado" && dados.os_situ === "Aberto") {
      await removerFinanceiro(client, os_tr);
    }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar OS.' });
  } finally {
    client.release();
  }
};

//========================================================================
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