import {CreationOptional, InferAttributes, InferCreationAttributes} from "sequelize";
import {Column, DataType, Model} from "sequelize-typescript";
import {SequelizeTimestamps} from "../../types/api/sequelize_types";

export abstract class AbstractUuidModel<M extends Model> extends Model<InferAttributes<M, {
  omit: SequelizeTimestamps
}>, InferCreationAttributes<M>> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id: CreationOptional<string>;
}
