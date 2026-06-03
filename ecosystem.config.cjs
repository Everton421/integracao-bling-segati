const path = require('path');

module.exports = {
  apps: [{
    name: "integracao-bling",
    script: "./dist/server.js", // caminho para o seu script inicial
    cwd: "C:\\integracao-bling-segati", // CAMINHO ABSOLUTO DA PASTA DO PROJETO
    env: {
      NODE_ENV: "production",
    },
    // Isso força o carregamento do .env que está na pasta do CWD
    interpreter_args: "--env-file=.env" 
  }]
}