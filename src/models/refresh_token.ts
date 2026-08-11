import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute} from "sequelize";
import {User} from "./user";

@Table({tableName: 'refresh_tokens', timestamps: false})
export class RefreshToken extends Model<InferAttributes<RefreshToken>, InferCreationAttributes<RefreshToken>> {

  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  id: CreationOptional<string>;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expires_at: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id: string;

  @BelongsTo(() => User)
  user: NonAttribute<User>;
}
