import {Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {InferAttributes, InferCreationAttributes} from "sequelize";
import {SkillModel} from "../skill_model";
import {ToolModel} from "../tool_model";

@Table({
  tableName: 'skill_tools',
  timestamps: false,
})
export class SkillToolModel extends Model<
  InferAttributes<SkillToolModel>,
  InferCreationAttributes<SkillToolModel>
> {

  @PrimaryKey
  @ForeignKey(() => SkillModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  skill_id!: string;

  @PrimaryKey
  @ForeignKey(() => ToolModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tool_id!: string;

}
