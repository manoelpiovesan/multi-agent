import {BelongsToMany, Column, DataType, Table} from "sequelize-typescript";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {CreationOptional} from "sequelize";
import {ToolModel} from "./tool_model";
import {SubagentModel} from "./subagent_model";
import {SkillToolModel} from "./relational/skill_tool_model";
import {SubagentSkillModel} from "./relational/subagent_skill_model";

@Table({
  tableName: 'skills',
  timestamps: true,
})
export class SkillModel extends AbstractUuidModel<SkillModel> {

  // Name
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  // Description
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description?: CreationOptional<string>;

  // Instructions
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  instructions!: string;

  // Enabled
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  enabled!: CreationOptional<boolean>;

  // Version
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  version!: CreationOptional<number>;

  // Metadata
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: CreationOptional<Record<string, unknown>>;

  @BelongsToMany(() => ToolModel, () => SkillToolModel)
  tools?: CreationOptional<ToolModel[]>;

  @BelongsToMany(() => SubagentModel, () => SubagentSkillModel)
  subagents?: CreationOptional<SubagentModel[]>;

}
