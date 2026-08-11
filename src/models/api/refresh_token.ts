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
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  token_hash: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expires_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at: CreationOptional<Date>;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_used_at?: CreationOptional<Date | null>;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  revoked_at?: CreationOptional<Date | null>;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  replaced_by_token_id?: CreationOptional<string | null>;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id: string;

  @BelongsTo(() => User)
  user: NonAttribute<User>;
}
