# 🧾 Plano: Envio de Notas Fiscais (NF-e) para o Bling

## Legenda
- [ ] Pendente
- [x] Concluído

---

## 1. Camada de Dados

- [x] `src/core/invoices/data/nf-data-acess.ts` — `NfRepository`
  - [x] `findNotasByPedido` — busca NF pelo código do pedido
  - [x] `findDadosNota` — busca dados da NF pelo código
  - [x] `findItensNota` — busca itens da NF (com NCM, CEST, unidade)
  - [x] `findTributosItem` — busca tributos dos itens
  - [x] `findCliente` / `findFornecedor` — dados do cliente/fornecedor
  - [x] `findInstallments` — busca parcelas do financeiro
  - [x] `findNotasPendentesEnvio` — NFs pendentes (JOIN `cad_nf` + `pedidos`)
  - [x] `updateIdBling` — salva ID retornado pelo Bling na `cad_nf`

- [x] `src/core/invoices/data/api-config-nfe.ts` — `ApiConfigNfeRepository`
  - [x] `findConfigNfe` — consulta config de natureza de operação
  - [x] `insertConfigNfe` — insere configuração
  - [x] `partialUpdateConfigNfe` — atualização parcial
  - [ ] **Corrigir typo**: `confi_nfe` → `config_nfe` no `insertConfigNfe`

## 2. Mapeamento (Mapper)

- [x] `src/core/invoices/mapping/nf-mapper.ts` — `NfMapper`
  - [x] Interfaces Bling (`BlingNotaFiscal`, `BlingItem`, `BlingParcela`, `BlingTransporte`, `BlingDocReferenciado`)
  - [x] `mapToBlingFormat` — conversão principal
  - [x] `mapContato` — mapeamento do cliente
  - [x] `mapItens` — itens com dados fiscais
  - [x] `mapParcelas` — parcelas
  - [x] `mapTransporte` — frete/transporte

- [ ] **Integrar natureza de operação dinâmica**
  - [ ] Hoje o `id` está **hardcoded** (`15110323517`)
  - [ ] Buscar da `config_nfe` conforme `TRANSACAO` da NF

- [ ] **Corrigir loop de parcelas**: `i <= QTDE_PARCELAS` → `i < QTDE_PARCELAS` (cria 1 extra)
- [ ] **Mapear `formaPagamento.id`** dinamicamente (hoje fixo `1`)

## 3. Serviços Core

- [x] `src/core/invoices/services/http-request-nf.ts` — `SyncNf`
  - [x] `postNf` — `POST /nfe` no Bling

- [x] `src/core/invoices/services/sync-wire-tapping-operations.ts` — `SyncWiretappingOperations`
  - [x] `getWiretappingOperations` — busca naturezas de operação do Bling

- [ ] **Criar orquestrador**: `src/core/invoices/services/sync-nf.ts`
  - [ ] `enviarNotasPendentes()` — fluxo completo:
    1. Busca NFs pendentes
    2. Para cada NF: carrega itens, tributos, cliente, parcelas
    3. Busca natureza de operação na `config_nfe`
    4. Mapeia via `NfMapper`
    5. Envia via `SyncNf.postNf`
    6. Sucesso → `updateIdBling` + loga
    7. Erro → loga campos de erro do Bling e continua

## 4. Job Automatizado (Cron)

- [ ] **Criar**: `src/jobs/job-nf.ts`
  - [ ] Classe `JobNf` com método `enviarNfs()`
  - [ ] Registrar no `src/jobs/main.ts`
  - [ ] Variável de ambiente `ENVIAR_NF` + campo `enviar_nf` na `config`

## 5. Controller e Rotas

- [ ] **Controller**: `src/core/invoices/controller/nf-controller.ts`
  - [ ] `listarNfs()` — lista NFs pendentes/enviadas
  - [ ] `enviarNfManual()` — envio manual de NF específica
  - [ ] `configurarNaturezaOperacao()` — configurar mapeamento

- [ ] **Rotas**: `src/web/routes.ts`
  - [ ] `GET /nfs` — listagem
  - [ ] `POST /api/nf/enviar` — envio manual
  - [ ] `GET /config-nfe` — página de configuração
  - [ ] `POST /api/config-nfe` — salvar config

- [ ] **Views**
  - [ ] **Corrigir** `src/web/Views/config-nfe/index.ejs` (hoje mostra categorias)
  - [ ] Criar `src/web/Views/nfs/index.ejs`
  - [ ] Adicionar links no menu/sidebar

## 6. Integração com Pedidos

- [ ] Disparar envio automático quando pedido for finalizado (`SITUACAO = 'FI'`) com NF emitida
- [ ] Atualizar campo `nf` na tabela `pedidos` da integração

## 7. Correções Pontuais

- [ ] `api-config-nfe.ts`: `confi_nfe` → `config_nfe`
- [ ] `nf-mapper.ts`: `i <= QTDE_PARCELAS` → `i < QTDE_PARCELAS`
- [ ] `nf-mapper.ts`: `formaPagamento.id` dinâmico
- [ ] Revisar campo `informacoesAdicionais` nos itens

## 8. Futuro (próximas iterações)

- [ ] Notas de **entrada** (devolução/compra)
- [ ] **Documento referenciado** na NF-e
- [ ] **Retry** com backoff em falhas
- [ ] **Cancelamento** de NF-e no Bling
- [ ] **Carta de correção** (CC-e)
- [ ] Dashboard com métricas de envio
