import {Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {InferAttributes, InferCreationAttributes} from "sequelize";
import {SupervisorModel} from "../supervisor_model";
import {SubagentModel} from "../subagent_model";

@Table({
  tableName: 'supervisor_subagents',
  timestamps: false,
})
export class SupervisorSubagentModel extends Model<
  InferAttributes<SupervisorSubagentModel>,
  InferCreationAttributes<SupervisorSubagentModel>
> {

  @PrimaryKey
  @ForeignKey(() => SupervisorModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  supervisor_id!: string;

  @PrimaryKey
  @ForeignKey(() => SubagentModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  subagent_id!: string;

}
