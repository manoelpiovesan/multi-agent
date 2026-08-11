import {Column, DataType, Model} from "sequelize-typescript";
import {CreationOptional, InferAttributes, InferCreationAttributes} from "sequelize";

export abstract class AbstractIntModel<M extends Model> extends Model<InferAttributes<M>, InferCreationAttributes<M>> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: CreationOptional<number>;
}
