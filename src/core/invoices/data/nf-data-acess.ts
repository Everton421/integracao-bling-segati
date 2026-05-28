import { conn, db_financeiro, db_publico, db_vendas } from "../../../database/databaseConfig";
import { CadNf } from "../../../interfaces/cad_nf";
import { MvtoProdutos } from "../../../interfaces/mvto_produtos";
import { MvtoTributos } from "../../../interfaces/mvto_tributos";
import { CadClie } from "../../../interfaces/cad_clie";
import { CadForn } from "../../../interfaces/cad_forn";
import { CtReceb } from "../../../interfaces/ct_receb";

export interface NotaFiscalCompleta {
    dadosNota: CadNf;
    itens: ItensNota[];
    cliente: CadClie | null;
    fornecedor: CadForn | null;
}

export interface ItensNota extends MvtoProdutos {
    PRODUTO_CODIGO: number;
    PRODUTO_DESCRICAO: string;
    CLASS_FISCAL_NCM: string;
    CLASS_FISCAL_COD_CEST: string;
    UNID_PROD_SIGLA: string;
}

export class NfRepository {

    async findNotasByPedido(codigoPedido: number): Promise<CadNf[]> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                SELECT 
                    nf.*,
            CAST(nf.OBSERVACOES  AS CHAR(1000)  CHARACTER SET latin1) as OBSERVACOES , 
            CAST(nf.OBSERVACOES2  AS CHAR(1000)  CHARACTER SET latin1) as OBSERVACOES2 , 
            CAST(nf.DADOS_ADICIONAIS  AS CHAR(1000)  CHARACTER SET latin1) as DADOS_ADICIONAIS   


                FROM ${db_vendas}.cad_nf nf
                WHERE PEDIDO = ${codigoPedido};
            `;
            conn.query(sql, (err, result: CadNf[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async findDadosNota(codigoNF: number): Promise<CadNf[]> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                SELECT * 
                FROM ${db_vendas}.cad_nf 
                WHERE CODIGO = ${codigoNF};
            `;
            conn.query(sql, (err, result: CadNf[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async findItensNota(codigoNF: number): Promise<ItensNota[]> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                SELECT 
                    mp.*,
                    cp.CODIGO AS PRODUTO_CODIGO,
                    cp.DESCRICAO AS PRODUTO_DESCRICAO,
                    cf.NCM AS CLASS_FISCAL_NCM,
                    cf.COD_CEST AS CLASS_FISCAL_COD_CEST,
                    up.SIGLA AS UNID_PROD_SIGLA
                FROM ${db_vendas}.mvto_produtos mp
                LEFT JOIN ${db_publico}.cad_prod cp ON mp.PRODUTO = cp.CODIGO
                LEFT JOIN ${db_publico}.class_fiscal cf ON cp.CLASS_FISCAL = cf.CODIGO
                LEFT JOIN ${db_publico}.unid_prod up ON mp.PRODUTO = up.PRODUTO AND mp.ITEM_UNID = up.ITEM
                WHERE mp.CHAVE_MVTO = ${codigoNF};
            `;
            conn.query(sql, (err, result: ItensNota[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async findTributosItem(codigoNF: number): Promise<MvtoTributos[]> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                SELECT * 
                FROM ${db_vendas}.mvto_tributos 
                WHERE CHAVE_MVTO = ${codigoNF};
            `;
            conn.query(sql, (err, result: MvtoTributos[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async findCliente(codigoCliente: number): Promise<CadClie[]> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                SELECT * 
                FROM ${db_publico}.cad_clie 
                WHERE CODIGO = ${codigoCliente};
            `;
            conn.query(sql, (err, result: CadClie[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async findFornecedor(codigoFornecedor: number): Promise<CadForn[]> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                SELECT * 
                FROM ${db_publico}.cad_forn 
                WHERE CODIGO = ${codigoFornecedor};
            `;
            conn.query(sql, (err, result: CadForn[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async updateIdBling(codigoNF: number, idBling: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                UPDATE ${db_vendas}.cad_nf 
                SET Id_bling = '${idBling}' 
                WHERE CODIGO = ${codigoNF};
            `;
            conn.query(sql, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
    
    async findInstallments(codigoNF: number):Promise<CtReceb[]>{
        return new Promise(async (resolve, reject) => {
            const sql = ` SELECT * FROM ${db_financeiro}.ct_receb WHERE CHAVE_MVTO = ? `;
            conn.query(sql, [ codigoNF ], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async findNotasPendentesEnvio(): Promise<CadNf[]> {
        return new Promise(async (resolve, reject) => {
            const sql = `
                SELECT nf.* 
                FROM ${db_vendas}.cad_nf nf
                INNER JOIN pedidos p ON nf.PEDIDO = p.codigo_sistema
                WHERE p.nf IS NOT NULL 
                  AND p.nf != ''
                  AND (nf.Id_bling IS NULL OR nf.Id_bling = '');
            `;
            conn.query(sql, (err, result: CadNf[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}