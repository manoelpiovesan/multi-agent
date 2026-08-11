import {User} from "../models/api/user";
import jwt from "jsonwebtoken";
import {RefreshToken} from "../models/api/refresh_token";
import {Op, Transaction} from "sequelize";
import {APIUser} from "../types/api/user_types";
import {APIUserLogin, APIUserRegister} from "../types/api/user_types";
import {UserRepository} from "./user.repository";
import {hashPassword, verifyPassword} from "../utils/password";
import {generateRefreshTokenValue, hashRefreshToken} from "../utils/refresh_token";
import {sequelize} from "../config/sequelize";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export class AuthRepository {

  /**
   * Refresh the access token using a valid refresh token. This method checks if the provided refresh
   * token is valid and not expired, and if so, generates a new access token for the user.
   * If the refresh token is invalid or expired, it returns null.
   * The raw refresh token is never persisted directly in the database.
   * @param refresh_token_value
   * @returns A new set of auth tokens if the refresh token is valid, otherwise null.
   */
  static async refreshToken(refresh_token_value: string): Promise<AuthTokens | null> {
    return await sequelize.transaction(async (transaction) => {
      const refresh_token = await RefreshToken.findOne({
        where: {
          token_hash: hashRefreshToken(refresh_token_value),
          revoked_at: {
            [Op.is]: null,
          },
          expires_at: {
            [Op.gt]: new Date()
          }
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!refresh_token) {
        return null;
      }

      const user = await User.findByPk(refresh_token.user_id, {transaction});

      if (!user) {
        return null;
      }

      return await this.generateAuthTokens(user, transaction, refresh_token);
    });
  }

  static async revokeRefreshToken(refresh_token_value: string): Promise<boolean> {
    return await sequelize.transaction(async (transaction) => {
      const refresh_token = await RefreshToken.findOne({
        where: {
          token_hash: hashRefreshToken(refresh_token_value),
          revoked_at: {
            [Op.is]: null,
          },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!refresh_token) {
        return false;
      }

      const now = new Date();

      await refresh_token.update({
        last_used_at: now,
        revoked_at: now,
      }, {transaction});

      return true;
    });
  }

  static async register(data: APIUserRegister): Promise<AuthTokens | null> {
    const password_hash = await hashPassword(data.password);
    const user = await UserRepository.createWithPassword(data, password_hash);

    if (!user) {
      return null;
    }

    return await this.generateAuthTokens(user);
  }

  static async login(data: APIUserLogin): Promise<AuthTokens | null> {
    const user = await UserRepository.findByEmail(data.email);

    if (!user || !user.password_hash) {
      return null;
    }

    const isPasswordValid = await verifyPassword(data.password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    return await this.generateAuthTokens(user);
  }

  /**
   * Generate a token for the user. This is a helper method that can be used in various parts
   * of the application where a token is needed for a user.
   * @returns A JWT token containing the user's information.
   * @param user
   */
  static async generateAuthTokens(
    user: User,
    transaction?: Transaction,
    current_refresh_token?: RefreshToken,
  ): Promise<AuthTokens> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    const userData = this.toApiUser(user);

    const access_token = jwt.sign(userData, secret, {expiresIn: '5m'});

    const refresh_token = await this.generateRefreshToken(user.id, transaction, current_refresh_token);

    return {access_token: access_token, refresh_token: refresh_token};
  }

  /**
   * Generate a refresh token for the user. This method creates a new refresh token in the database
   * and returns the raw token value. The persisted value is a hash of the token.
   * @param user_id
   * @private
   */
  private static async generateRefreshToken(
    user_id: string,
    transaction?: Transaction,
    current_refresh_token?: RefreshToken,
  ): Promise<string> {
    const raw_refresh_token = generateRefreshTokenValue();
    const now = new Date();
    const next_refresh_token = await RefreshToken.create({
      user_id: user_id,
      token_hash: hashRefreshToken(raw_refresh_token),
      expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      created_at: now,
    }, {transaction});

    if (current_refresh_token) {
      await current_refresh_token.update({
        last_used_at: now,
        revoked_at: now,
        replaced_by_token_id: next_refresh_token.id,
      }, {transaction});
    }

    return raw_refresh_token;
  }

  private static toApiUser(user: User): APIUser {
    return {
      google_profile_id: user.google_profile_id,
      name: user.name,
      picture: user.picture,
      role: user.role,
      email: user.email,
      id: user.id,
    };
  }
}
