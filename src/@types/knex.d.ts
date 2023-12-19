// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex'
// import 'knex' // mesmo resultado da importação acima

// Aqui, estamos dizendo ao TypeScript que vamos estender ou modificar as definições de tipos dentro do módulo 'knex/types/tables'.
// Portanto, essa é a definição de tipos que será puxada quando importarmos Knex em algum arquivo
declare module 'knex/types/tables' {
  // Aqui, estamos estendendo a interface Tables adicionando novas propriedades. As propriedades existentes na interface original ainda permanecem.
  export interface Tables {
    transactions: {
      id: string
      title: string
      amount: number
      created_at: string
      session_id?: string
    }
  }
}

/*
Observações:
- A importação da interface original é necessária para estender a tipagem fornecida pela biblioteca knex. Sem essa importação, o TypeScript entenderá que 
estamos criando um tipo do zero.

Links:
https://knexjs.org/guide/#typescript
*/
