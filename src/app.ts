import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { transactionsRoutes } from './routes/transactions'

export const app = fastify()

// A ordem de execução dos plugins é a mesma em que eles são registrados pelo Fastify, portanto, temos que cuidar com a ordem abaixo.

// cookie é um plugin que fornece uma interface fácil de usar para definir, recuperar e gerenciar cookies no contexto do Fastify
// O plugin adiciona o objeto cookies à solicitação (request) e resposta (response) do Fastify, permitindo a manipulação fácil de cookies
app.register(cookie)

// transactionsRoutes é um plugin que contém rotas relacionadas a transações
app.register(transactionsRoutes, {
  prefix: 'transactions', // define que todas as rotas dentro desse plugin terão o caminho prefixado com /transactions
})

/*
Observações:
- O parâmetro prefix no método register do Fastify serve para definir um prefixo para todas as rotas registradas por um plugin específico. Isso é útil quando 
você deseja agrupar um conjunto de rotas relacionadas sob um caminho comum.
*/
