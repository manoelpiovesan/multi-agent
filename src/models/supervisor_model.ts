import {BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Table} from "sequelize-typescript";
import {CreationOptional} from "sequelize";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {LlmEngineModel} from "./llm_engine_model";
import {SubagentModel} from "./subagent_model";
import {SupervisorSubagentModel} from "./relational/supervisor_subagent_model";

@Table({
  tableName: 'supervisors',
  timestamps: true,
})
export class SupervisorModel extends AbstractUuidModel<SupervisorModel> {

  @ForeignKey(() => LlmEngineModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  llm_model_id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description?: CreationOptional<string>;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  system_prompt!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  enabled!: CreationOptional<boolean>;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  version!: CreationOptional<number>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: CreationOptional<Record<string, unknown>>;

  @BelongsTo(() => LlmEngineModel)
  llm_model?: CreationOptional<LlmEngineModel>;

  @BelongsToMany(() => SubagentModel, () => SupervisorSubagentModel)
  subagents?: CreationOptional<SubagentModel[]>;

}
