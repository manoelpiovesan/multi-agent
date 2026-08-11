import {Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {InferAttributes, InferCreationAttributes} from "sequelize";
import {SubagentModel} from "../subagent_model";
import {SkillModel} from "../skill_model";

@Table({
  tableName: 'subagent_skills',
  timestamps: false,
})
export class SubagentSkillModel extends Model<
  InferAttributes<SubagentSkillModel>,
  InferCreationAttributes<SubagentSkillModel>
> {

  @PrimaryKey
  @ForeignKey(() => SubagentModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  subagent_id!: string;

  @PrimaryKey
  @ForeignKey(() => SkillModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  skill_id!: string;

}
