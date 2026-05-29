import { DateService } from "../../../shared/utils/date-service";
import { ApiConfigNfeRepository } from "../data/api-config-nfe";
import { NfRepository } from "../data/nf-data-acess";
import { NfMapper } from "../mapping/nf-mapper";



export class montarNf{
    static async exec (codigo_pedido_sistema:number){
        const nfRepository = new NfRepository();
        const apiConfigNfeRepository = new ApiConfigNfeRepository();

        const nfMapper = new NfMapper();
        
        const dadosNota = await nfRepository.findNotasByPedido(codigo_pedido_sistema);
            const codigoTransacaoSistema =  dadosNota[0].TRANSACAO;
            const codigoNf = dadosNota[0].CODIGO;
            const codigoCliente = dadosNota[0].CODIGO_CLI_FOR;

         const itensNota = await nfRepository.findItensNota(codigoNf);
         
          const dadosMvtTributos = await  nfRepository.findTributosItem(codigoNf);

          const dadosParcelas = await nfRepository.findInstallments(codigoNf);
        const dadosTransacao = await apiConfigNfeRepository.findConfigNfe({ codigo_transacao_sistema:String(codigoTransacaoSistema), });

        const dadosCliente = await nfRepository.findCliente(codigoCliente);

        // --- DEBUG LOGS ---
        console.log('=== DEBUG montarNf ===');
        console.log('codigo_pedido_sistema:', codigo_pedido_sistema);
        console.log('codigoNf (CODIGO cad_nf):', codigoNf);
        console.log('TOTAL_NF:', dadosNota[0].TOTAL_NF);
        console.log('VALOR_FRETE:', dadosNota[0].VALOR_FRETE);
        console.log('FRETE:', dadosNota[0].FRETE);
        console.log('VALOR_SEGURO:', dadosNota[0].VALOR_SEGURO);
        console.log('VALOR_OUTRAS_DESPESAS:', dadosNota[0].VALOR_OUTRAS_DESPESAS);
        console.log('DESC_PROD:', dadosNota[0].DESC_PROD);
        console.log('QTDE_PARCELAS:', dadosNota[0].QTDE_PARCELAS);
        console.log('dadosParcelas (ct_receb):', JSON.stringify(dadosParcelas, null, 2));
        console.log('Qtd itens:', itensNota.length);
        itensNota.forEach((item, i) => {
            console.log(`Item ${i}: PRODUTO=${item.PRODUTO}, VALOR_UNITARIO=${item.VALOR_UNITARIO}, QUANTIDADE=${item.QUANTIDADE}, TOTAL=${item.TOTAL}`);
        });
        console.log('========================');

    const nfMapped  = await nfMapper.mapToBlingFormat(
            dadosNota[0],
            itensNota,
            dadosCliente[0],
            dadosMvtTributos,
            dadosParcelas,
            dadosTransacao[0],
            'e4b59ad18df05cb10e61d69c9c3d6fa1'
        )

        return nfMapped;
    }
}