# Northstar Labs — painel executivo e SOC

Dashboard React/TypeScript com métricas executivas, alertas e stream de eventos.

## Executar

```bash
npm install
npm run dev
```

Sem `VITE_SOC_WEBSOCKET_URL`, o painel usa um fluxo demonstrativo local. Para dados reais, configure essa variável com o endereço `wss://` do backend e inicie o app novamente. A conexão reconecta com espera progressiva quando o servidor fica indisponível.

O backend pode enviar frames JSON no formato:

```json
{"type":"log","data":{"id":1,"time":"14:32:08.421","level":"WARN","source":"IDS-EDGE-03","message":"Tráfego anômalo detectado","ip":"203.0.113.8"}}
```

```json
{"type":"metrics","data":{"mrr":148200,"customers":342,"newCustomers":27,"retention":98.2,"churn":1.8,"cacPayback":7.2,"nps":72,"cash":2560000,"burn":142000}}
```

Frames inválidos e valores fora dos limites esperados são descartados. Mensagens de log são limitadas antes de entrar no estado da interface e exibidas como texto. Nenhum token de autenticação é mantido no estado local.

## Produção

```bash
npm run build
npm run preview
```

O CSS usa fontes do sistema, sem buscar fontes externas durante o carregamento. O bundle de produção é gerado em `dist/`.
