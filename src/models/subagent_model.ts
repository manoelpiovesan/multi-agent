import {BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Table} from "sequelize-typescript";
import {CreationOptional} from "sequelize";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {LlmEngineModel} from "./llm_engine_model";
import {SupervisorModel} from "./supervisor_model";
import {ToolModel} from "./tool_model";
import {SkillModel} from "./skill_model";
import {SupervisorSubagentModel} from "./relational/supervisor_subagent_model";
import {SubagentToolModel} from "./relational/subagent_tool_model";
import {SubagentSkillModel} from "./relational/subagent_skill_model";

@Table({
  tableName: 'subagents',
  timestamps: true,
})
export class SubagentModel extends AbstractUuidModel<SubagentModel> {

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

  @BelongsToMany(() => SupervisorModel, () => SupervisorSubagentModel)
  supervisors?: CreationOptional<SupervisorModel[]>;

  @BelongsToMany(() => ToolModel, () => SubagentToolModel)
  tools?: CreationOptional<ToolModel[]>;

  @BelongsToMany(() => SkillModel, () => SubagentSkillModel)
  skills?: CreationOptional<SkillModel[]>;

}
