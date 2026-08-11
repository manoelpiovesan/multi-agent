import {Column, DataType, HasMany, Table} from "sequelize-typescript";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {CreationOptional} from "sequelize";
import {SupervisorModel} from "./supervisor_model";
import {SubagentModel} from "./subagent_model";

@Table({tableName: 'llm_engines'})
export class LlmEngineModel extends AbstractUuidModel<LlmEngineModel> {

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  model_name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  provider!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  api_base_url?: CreationOptional<string>;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  enabled!: CreationOptional<boolean>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  config?: CreationOptional<Record<string, unknown>>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: CreationOptional<Record<string, unknown>>;

  @HasMany(() => SupervisorModel)
  supervisors?: CreationOptional<SupervisorModel[]>;

  @HasMany(() => SubagentModel)
  subagents?: CreationOptional<SubagentModel[]>;

}
