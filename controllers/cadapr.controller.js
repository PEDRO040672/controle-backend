const pool = require('../db/pool');

//========================================================================
// GET /cadapr
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM cadapr
      ORDER BY apr_tr DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar cadapr' });
  }
};

//========================================================================
// GET /cadapr/:tr
exports.buscar = async (req, res) => {
  const { tr } = req.params;

  try {
    const cab = await pool.query(
      `SELECT * FROM cadapr WHERE apr_tr = $1`,
      [tr]
    );

    const itens = await pool.query(
      `SELECT * FROM cadipr WHERE ipr_tr = $1 ORDER BY ipr_it`,
      [tr]
    );

    const parcelas = await pool.query(
      `SELECT * FROM cadppr WHERE ppr_tr = $1 ORDER BY ppr_pc`,
      [tr]
    );

    res.json({
      cabecalho: cab.rows[0],
      itens: itens.rows,
      parcelas: parcelas.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar lançamento' });
  }
};

//========================================================================
// POST /cadapr
exports.salvar = async (req, res) => {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    let {
      cabecalho,
      itens,
      parcelas
    } = req.body;

    let tr = cabecalho.apr_tr;

    //====================================================================
    // NOVO
    if (tr === 0) {

      const seq = await client.query(`
        UPDATE cadds
        SET ds_tr = ds_tr + 1
        RETURNING ds_tr
      `);

      tr = seq.rows[0].ds_tr;
      cabecalho.apr_tr = tr;

    } else {

      // verifica se é OS (bloqueia)
      const tipo = await client.query(
        `SELECT apr_tipo FROM cadapr WHERE apr_tr = $1`,
        [tr]
      );

      if (tipo.rows[0].apr_tipo === 'OS') {
        throw new Error('Lançamento proveniente de OS não pode ser alterado');
      }

      await client.query(`DELETE FROM cadipr WHERE ipr_tr = $1`, [tr]);
      await client.query(`DELETE FROM cadppr WHERE ppr_tr = $1`, [tr]);
      await client.query(`DELETE FROM cadapr WHERE apr_tr = $1`, [tr]);

    }

    //====================================================================
    // INSERT CABEÇALHO
    await client.query(`
      INSERT INTO cadapr (
        apr_tr,
        apr_tipo,
        apr_data,
        apr_tit,
        apr_eqp,
        apr_htkm,
        apr_obs,
        apr_vltotal
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [
      tr,
      cabecalho.apr_tipo,
      cabecalho.apr_data,
      cabecalho.apr_tit,
      cabecalho.apr_eqp,
      cabecalho.apr_htkm,
      cabecalho.apr_obs,
      cabecalho.apr_vltotal
    ]);

    //====================================================================
    // ITENS
    let totalItens = 0;

    for (const item of itens) {

      await client.query(`
        INSERT INTO cadipr (
          ipr_tr,
          ipr_it,
          ipr_hist,
          ipr_obs,
          ipr_qtd,
          ipr_vlunit,
          ipr_vltotal
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [
        tr,
        item.ipr_it,
        item.ipr_hist,
        item.ipr_obs,
        item.ipr_qtd,
        item.ipr_vlunit,
        item.ipr_vltotal
      ]);

      totalItens += Number(item.ipr_vltotal);

    }

    //====================================================================
    // PARCELAS
    let totalParcelas = 0;

    for (const parc of parcelas) {

      await client.query(`
        INSERT INTO cadppr (
          ppr_tr,
          ppr_pc,
          ppr_venc,
          ppr_obs,
          ppr_vlpc
        )
        VALUES ($1,$2,$3,$4,$5)
      `, [
        tr,
        parc.ppr_pc,
        parc.ppr_venc,
        parc.ppr_obs,
        parc.ppr_vlpc
      ]);

      totalParcelas += Number(parc.ppr_vlpc);

    }

    //====================================================================
    // VALIDAÇÃO TOTAIS
    const totalCab = Number(cabecalho.apr_vltotal);

    if (totalItens !== totalCab)
      throw new Error('Total itens diferente do cabeçalho');

    if (totalParcelas !== totalCab)
      throw new Error('Total parcelas diferente do cabeçalho');

    //====================================================================
    // ATUALIZA HT/KM EQUIPAMENTO
    if (cabecalho.apr_eqp > 0 && cabecalho.apr_htkm > 0) {

      await client.query(`
        UPDATE cadeqp
        SET eqp_htkm = $1
        WHERE eqp_codigo = $2
        AND $1 > eqp_htkm
      `, [
        cabecalho.apr_htkm,
        cabecalho.apr_eqp
      ]);

    }

    await client.query('COMMIT');

    res.json({ tr });

  } catch (err) {

    await client.query('ROLLBACK');

    console.error(err);
    res.status(500).json({ erro: err.message });

  } finally {
    client.release();
  }

};

//========================================================================
// DELETE /cadapr/:tr
exports.excluir = async (req, res) => {

  const { tr } = req.params;

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const tipo = await client.query(
      `SELECT apr_tipo FROM cadapr WHERE apr_tr = $1`,
      [tr]
    );

    if (tipo.rows[0].apr_tipo === 'OS') {
      throw new Error('Registro proveniente de OS não pode ser excluído');
    }

    await client.query(`DELETE FROM cadipr WHERE ipr_tr = $1`, [tr]);
    await client.query(`DELETE FROM cadppr WHERE ppr_tr = $1`, [tr]);
    await client.query(`DELETE FROM cadapr WHERE apr_tr = $1`, [tr]);

    await client.query('COMMIT');

    res.json({ ok: true });

  } catch (err) {

    await client.query('ROLLBACK');

    console.error(err);
    res.status(500).json({ erro: err.message });

  } finally {
    client.release();
  }

};

