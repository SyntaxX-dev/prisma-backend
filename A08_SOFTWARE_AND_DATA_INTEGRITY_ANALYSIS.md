A08 Software and Data Integrity Failures

Este documento detalha as protecoes contra falhas de integridade de software e dados ja presentes no seu projeto. Ele explica o que cada componente faz, se e nativo ou customizado, e como protege sua aplicacao.

Integridade de Dados com ValidationPipe

O que e:
O ValidationPipe e uma ferramenta nativa do NestJS que usa a biblioteca class-validator para verificar e limpar dados recebidos antes que eles cheguem aos seus controladores.

Status no seu codigo:
Implementado por voce.
O NestJS nao habilita isso por padrao. Voce ativou explicitamente no arquivo src/main.ts na linha app.useGlobalPipes.

Detalhe Tecnico - O que e a Whitelist:
Voce configurou whitelist: true. Isso funciona como um filtro de seguranca. Se o seu DTO (Data Transfer Object) define apenas os campos email e senha, mas um atacante envia um JSON contendo email, senha e isAdmin: true, o ValidationPipe remove silenciosamente o campo isAdmin antes que o objeto chegue na sua regra de negocio. Isso impede ataques de Mass Assignment, onde um usuario tenta alterar campos restritos que nao deveriam ser acessiveis publicamente.

Exemplo do seu codigo:
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, transform: true }),
);

Integridade de Software e Dependencias - Package Lock

O que e:
O package-lock.json e um arquivo gerado automaticamente pelo NPM que funciona como uma assinatura digital de toda a sua arvore de dependencias.

Status no seu codigo:
Implementado e mantido por voce.
Voce tambem definiu a secao engines no package.json para restringir versoes do Node.js.

Detalhe Tecnico:
Quando voce instala uma biblioteca, ela pode depender de dezenas de outras. Sem o lockfile, rodar npm install em producao poderia baixar versoes mais novas dessas sub-dependencias que contenham bugs ou virus (ataques de supply chain). O seu arquivo package-lock.json garante que a producao use extamente os mesmos 320KB de codigos de terceiros que voce testou na sua maquina, byte por byte. A secao engines impede que alguem tente rodar seu sistema em uma versao antiga e vulneravel do Node.js.

Exemplo do seu codigo:
"engines": {
  "node": ">=20.18.0 <21.0.0",
  "npm": ">=10.0.0"
}

Integridade de Tokens e Sessao - JWT Signature

O que e:
JSON Web Token (JWT) e o padrao de mercado para sessoes stateless. A integridade e garantida por uma assinatura criptografica (HMAC SHA256) gerada pelo servidor.

Status no seu codigo:
Implementado por voce no AuthModule.
Voce configurou o modulo JwtModule do NestJS para usar uma chave secreta e assinar os tokens.

Detalhe Tecnico - A Assinatura:
O token tem tres partes: header, payload (dados do usuario) e signature. A assinatura e o resultado matematico de combinar o payload com sua chave secreta (JWT_SECRET). Se um hacker tentar mudar o ID do usuario no payload de 10 para 1, a matematica da assinatura nao batera mais com o conteudo, pois ele nao tem a sua chave secreta para gerar uma nova assinatura valida. O servidor rejeitara o token instantaneamente. Isso garante a integridade da identidade do usuario sem precisar consultar o banco de dados a cada requisicao.

Exemplo do seu codigo:

JwtModule.registerAsync({
  useFactory: (): JwtModuleOptions => {
    return {
      secret: config.secret, // Sua chave privada garante a integridade
      signOptions: { expiresIn: config.expiresIn },
    };
  },
})

Protecao de Transporte com Helmet e HSTS

O que e:
Helmet e uma colecao de middlewares de seguranca para Express/NestJS que ajusta headers HTTP. HSTS (HTTP Strict Transport Security) e uma politica que obriga navegadores a usarem apenas HTTPS.

Status no seu codigo:
Implementado por voce.
Nao vem ativado por padrao no NestJS. Voce instalou o pacote helmet e o configurou explicitamente no src/main.ts.

Detalhe Tecnico:
Voce ativou o strictTransportSecurity (HSTS). Isso envia um header para o navegador do usuario dizendo: Pelos proximos 1 ano, nunca aceite conectar neste site se nao for via HTTPS seguro. Mesmo que o usuario digite http://, o navegador convertera para https:// antes de enviar a requisicao. Isso garante a integridade dos dados em transito, impedindo que hackers na mesma rede Wi-Fi interceptem ou modifiquem os dados enviados (ataques Man-in-the-Middle).

Exemplo do seu codigo:
app.use(
  helmet({
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
