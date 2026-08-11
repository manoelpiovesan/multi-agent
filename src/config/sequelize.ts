import {Sequelize} from 'sequelize-typescript';
import {DataTypes, QueryTypes} from 'sequelize';
import {User} from "../models/api/user";
import {RefreshToken} from "../models/api/refresh_token";
import {hashRefreshToken} from "../utils/refresh_token";

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://admin:password@localhost:5432/backend_node',
  {
    dialect: process.env.DATABASE_DIALECT as any || 'postgres',
    models: [User, RefreshToken],
    logging: false,
  }
);

export const initDb = async () => {
  try {
    await sequelize.sync();
    await ensureUsersPasswordColumn();
    await ensureRefreshTokensStructure();
    console.log('[INFO] Database synchronized successfully');
  } catch (err) {
    console.error('[ERROR] Unable to synchronize the database:', err);
  }
};

export {sequelize};

async function ensureUsersPasswordColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const hasUsersTable = await hasTable('users');

  if (!hasUsersTable) {
    return;
  }

  const usersTable = await queryInterface.describeTable('users');

  if (!usersTable.password_hash) {
    await queryInterface.addColumn('users', 'password_hash', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
}

async function ensureRefreshTokensStructure() {
  if (!await hasTable('refresh_tokens')) {
    return;
  }

  const queryInterface = sequelize.getQueryInterface();
  const refreshTokensTable = await queryInterface.describeTable('refresh_tokens');

  if (!refreshTokensTable.token_hash) {
    await queryInterface.addColumn('refresh_tokens', 'token_hash', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!refreshTokensTable.created_at) {
    await queryInterface.addColumn('refresh_tokens', 'created_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!refreshTokensTable.last_used_at) {
    await queryInterface.addColumn('refresh_tokens', 'last_used_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!refreshTokensTable.revoked_at) {
    await queryInterface.addColumn('refresh_tokens', 'revoked_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!refreshTokensTable.replaced_by_token_id) {
    await queryInterface.addColumn('refresh_tokens', 'replaced_by_token_id', {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }

  await backfillLegacyRefreshTokens();

  await queryInterface.changeColumn('refresh_tokens', 'token_hash', {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  });

  await queryInterface.changeColumn('refresh_tokens', 'created_at', {
    type: DataTypes.DATE,
    allowNull: false,
  });

  const existingIndexes = await sequelize.query<{indexname: string}>(
    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'refresh_tokens'",
    {type: QueryTypes.SELECT}
  );
  const hasTokenHashUniqueIndex = existingIndexes.some((index) => {
    return index.indexname === 'refresh_tokens_token_hash_unique';
  });

  if (!hasTokenHashUniqueIndex) {
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], {
      unique: true,
      name: 'refresh_tokens_token_hash_unique',
    });
  }
}

async function backfillLegacyRefreshTokens() {
  const legacyRefreshTokens = await sequelize.query<
    {id: string; token_hash: string | null; created_at: Date | null}
  >(
    'SELECT id, token_hash, created_at FROM refresh_tokens',
    {type: QueryTypes.SELECT}
  );

  const queryInterface = sequelize.getQueryInterface();

  for (const refreshToken of legacyRefreshTokens) {
    const updates: Record<string, string | Date> = {};

    if (!refreshToken.token_hash) {
      updates.token_hash = hashRefreshToken(refreshToken.id);
    }

    if (!refreshToken.created_at) {
      updates.created_at = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await queryInterface.bulkUpdate('refresh_tokens', updates, {
        id: refreshToken.id,
      });
    }
  }
}

async function hasTable(tableName: string): Promise<boolean> {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  return tables.includes(tableName);
}
