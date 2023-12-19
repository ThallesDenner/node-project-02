import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (table) => {
    table.uuid('session_id').after('id').index()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (table) => {
    table.dropColumn('session_id')
  })
}

/*
Observações:
- O método index() acima diz ao banco de dados para criar um índice para a coluna session_id. Isto é útil para tornar as consultas mais rápidas, uma vez que 
serão realizadas muitas buscas de transações específicas por session_id, ou seja, o session_id será muito utilizado dentro do where.
*/
