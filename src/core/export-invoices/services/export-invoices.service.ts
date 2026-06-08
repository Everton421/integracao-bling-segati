import ExcelJS from 'exceljs';
import { NfRepository } from '../data/nf-data-acess';
import { DateService } from '../../../shared/utils/date-service';

export class ExportInvoicesService {
    private nfRepository = new NfRepository();

    async exportToExcel(dataInicio: string, dataFim: string, codigos?: number[]): Promise<ExcelJS.Buffer> {
        const notas = codigos && codigos.length > 0
            ? await this.nfRepository.findNotasByCodigos(codigos)
            : await this.nfRepository.findNotasByDataEmissao(dataInicio, dataFim);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Integracao Bling Segati';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Itens', {
            views: [{ state: 'frozen', ySplit: 1 }]
        });

        const columns: Partial<ExcelJS.Column>[] = [
            { header: 'CÓDIGO_NF', key: 'CODIGO_NF', width: 10 },
            { header: 'NÚMERO_NF', key: 'NUMERO_NF', width: 14 },
            { header: 'CHAVE_NFE', key: 'CHAVE_NFE', width: 50 },
            { header: 'DIGEST_VALUE_NFE', key: 'DIGEST_VALUE_NFE', width: 40 },
            { header: 'SIGNATURE_VALUE_NFE', key: 'SIGNATURE_VALUE_NFE', width: 40 },
            { header: 'PROTOCOLO_NFE', key: 'PROTOCOLO_NFE', width: 20 },
            { header: 'SÉRIE', key: 'SERIE', width: 8 },
            { header: 'DATA_EMISSÃO', key: 'DATA_EMISSAO', width: 14 },
            { header: 'OPERAÇÃO', key: 'OPERACAO', width: 10 },
            { header: 'CFOP_NF', key: 'CFOP_NF', width: 10 },
            { header: 'TRANSACAO_NATUREZA', key: 'TRANSACAO_NATUREZA', width: 30 },
            { header: 'CLIENTE_NOME', key: 'CLIENTE_NOME', width: 40 },
            { header: 'CLIENTE_CPF_CNPJ', key: 'CLIENTE_CPF_CNPJ', width: 20 },
            { header: 'CLIENTE_ENDERECO', key: 'CLIENTE_ENDERECO', width: 35 },
            { header: 'CLIENTE_NUMERO', key: 'CLIENTE_NUMERO', width: 10 },
            { header: 'CLIENTE_BAIRRO', key: 'CLIENTE_BAIRRO', width: 25 },
            { header: 'CLIENTE_CIDADE', key: 'CLIENTE_CIDADE', width: 25 },
            { header: 'CLIENTE_UF', key: 'CLIENTE_UF', width: 6 },
            { header: 'CLIENTE_CEP', key: 'CLIENTE_CEP', width: 10 },
            { header: 'CLIENTE_TELEFONE', key: 'CLIENTE_TELEFONE', width: 18 },
            { header: 'CLIENTE_EMAIL', key: 'CLIENTE_EMAIL', width: 30 },
            { header: 'TOTAL_NF', key: 'TOTAL_NF', width: 14 },
            { header: 'VALOR_FRETE', key: 'VALOR_FRETE', width: 14 },
            { header: 'VALOR_SEGURO', key: 'VALOR_SEGURO', width: 14 },
            { header: 'DESCONTO_NF', key: 'DESCONTO_NF', width: 14 },
            { header: 'OBSERVAÇÕES', key: 'OBSERVACOES', width: 40 },
            { header: 'ITEM', key: 'ITEM', width: 6 },
            { header: 'CÓDIGO_PRODUTO', key: 'CODIGO_PRODUTO', width: 14 },
            { header: 'DESCRIÇÃO_PRODUTO', key: 'DESCRICAO_PRODUTO', width: 40 },
            { header: 'NCM', key: 'NCM', width: 12 },
            { header: 'CEST', key: 'CEST', width: 12 },
            { header: 'UNIDADE', key: 'UNIDADE', width: 8 },
            { header: 'QUANTIDADE', key: 'QUANTIDADE', width: 12 },
            { header: 'VALOR_UNITÁRIO', key: 'VALOR_UNITARIO', width: 14 },
            { header: 'DESCONTO_PRODUTO', key: 'DESCONTO_PRODUTO', width: 14 },
            { header: 'TOTAL_ITEM', key: 'TOTAL_ITEM', width: 14 },
            { header: 'CFOP_ITEM', key: 'CFOP_ITEM', width: 10 },
            { header: 'CST_ICMS', key: 'CST_ICMS', width: 10 },
            { header: 'ALÍQ_ICMS', key: 'ALIQ_ICMS', width: 10 },
            { header: 'BASE_ICMS', key: 'BASE_ICMS', width: 14 },
            { header: 'VALOR_ICMS', key: 'VALOR_ICMS', width: 14 },
            { header: 'VALOR_IPI', key: 'VALOR_IPI', width: 14 },
            { header: 'VALOR_PIS', key: 'VALOR_PIS', width: 14 },
            { header: 'VALOR_COFINS', key: 'VALOR_COFINS', width: 14 },
            { header: 'PESO_BRUTO', key: 'PESO_BRUTO', width: 12 },
            { header: 'PESO_LÍQUIDO', key: 'PESO_LIQUIDO', width: 12 },
        ];

        worksheet.columns = columns;

        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        const headerRow = worksheet.getRow(1);
        columns.forEach((col, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.style = headerStyle;
        });
        headerRow.height = 30;

