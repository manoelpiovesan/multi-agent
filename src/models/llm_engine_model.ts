import {Column, DataType, Table} from "sequelize-typescript";
import {AbstractUuidModel} from "./api/abstract_uuid_model";

@Table({tableName: 'llm_engines'})
export class LlmEngineModel extends AbstractUuidModel<LlmEngineModel> {

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

}
