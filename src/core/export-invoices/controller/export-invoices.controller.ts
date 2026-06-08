import { Request, Response } from "express";
import { ExportInvoicesService } from "../services/export-invoices.service";
import { NfRepository } from "../data/nf-data-acess";

export class ExportInvoicesController {
    private service = new ExportInvoicesService();
    private nfRepository = new NfRepository();

    view = async (req: Request, res: Response) => {
        res.render('export-invoices/index');
    }

    listNotas = async (req: Request, res: Response) => {
        const { dataInicio, dataFim } = req.query;

        if (!dataInicio || !dataFim) {
            res.status(400).json({ error: 'Parâmetros dataInicio e dataFim são obrigatórios (formato YYYY-MM-DD)' });
            return;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dataInicio as string) || !dateRegex.test(dataFim as string)) {
            res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
            return;
        }

        try {
            const notas = await this.nfRepository.findResumoNotas(dataInicio as string, dataFim as string);
            res.json({ data: notas });
        } catch (error) {
            console.error('Erro ao listar notas fiscais:', error);
            res.status(500).json({ error: 'Erro interno ao buscar notas' });
        }
    }

    export = async (req: Request, res: Response) => {
        const { dataInicio, dataFim, codigos } = req.query;

        if (!dataInicio || !dataFim) {
            res.status(400).json({ error: 'Parâmetros dataInicio e dataFim são obrigatórios (formato YYYY-MM-DD)' });
            return;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dataInicio as string) || !dateRegex.test(dataFim as string)) {
            res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
            return;
        }

        try {
            const codigosArr = codigos
                ? String(codigos).split(',').map(Number).filter(n => !isNaN(n))
                : undefined;

            const buffer = await this.service.exportToExcel(
                dataInicio as string,
                dataFim as string,
                codigosArr && codigosArr.length > 0 ? codigosArr : undefined
            );

            const prefix = codigosArr && codigosArr.length > 0 ? 'notas-selecionadas' : `notas-fiscais-${dataInicio}-${dataFim}`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${prefix}.xlsx`);
            res.send(buffer);
        } catch (error) {
            console.error('Erro ao exportar notas fiscais:', error);
            res.status(500).json({ error: 'Erro interno ao gerar planilha' });
        }
    }
}
