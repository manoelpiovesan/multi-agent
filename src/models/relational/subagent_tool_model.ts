import {Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {InferAttributes, InferCreationAttributes} from "sequelize";
import {SubagentModel} from "../subagent_model";
import {ToolModel} from "../tool_model";

@Table({
  tableName: 'subagent_tools',
  timestamps: false,
})
export class SubagentToolModel extends Model<
  InferAttributes<SubagentToolModel>,
  InferCreationAttributes<SubagentToolModel>
> {

  @PrimaryKey
  @ForeignKey(() => SubagentModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  subagent_id!: string;

  @PrimaryKey
  @ForeignKey(() => ToolModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tool_id!: string;

}
