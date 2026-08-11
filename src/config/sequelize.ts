import {Sequelize} from 'sequelize-typescript';
import path from 'path';

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://admin:password@localhost:5432/backend_node',
  {
    dialect: process.env.DATABASE_DIALECT as any || 'postgres',
    models: [path.join(__dirname, '../models')],
    modelMatch: (filename, member) => {
      return member !== 'default';
    },
    logging: false,
  }
);

export const initDb = async () => {
  try {
    await sequelize.sync();
    console.log('[INFO] Database synchronized successfully');
  } catch (err) {
    console.error('[ERROR] Unable to synchronize the database:', err);
  }
};

export {sequelize};
