import { execSync } from 'node:child_process'
import { afterAll, beforeAll, it, describe, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

// A função describe é usada para agrupar testes em blocos lógicos chamados de "suites" (conjuntos) e "specs" (especificações).
describe('Transactions routes', () => {
  // beforeAll é uma função que é executada uma vez antes de todos os testes deste conjunto.
  // A função passada para beforeAll garante que a aplicação esteja pronta para receber solicitações antes de iniciar os testes.
  beforeAll(async () => {
    await app.ready()
  })

  // afterAll é uma função que é executada uma vez após a conclusão de todos os testes deste conjunto.
  // A função passada para afterAll garante que a aplicação seja fechada para limpar qualquer estado ou recurso que possa ter sido criado durante os testes.
  afterAll(async () => {
    await app.close()
  })

  // beforeEach é uma função que é executada antes de cada teste.
  // A função passada para beforeEach garante que o banco de dados esteja limpo antes de cada teste e que as migrações tenham sido realizadas.
  beforeEach(() => {
    // A função execSync pode executar de dentro da aplicação Node qualquer comando que seja executável no terminal.
    // O comando é executado de forma síncrona, o que significa que o Node.js aguardará até que o comando seja concluído antes de continuar a execução do programa.
    execSync('npm run knex migrate:rollback --all') // desfaz todas as migrações no banco de dados test.db
    execSync('npm run knex migrate:latest') // aplica as migrações no banco de dados test.db
  })

  // test('use can create a new transaction', async () => {
  //   // Solicitação HTTP para a aplicação (cria uma transação)
  //   await request(app.server)
  //     .post('/transactions') // especifica que é uma solicitação do tipo POST para a rota '/transactions'
  //     .send({
  //       title: 'New transaction',
  //       amount: 5000,
  //       type: 'credit',
  //     }) // envia dados no corpo da solicitação, simulando a criação de uma nova transação
  //     .expect(201) // verifica se a resposta da API possui um código de status HTTP 201 (Created), indicando que a transação foi criada com sucesso
  // })

  // A função it faz a mesma coisa que a função test. Geralmente, usamos a função it para fornecer a descrição do teste seguindo o padrão "it should be able"
  it('should be able to create a new transaction', async () => {
    // Solicitação HTTP para a aplicação (cria uma transação)
    await request(app.server)
      .post('/transactions') // especifica que é uma solicitação do tipo POST para a rota '/transactions'
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      }) // envia dados no corpo da solicitação, simulando a criação de uma nova transação
      .expect(201) // verifica se a resposta da API possui um código de status HTTP 201 (Created), indicando que a transação foi criada com sucesso
  })

  it('should be able to list all transactions', async () => {
    // Cria uma transação
    const createTransactionResponse = await request(app.server)
      .post('/transactions') // especifica que é uma solicitação do tipo POST para a rota '/transactions'
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    // Obtém cookies da resposta da transação criada
    const cookies = createTransactionResponse.get('Set-Cookie')

    // Lista todas as transações usando os cookies
    const listTransactionsResponse = await request(app.server)
      .get('/transactions') // especifica que é uma solicitação do tipo GET para a rota '/transactions'
      .set('Cookie', cookies) // adiciona os cookies ao cabeçalho da solitação
      .expect(200) // verifica se a resposta da API possui um código de status HTTP 200 (Success), indicando que a requisição foi bem sucedida

    // Verifica se a resposta contém as informações esperadas
    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    ])
  })

  it('should be able to get a specific transaction', async () => {
    // Cria uma transação
    const createTransactionResponse = await request(app.server)
      .post('/transactions') // especifica que é uma solicitação do tipo POST para a rota '/transactions'
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    // Obtém cookies da resposta da transação criada
    const cookies = createTransactionResponse.get('Set-Cookie')

    // Lista todas as transações usando os cookies
    const listTransactionsResponse = await request(app.server)
      .get('/transactions') // especifica que é uma solicitação do tipo GET para a rota '/transactions'
      .set('Cookie', cookies) // adiciona os cookies ao cabeçalho da solitação
      .expect(200) // verifica se a resposta da API possui um código de status HTTP 200 (Success), indicando que a requisição foi bem sucedida

    const transactionId = listTransactionsResponse.body.transactions[0].id

    // Obtém uma transação pelo id
    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`) // especifica que é uma solicitação do tipo GET para a rota '/transactions/:id'
      .set('Cookie', cookies) // adiciona os cookies ao cabeçalho da solitação
      .expect(200) // verifica se a resposta da API possui um código de status HTTP 200 (Success), indicando que a requisição foi bem sucedida

    // Verifica se a resposta contém as informações esperadas
    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    )
  })

  it('should be able to get the summary', async () => {
    // Cria uma transação (crédito)
    const createTransactionResponse = await request(app.server)
      .post('/transactions') // especifica que é uma solicitação do tipo POST para a rota '/transactions'
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit',
      })

    // Obtém cookies da resposta da transação criada
    const cookies = createTransactionResponse.get('Set-Cookie')

    // Cria uma transação (débito)
    await request(app.server)
      .post('/transactions') // especifica que é uma solicitação do tipo POST para a rota '/transactions'
      .set('Cookie', cookies) // adiciona os cookies ao cabeçalho da solitação
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    // Obtém o resumo de todas as transações do usuário
    const summaryResponse = await request(app.server)
      .get('/transactions/summary') // especifica que é uma solicitação do tipo GET para a rota '/transactions/summary'
      .set('Cookie', cookies) // adiciona os cookies ao cabeçalho da solitação
      .expect(200) // verifica se a resposta da API possui um código de status HTTP 200 (Success), indicando que a requisição foi bem sucedida

    // Verifica se a resposta contém as informações esperadas
    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})

/*
Observações:
- Por baixo dos panos de qualquer framework para Node (Fastify, Express, etc) existe um servidor Node; o que muda é a forma como esse servidor é acessado. No 
caso do Fastify, podemos acessar esse servidor da seguinte forma:
const app = fastify()
pp.server

- Um teste não deve depender de outro, ou seja, cada teste deve ser escrito partindo do princípio que os outros testes não existem. Se ao escrever um teste, 
você percebe que precisa executar ações que são executadas em outro teste, o código deste outro teste deve estar dentro do teste que você está criando. Por 
exemplo, para listar transações é necessário ter criado alguma transação antes, então o código para simular a criação de transações deve estar dentro do teste 
de listagem de transações.

- Em muitas situações precisamos limpar o banco de dados antes de cada teste, pois o resultado de um teste pode influênciar os demais testes. Por exemplo, se 
nessa aplicação não estivessímos usando o cookie sessionId para identificar qual usuário criou uma determinada transação, veríamos duas transações criadas (uma 
em cada teste), mesmo tendo executado npm test apenas uma vez. Daí, poderíamos concluir erroneamente que existe um problema no código de criação de transações. 
*/
