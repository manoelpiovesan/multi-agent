import {Model, ModelCtor, Sequelize} from 'sequelize-typescript';
import {DataTypes, QueryTypes} from 'sequelize';
import fs from 'fs';
import path from 'path';
import {hashRefreshToken} from "../utils/refresh_token";

const models = getModels(path.join(__dirname, '../models'));

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://admin:password@localhost:5432/backend_node',
  {
    dialect: process.env.DATABASE_DIALECT as any || 'postgres',
    models,
    logging: false,
  }
);

export const initDb = async () => {
  try {
    await sequelize.sync();
    await ensureUsersPasswordColumn();
    await ensureRefreshTokensStructure();
    await ensureLlmEnginesStructure();
    await ensureSkillsStructure();
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

async function ensureLlmEnginesStructure() {
  if (!await hasTable('llm_engines')) {
    return;
  }

  const queryInterface = sequelize.getQueryInterface();
  const llmEnginesTable = await queryInterface.describeTable('llm_engines');

  if (!llmEnginesTable.name) {
    await queryInterface.addColumn('llm_engines', 'name', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!llmEnginesTable.api_base_url) {
    await queryInterface.addColumn('llm_engines', 'api_base_url', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!llmEnginesTable.enabled) {
    await queryInterface.addColumn('llm_engines', 'enabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  }

  if (!llmEnginesTable.config) {
    await queryInterface.addColumn('llm_engines', 'config', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  }

  if (!llmEnginesTable.metadata) {
    await queryInterface.addColumn('llm_engines', 'metadata', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  }

  await sequelize.query(
    "UPDATE llm_engines SET name = model_name WHERE name IS NULL",
    {type: QueryTypes.UPDATE}
  );

  await queryInterface.changeColumn('llm_engines', 'name', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}

async function ensureSkillsStructure() {
  if (!await hasTable('skills')) {
    return;
  }

  const queryInterface = sequelize.getQueryInterface();
  const skillsTable = await queryInterface.describeTable('skills');

  if (!skillsTable.instructions) {
    await queryInterface.addColumn('skills', 'instructions', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }

  if (!skillsTable.enabled) {
    await queryInterface.addColumn('skills', 'enabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  }

  if (!skillsTable.version) {
    await queryInterface.addColumn('skills', 'version', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  }

  if (!skillsTable.metadata) {
    await queryInterface.addColumn('skills', 'metadata', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  }

  if (skillsTable.prompt && !skillsTable.instructions) {
    await sequelize.query(
      "UPDATE skills SET instructions = prompt WHERE instructions IS NULL",
      {type: QueryTypes.UPDATE}
    );
  }

  await queryInterface.changeColumn('skills', 'instructions', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
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

function getModels(modelsRootPath: string): ModelCtor[] {
  if (!fs.existsSync(modelsRootPath)) {
    return [];
  }

  const runtimeExtension = path.extname(__filename);
  const modelPaths: string[] = [];

  readModelPaths(modelsRootPath, runtimeExtension, modelPaths);

  return modelPaths.flatMap((modelPath) => loadModelClasses(modelPath));
}

function readModelPaths(directoryPath: string, runtimeExtension: string, modelPaths: string[]): void {
  for (const entry of fs.readdirSync(directoryPath, {withFileTypes: true})) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      readModelPaths(entryPath, runtimeExtension, modelPaths);
      continue;
    }

    if (!isModelFile(entry.name, runtimeExtension)) {
      continue;
    }

    modelPaths.push(entryPath);
  }
}

function isModelFile(fileName: string, runtimeExtension: string): boolean {
  if (path.extname(fileName) !== runtimeExtension) {
    return false;
  }

  if (!fileName.endsWith(`_model${runtimeExtension}`) && !['user', 'refresh_token'].includes(path.basename(fileName, runtimeExtension))) {
    return false;
  }

  return !fileName.startsWith('abstract_');
}

function loadModelClasses(modelPath: string): ModelCtor[] {
  const exportedMembers = require(modelPath) as Record<string, unknown>;

  return Object.values(exportedMembers).filter(isModelClass) as ModelCtor[];
}

function isModelClass(exportedMember: unknown): exportedMember is ModelCtor {
  if (typeof exportedMember !== 'function') {
    return false;
  }

  return exportedMember.prototype instanceof Model;
}
