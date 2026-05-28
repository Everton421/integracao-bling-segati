import { CadNf } from "../../../interfaces/cad_nf";
import { CadClie } from "../../../interfaces/cad_clie";
import { ItensNota,   } from "../data/nf-data-acess";
import { MvtoTributos } from "../../../interfaces/mvto_tributos";
import { CtReceb } from "../../../interfaces/ct_receb";
import { DateService } from "../../../shared/utils/date-service";
import { config_nfe } from "../../../interfaces/config_nfe";

export interface BlingNotaFiscal {
    tipo: number;
    numero: string;
    dataOperacao: string;
    contato: {
        nome: string;
        tipoPessoa: string;
        numeroDocumento: string;
        ie: string;
        rg?: string;
        contribuinte: number;
        telefone: string;
        email: string;
        endereco: {
            endereco: string;
            numero: string;
            complemento?: string;
            bairro: string;
            cep: string;
            municipio: string;
            uf: string;
            pais: string;
        };
    };
    naturezaOperacao?: {
        id: number;
    };
    loja: {
        id: number;
        numero: string;
    };
    finalidade: number;
    tipoNota: string;
    seguro?: number;
    despesas?: number;
    desconto?: number;
    observacoes?: string;
    itens: BlingItem[];
    parcelas?: BlingParcela[];
    transporte?: BlingTransporte;
    documentoReferenciado?: BlingDocReferenciado;
    documentosReferenciados?: BlingDocReferenciado[];
}

export interface BlingItem {
    codigo: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    valor: number;
    tipo?: string;
    pesoBruto?: number;
    pesoLiquido?: number;
    numeroPedidoCompra?: string;
    classificacaoFiscal: string;
    cest?: string;
    codigoServico?: string;
    origem?: number;
    informacoesAdicionais?: string;
    documentoReferenciado?: {
        chaveAcesso: string;
        numeroItem: string;
    };
}

export interface BlingParcela {
    data: string;
    valor: number;
    observacoes?: string;
    caut?: string;
    formaPagamento: {
        id: number;
    };
}

export interface BlingTransporte {
    freightPorConta: number;
    freight?: number;
    veiculo?: {
        placa: string;
        uf: string;
        marca?: string;
    };
    transportador?: {
        nome: string;
        numeroDocumento: string;
        ie?: string;
        endereco?: {
            endereco: string;
            municipio: string;
            uf: string;
        };
    };
    volume?: {
        quantidade: number;
        especie: number;
        numero?: string;
        pesoBruto?: number;
        pesoLiquido?: number;
    };
    volumes?: Array<{
        servico: string;
        codigoRastreamento: string;
    }>;
    etiqueta?: {
        nome: string;
        endereco: string;
        numero: string;
        complemento?: string;
        municipio: string;
        uf: string;
        cep: string;
        bairro: string;
    };
}

export interface BlingDocReferenciado {
    modelo: string;
    data: string;
    numero: string;
    serie: string;
    contadorOrdemOperacao?: string;
    chaveAcesso?: string;

}

export class NfMapper {

    private dateService = new DateService();

    mapToBlingFormat(
        dadosNota: CadNf,
        itens: ItensNota[],
        cliente: CadClie | null,
        tributaria: MvtoTributos[],
        dadosParcelas: CtReceb[],
        dadosTransacao:config_nfe 
    ): BlingNotaFiscal {
        return {
            tipo: this.mapTipoNota(dadosNota.OPERACAO),
            numero: String(dadosNota.NUMERO_NF),
            dataOperacao: this.formatarData(dadosNota.DATA_EMISSAO),
            contato: this.mapContato(cliente, dadosNota),
            naturezaOperacao: {
                id: Number(dadosTransacao.id_natureza_operacao)  
            },
            loja: {
                id: dadosNota.FILIAL,
                numero: `FILIAL_${dadosNota.FILIAL}`
            },
            finalidade: 1,
            tipoNota: this.mapTipoNotaFormat(dadosNota.OPERACAO),
            seguro: dadosNota.VALOR_SEGURO || 0,
            despesas: dadosNota.VALOR_OUTRAS_DESPESAS || 0,
            desconto: dadosNota.DESC_PROD || 0,
            observacoes: dadosNota.OBSERVACOES,
            itens: this.mapItens(itens, tributaria),
            parcelas: this.mapParcelas(dadosNota),
            transporte: this.mapTransporte(dadosNota)
        };
    }

    private mapTipoNota(operacao?: string): number {
        if (operacao === 'E') return 1;
        if (operacao === 'S') return 2;
        return 1;
    }

    private mapTipoNotaFormat(operacao?: string): string {
        if (operacao === 'E') return "00";
        if (operacao === 'S') return "01";
        return "01";
    }

 
    private formatarData(data: string | Date): string {
        if (!data) return new Date().toISOString().slice(0, 19).replace('T', ' ');
        const d = new Date(data);
        return d.toISOString().slice(0, 19).replace('T', ' ');
    }

    private formatarDataDate(data: string | Date): string {
        if (!data) return new Date().toISOString().split('T')[0];
        return new Date(data).toISOString().split('T')[0];
    }

