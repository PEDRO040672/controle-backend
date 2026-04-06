const pool = require('../db/pool');

//========================================================================
// GET /cadapr
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        cadapr.*,
        cadtit.tit_nome,
        cadeqp.eqp_desc
      FROM cadapr
      LEFT JOIN cadtit 
        ON cadtit.tit_id = cadapr.apr_tit
      LEFT JOIN cadeqp 
        ON cadeqp.eqp_id = cadapr.apr_eqp
      ORDER BY cadapr.apr_data DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar financeiro.' });
  }
};

//========================================================================
// GET /cadapr/:apr_tr
exports.buscarPorApr_tr = async (req, res) => {
  const { apr_tr } = req.params;

  try {
    const cab = await pool.query(
      `SELECT
        cadapr.*,
        cadtit.tit_nome,
        cadeqp.eqp_desc
      FROM cadapr
      LEFT JOIN cadtit 
        ON cadtit.tit_id = cadapr.apr_tit
      LEFT JOIN cadeqp 
        ON cadeqp.eqp_id = cadapr.apr_eqp
      WHERE apr_tr = $1`,
      [apr_tr]
    );

    if (cab.rowCount === 0) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    const itens = await pool.query(
      `SELECT
        cadipr.*,
        cadhis.his_desc
      FROM cadipr
      LEFT JOIN cadhis 
        ON cadhis.his_id = cadipr.ipr_his
      WHERE ipr_tr = $1
      ORDER BY ipr_it`,
      [apr_tr]
    );

    const parcelas = await pool.query(
      `SELECT *
       FROM cadppr
       WHERE ppr_tr = $1
       ORDER BY ppr_pc`,
      [apr_tr]
    );

    res.json({
      cabecalho: cab.rows[0],
      itens: itens.rows,
      parcelas: parcelas.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar registro' });
  }
};

//========================================================================
// POST /cadapr
exports.criar = async (req, res) => {

  const {
    cabecalho,
    itens,
    parcelas,
    quitar_total
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // pega tr
    const trResult = await client.query(
      'SELECT ds_tr FROM cadds ORDER BY ds_id DESC LIMIT 1 FOR UPDATE'
    );

    let apr_tr = (trResult.rows[0]?.ds_tr || 0) + 1;

    await client.query(
      `UPDATE cadds 
       SET ds_tr = $1
       WHERE ds_id = (SELECT ds_id FROM cadds ORDER BY ds_id DESC LIMIT 1)`,
      [apr_tr]
    );

    // INSERT CADAPR
    await client.query(
      `INSERT INTO cadapr
      (apr_tr, apr_tipo, apr_situ, apr_data, apr_tit, apr_eqp, apr_htkm, apr_obs, apr_vltot)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        apr_tr,
        cabecalho.apr_tipo,
        cabecalho.apr_situ,
        cabecalho.apr_data,
        cabecalho.apr_tit,
        cabecalho.apr_eqp,
        cabecalho.apr_htkm,
        cabecalho.apr_obs,
        cabecalho.apr_vltot
      ]
    );

    // atualizar HTKM
    await client.query(
      `UPDATE cadeqp
       SET eqp_htkm = $1
       WHERE eqp_id = $2
       AND eqp_htkm < $1`,
      [cabecalho.apr_htkm, cabecalho.apr_eqp]
    );

    // ITENS
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i];

      await client.query(
        `INSERT INTO cadipr
        (ipr_tr, ipr_it, ipr_his, ipr_qtd, ipr_vlunit, ipr_vltoti)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          apr_tr,
          i + 1,
          it.ipr_his,
          it.ipr_qtd,
          it.ipr_vlunit,
          it.ipr_vltoti
        ]
      );
    }

    // PARCELAS
    for (let i = 0; i < parcelas.length; i++) {
      const pc = parcelas[i];

      await client.query(
        `INSERT INTO cadppr
        (ppr_tr, ppr_pc, ppr_dtv, ppr_vlpc)
        VALUES ($1,$2,$3,$4)`,
        [
          apr_tr,
          i + 1,
          pc.ppr_dtv,
          pc.ppr_vlpc
        ]
      );
    }

    // QUITAR TOTAL
    if (quitar_total) {
      for (let i = 0; i < parcelas.length; i++) {
        const pc = parcelas[i];

        await client.query(
          `INSERT INTO cadbpr
          (bpr_tr, bpr_pc, bpr_it, bpr_dtb, bpr_vlb)
          VALUES ($1,$2,$3,$4,$5)`,
          [
            apr_tr,
            i + 1,
            1,
            pc.ppr_dtv,
            pc.ppr_vlpc
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ apr_tr });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar registro.' });
  } finally {
    client.release();
  }
};

//========================================================================
// PUT /cadapr/:apr_tr
exports.atualizar = async (req, res) => {

  const { apr_tr } = req.params;
  const { cabecalho, itens, parcelas, quitar_total } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE cadapr
       SET apr_tipo = $2,
           apr_situ = $3,
           apr_data = $4,
           apr_tit = $5,
           apr_eqp = $6,
           apr_htkm = $7,
           apr_obs = $8,
           apr_vltot = $9
       WHERE apr_tr = $1`,
      [
        apr_tr,
        cabecalho.apr_tipo,
        cabecalho.apr_situ,
        cabecalho.apr_data,
        cabecalho.apr_tit,
        cabecalho.apr_eqp,
        cabecalho.apr_htkm,
        cabecalho.apr_obs,
        cabecalho.apr_vltot
      ]
    );

    await client.query(`DELETE FROM cadipr WHERE ipr_tr = $1`, [apr_tr]);
    await client.query(`DELETE FROM cadppr WHERE ppr_tr = $1`, [apr_tr]);
    await client.query(`DELETE FROM cadbpr WHERE bpr_tr = $1`, [apr_tr]);

    // ITENS
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i];

      await client.query(
        `INSERT INTO cadipr
        (ipr_tr, ipr_it, ipr_his, ipr_qtd, ipr_vlunit, ipr_vltoti)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          apr_tr,
          i + 1,
          it.ipr_his,
          it.ipr_qtd,
          it.ipr_vlunit,
          it.ipr_vltoti
        ]
      );
    }

    // PARCELAS
    for (let i = 0; i < parcelas.length; i++) {
      const pc = parcelas[i];

      await client.query(
        `INSERT INTO cadppr
        (ppr_tr, ppr_pc, ppr_dtv, ppr_vlpc)
        VALUES ($1,$2,$3,$4)`,
        [
          apr_tr,
          i + 1,
          pc.ppr_dtv,
          pc.ppr_vlpc
        ]
      );
    }

    // QUITAR TOTAL
    if (quitar_total) {
      for (let i = 0; i < parcelas.length; i++) {
        const pc = parcelas[i];

        await client.query(
          `INSERT INTO cadbpr
          (bpr_tr, bpr_pc, bpr_it, bpr_dtb, bpr_vlb)
          VALUES ($1,$2,$3,$4,$5)`,
          [
            apr_tr,
            i + 1,
            1,
            pc.ppr_dtv,
            pc.ppr_vlpc
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.json({ mensagem: 'Atualizado com sucesso' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar.' });
  } finally {
    client.release();
  }
};

//========================================================================
// DELETE
exports.remover = async (req, res) => {
  const { apr_tr } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM cadbpr WHERE bpr_tr = $1`, [apr_tr]);
    await client.query(`DELETE FROM cadppr WHERE ppr_tr = $1`, [apr_tr]);
    await client.query(`DELETE FROM cadipr WHERE ipr_tr = $1`, [apr_tr]);
    await client.query(`DELETE FROM cadapr WHERE apr_tr = $1`, [apr_tr]);

    await client.query('COMMIT');

    res.json({ mensagem: 'Removido com sucesso' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover' });
  } finally {
    client.release();
  }
};