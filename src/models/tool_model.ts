import {BelongsToMany, Column, DataType, Table} from "sequelize-typescript";
import {CreationOptional} from "sequelize";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {SubagentModel} from "./subagent_model";
import {SkillModel} from "./skill_model";
import {SubagentToolModel} from "./relational/subagent_tool_model";
import {SkillToolModel} from "./relational/skill_tool_model";

@Table({
  tableName: 'tools',
  timestamps: true,
})
export class ToolModel extends AbstractUuidModel<ToolModel> {

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
    type: DataType.STRING,
    allowNull: false,
  })
  type!: string;

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
  config?: CreationOptional<Record<string, unknown>>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: CreationOptional<Record<string, unknown>>;

  @BelongsToMany(() => SubagentModel, () => SubagentToolModel)
  subagents?: CreationOptional<SubagentModel[]>;

  @BelongsToMany(() => SkillModel, () => SkillToolModel)
  skills?: CreationOptional<SkillModel[]>;

}
