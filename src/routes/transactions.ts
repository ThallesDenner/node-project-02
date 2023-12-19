import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

// Todo plugin do Fastify precisa ser uma função assíncrona, por isso transactionsRoutes é assíncrona
export async function transactionsRoutes(app: FastifyInstance) {
  // O hook passado para o método addHook será executado assim que qualquer uma das rotas pertencentes ao contexto do plugin transactionsRoutes for acessada
  // Se quisermos que este hook seja executado assim que qualquer rota da aplicação for acessada, então colocamos o código abaixo em src/server.ts (antes dos plugins de rotas)
  app.addHook('preHandler', async (request, response) => {
    console.log(`[${request.method} ${request.url}]`)
  })

  // Criação de transações
  app.post('/', async (request, response) => {
    // Esquema Zod que define as regras para o corpo da requisição
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    // A função parse realiza tanto a conversão quanto a validação dos dados de entrada (request.body) conforme o esquema definido (createTransactionBodySchema)
    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    // Cookies
    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      response.setCookie('sessionId', sessionId, {
        path: '/', // os cookies podem ser categorizados de acordo com as rotas da aplicação. No caso, qualquer rota da aplicação poderá acessar esse cookie
        maxAge: 60 * 60 * 24 * 7, // o cookie irá expirar em 7 dias
      })
    }

    // Insere um novo registro na tabela transactions
    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return response.status(201).send() // o status HTTP 201 é utilizado como resposta de sucesso, indica que a requisição foi bem sucedida e que um novo recurso foi criado
  })

  // Listagem de todas as transações
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists], // as funções de preHandler são executadas antes do handler (função que lida com a rota)
    },
    async (request) => {
      const { sessionId } = request.cookies

      // Seleciona todos os registros da tabela transactions associados ao sessionId obtido dos cookies
      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      // A vantagem de retornar um objeto em vez do array é que, caso precisarmos, será mais fácil adicionar ou remover informações futuramente
      return { transactions }
    },
  )

  // Obter uma transação específica
  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists], // as funções de preHandler são executadas antes do handler (função que lida com a rota)
    },
    async (request) => {
      // Esquema Zod que define as regras para o parâmetro da rota
      const getTransactionsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      // A função parse realiza tanto a conversão quanto a validação dos dados de entrada (request.params) conforme o esquema definido (getTransactionsParamsSchema)
      const { id } = getTransactionsParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      // Seleciona o registro da tabela transactions associado ao id passado na requisição e ao sessionId obtido dos cookies
      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first() // por padrão, knex retorna um array. O método first retorna apenas o primeiro resultado, daí temos um objeto

      // A vantagem de retornar um objeto em vez do array é que, caso precisarmos, será mais fácil adicionar ou remover informações futuramente
      return { transaction }
    },
  )

  // Obter o resumo das transações
  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists], // as funções de preHandler são executadas antes do handler (função que lida com a rota)
    },
    async (request) => {
      const { sessionId } = request.cookies

      // Devolve a soma das transações (coluna amount da tabela transactions) associadas ao sessionId obtido dos cookies
      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' }) // com { as: 'amount' }, estamos especificando um alías para a coluna sum('amount')
        .first() // por padrão, knex retorna um array. O método first retorna apenas o primeiro resultado, daí temos um objeto

      return { summary }
    },
  )
}

/*
Observações

O método parse do Zod realiza tanto a conversão quanto a validação dos dados de entrada conforme o esquema definido. Aqui estão os pontos-chave relacionados ao 
comportamento do método parse:
- Conversão: O método parse converte os dados brutos de entrada conforme as regras de tipo definidas no esquema Zod. Se um campo no esquema tiver uma regra que 
especifica um tipo específico (como z.number() ou z.string()), o método tentará converter o valor do campo para o tipo especificado.
- Validação: Além da conversão, o método parse valida os dados em relação às regras de validação definidas no esquema. Se os dados não estiverem em conformidade 
com qualquer uma das regras especificadas no esquema (por exemplo, tipo incorreto, valor ausente, ou falha em regras personalizadas), o método lançará uma 
exceção de validação.
- Exceções de Validação: Se ocorrerem erros de validação, o método parse lançará uma exceção. Essa exceção conterá informações detalhadas sobre os problemas 
encontrados durante a validação.
- Tipagem Segura: O resultado retornado pelo método parse é tipado conforme o esquema, proporcionando uma tipagem segura ao usar os dados convertidos. Isso 
significa que o TypeScript reconhecerá e aplicará os tipos especificados pelo esquema aos dados analisados.

Exemplo:

import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const rawData = {
  name: 'John Doe',
  age: '25', // Isso será convertido de string para number
  email: 'john.doe@example.com',
};

const parsedData = userSchema.parse(rawData);
console.log(parsedData);

No exemplo acima, o campo age no rawData é uma string, mas o esquema especifica que age deve ser do tipo number. O método parse converterá automaticamente a 
string para um número durante a análise. Se algum campo não estiver em conformidade com o esquema, uma exceção será lançada.
*/