    private mapContato(cliente: CadClie | null, dadosNota: CadNf): BlingNotaFiscal['contato'] {
        if (!cliente) {
            return {
                nome: dadosNota.CLI_FOR || "Consumidor",
                tipoPessoa: dadosNota.CPF_NFCE?.length === 11 ? "F" : "J",
                numeroDocumento: dadosNota.CPF_NFCE || "",
                ie: "",
                contribuinte: 1,
                telefone: "",
                email: "",
                endereco: {
                    endereco: dadosNota.ENDERECO_CLI_FOR || "",
                    numero: dadosNota.NUMERO_CLI_FOR || "",
                    complemento: dadosNota.COMPLEMENTO_CLI_FOR,
                    bairro: dadosNota.BAIRRO_CLI_FOR || "",
                    cep: dadosNota.CEP_CLI_FOR || "",
                    municipio: dadosNota.CIDADE_CLI_FOR || "",
                    uf: dadosNota.ESTADO_CLI_FOR || "",
                    pais: "1058"
                }
            };
        }

        return {
            nome: cliente.NOME,
            tipoPessoa: cliente.FIS_JUR === 'F' ? "F" : "J",
            numeroDocumento: cliente.CPF,
            ie: "",
            rg: cliente.RG,
            contribuinte: cliente.CONTRIB === 'S' ? 1 : 9,
            telefone: cliente.TELEFONE_COM || cliente.CELULAR || "",
            email: cliente.EMAIL || cliente.EMAIL_FISCAL || "",
            endereco: {
                endereco: cliente.ENDERECO,
                numero: cliente.NUMERO,
                complemento: cliente.COMPLEMENTO,
                bairro: cliente.BAIRRO,
                cep: cliente.CEP,
                municipio: cliente.CIDADE,
                uf: cliente.ESTADO,
                pais: cliente.PAIS || "1058"
            }
        };
    }

    private mapItens(itens: ItensNota[], tributaria: MvtoTributos[]): BlingItem[] {
        return itens.map((item, index) => {
            const tribItem = tributaria.find(t => t.ITEM === item.ITEM);
            const trib = tribItem || {
                BASE_ICMS: 0,
                VALOR_ICMS: 0,
                VALOR_IPI: 0,
                VALOR_PIS: 0,
                VALOR_COFINS: 0
            };

            return {
                codigo: String(item.PRODUTO),
                descricao: item.PRODUTO_DESCRICAO || item.COMPLEMENTO || "",
                unidade: item.UNID_PROD_SIGLA || item.UNIDADE || "UN",
                quantidade: item.QUANTIDADE,
                valor: Number(item.VALOR_UNITARIO).toFixed(2),
                tipo: "P",
                numeroPedidoCompra: String(item.CHAVE_MVTO),
                classificacaoFiscal: item.CLASS_FISCAL_NCM || "0000.00.00",
                cest: item.CLASS_FISCAL_COD_CEST || "",
                informacoesAdicionais: this.buildInformacoesAdicionais(item, trib)
            };
        });
    }

    private buildInformacoesAdicionais(item: ItensNota, trib: any): string {
        const parts: string[] = [];

        if (item.CST) parts.push(`CST: ${item.CST}`);
        if (trib.VALOR_ICMS) parts.push(`ICMS: ${trib.VALOR_ICMS}`);
        if (trib.VALOR_IPI) parts.push(`IPI: ${trib.VALOR_IPI}`);
        if (item.ALIQ_ICMS) parts.push(`Aliq ICM: ${item.ALIQ_ICMS}%`);
        if (item.PAUTA_SUBST) parts.push(`Pauta ST: ${item.PAUTA_SUBST}`);

        return parts.join(' | ');
    }

  
    private mapParcelas(dadosNota: CadNf ): BlingParcela[] {
        if ( dadosNota.QTDE_PARCELAS === 0 ) return [];

        const parcelas: BlingParcela[] = [];

            const valor = dadosNota.TOTAL_NF / dadosNota.QTDE_PARCELAS; 
        for (let i = 0; i <= dadosNota.QTDE_PARCELAS ; i++) {
            parcelas.push({
                data: DateService.formatarData(dadosNota.DATA_EMISSAO) as any, 
                valor: Number(valor.toFixed(2)),
                formaPagamento: {
                    id:  1
                }
            });
        }

        return parcelas;
    }


  
    private mapTransporte(dadosNota: CadNf): BlingTransporte | undefined {
        const mapFretePorConta = (frete: string): number => {
            const map: Record<string, number> = {
                'S': 0,
                'F': 1,
                'C': 2,
                'T': 3,
                'R': 4,
                'E': 9
            };
            return map[frete] ?? 0;
        };

        if (!dadosNota.FRETE || dadosNota.FRETE === 'S') return undefined;

        return {
            freightPorConta: mapFretePorConta(dadosNota.FRETE),
            freight: dadosNota.VALOR_FRETE || 0,
            veiculo: dadosNota.PLACA_VEICULO ? {
                placa: dadosNota.PLACA_VEICULO,
                uf: dadosNota.ESTADO_VEICULO || "",
                marca: dadosNota.MARCA
            } : undefined,
            volume: dadosNota.QUANTIDADE ? {
                quantidade: dadosNota.QUANTIDADE,
                especie: 1,
                pesoBruto: dadosNota.PESO_BRUTO,
                pesoLiquido: dadosNota.PESO_LIQUIDO
            } : undefined
        };
    }
}