        for (const nota of notas) {
            const codigoCliente = nota.CODIGO_CLI_FOR;
            const codigoNf = nota.CODIGO;

            const [itens, dadosMvtTributos, dadosClienteArr] = await Promise.all([
                this.nfRepository.findItensNota(codigoNf),
                this.nfRepository.findTributosItem(codigoNf),
                codigoCliente ? this.nfRepository.findCliente(codigoCliente) : Promise.resolve([]),
            ]);

            const cliente = dadosClienteArr.length > 0 ? dadosClienteArr[0] : null;
            const dataEmissao = DateService.formatarData(nota.DATA_EMISSAO);

            const transacao = await this.nfRepository.findTransacao(nota.TRANSACAO);

            for (const item of itens) {
                const trib = dadosMvtTributos.find(t => t.ITEM === item.ITEM);

                const rowData: Record<string, any> = {
                    CODIGO_NF: nota.CODIGO,
                    NUMERO_NF: nota.NUMERO_NF,
                    CHAVE_NFE: nota.CHAVE_NFE || '',
                    DIGEST_VALUE_NFE: nota.DIGEST_VALUE_NFE || '',
                    SIGNATURE_VALUE_NFE: nota.SIGNATURE_VALUE_NFE || '',
                    PROTOCOLO_NFE: nota.PROTOCOLO_NFE || '',
                    SERIE: nota.SERIE_NF || nota.SERIE,
                    DATA_EMISSAO: dataEmissao,
                    OPERACAO: nota.OPERACAO === 'I' ? 'Interna' : nota.OPERACAO === 'E' ? 'Entrada' : 'Saída',
                    CFOP_NF: nota.CFOP,
                    TRANSACAO_NATUREZA: transacao?.NATUREZA || '',
                    CLIENTE_NOME: cliente?.NOME || nota.CLI_FOR || '',
                    CLIENTE_CPF_CNPJ: cliente?.CPF || nota.CPF_NFCE || '',
                    CLIENTE_ENDERECO: cliente?.ENDERECO || nota.ENDERECO_CLI_FOR || '',
                    CLIENTE_NUMERO: cliente?.NUMERO || nota.NUMERO_CLI_FOR || '',
                    CLIENTE_BAIRRO: cliente?.BAIRRO || nota.BAIRRO_CLI_FOR || '',
                    CLIENTE_CIDADE: cliente?.CIDADE || nota.CIDADE_CLI_FOR || '',
                    CLIENTE_UF: cliente?.ESTADO || nota.ESTADO_CLI_FOR || '',
                    CLIENTE_CEP: cliente?.CEP || nota.CEP_CLI_FOR || '',
                    CLIENTE_TELEFONE: cliente?.TELEFONE_COM || cliente?.CELULAR || '',
                    CLIENTE_EMAIL: cliente?.EMAIL || cliente?.EMAIL_FISCAL || '',
                    TOTAL_NF: nota.TOTAL_NF,
                    VALOR_FRETE: nota.VALOR_FRETE || 0,
                    VALOR_SEGURO: nota.VALOR_SEGURO || 0,
                    DESCONTO_NF: nota.DESC_PROD || 0,
                    OBSERVACOES: nota.OBSERVACOES || '',
                    ITEM: item.ITEM,
                    CODIGO_PRODUTO: item.PRODUTO,
                    DESCRICAO_PRODUTO: (item as any).PRODUTO_DESCRICAO || item.COMPLEMENTO || '',
                    NCM: (item as any).CLASS_FISCAL_NCM || '',
                    CEST: (item as any).CLASS_FISCAL_COD_CEST || '',
                    UNIDADE: (item as any).UNID_PROD_SIGLA || item.UNIDADE || 'UN',
                    QUANTIDADE: item.QUANTIDADE,
                    VALOR_UNITARIO: item.VALOR_UNITARIO,
                    DESCONTO_PRODUTO: item.VALOR_DESCONTO || 0,
                    TOTAL_ITEM: item.TOTAL,
                    CFOP_ITEM: item.CFOP,
                    CST_ICMS: item.CST,
                    ALIQ_ICMS: item.ALIQ_ICMS,
                    BASE_ICMS: trib?.BASE_ICMS || 0,
                    VALOR_ICMS: trib?.VALOR_ICMS || 0,
                    VALOR_IPI: trib?.VALOR_IPI || 0,
                    VALOR_PIS: trib?.VALOR_PIS || 0,
                    VALOR_COFINS: trib?.VALOR_COFINS || 0,
                    PESO_BRUTO: item.PESO_BRUTO || 0,
                    PESO_LIQUIDO: item.PESO_LIQUIDO || 0,
                };

                worksheet.addRow(rowData);
            }
        }

        const numberFormat = '#,##0.00';
        for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);
            ['TOTAL_NF', 'VALOR_FRETE', 'VALOR_SEGURO', 'DESCONTO_NF',
             'VALOR_UNITARIO', 'DESCONTO_PRODUTO', 'TOTAL_ITEM', 'BASE_ICMS', 'VALOR_ICMS',
             'VALOR_IPI', 'VALOR_PIS', 'VALOR_COFINS', 'PESO_BRUTO', 'PESO_LIQUIDO',
             'QUANTIDADE', 'ALIQ_ICMS'
            ].forEach(key => {
                const colIdx = columns.findIndex(c => c.key === key) + 1;
                if (colIdx > 0) {
                    const cell = row.getCell(colIdx);
                    cell.numFmt = numberFormat;
                }
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
}
