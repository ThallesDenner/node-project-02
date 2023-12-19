import { Knex, knex as setupKnex } from 'knex'
import { env } from './env'

export const config: Knex.Config = {
  client: 'sqlite',
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true, // isto especifica que todos os campos do banco tem valor null por padrão. O SQLite não tem uma opção para atribuir um valor padrão quando uma coluna é criada. Sem esta linha, aparece um aviso.
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const knex = setupKnex(config)
