import {Column, DataType, Table} from "sequelize-typescript";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {CreationOptional} from "sequelize";

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

  // Prompt
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  prompt!: string;

}
