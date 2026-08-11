import {User} from "../models/user";
import jwt from "jsonwebtoken";
import {RefreshToken} from "../models/refresh_token";
import {Op} from "sequelize";
import {APIUser} from "../types/api/user_types";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export class AuthRepository {

  /**
   * Refresh the access token using a valid refresh token. This method checks if the provided refresh
   * token is valid and not expired, and if so, generates a new access token for the user.
   * If the refresh token is invalid or expired, it returns null.
   * @param user_id
   * @param refresh_token_id
   * @returns A new set of auth tokens if the refresh token is valid, otherwise null.
   */
  static async refreshToken(user_id: string, refresh_token_id: string): Promise<AuthTokens | null> {
    const refresh_token = await RefreshToken.findOne({
      where: {
        id: refresh_token_id,
        user_id: user_id,
        expires_at: {
          [Op.gt]: new Date() // Check if the token is not expired
        }
      },
    });

    if (!refresh_token) {
      return null; // Invalid or expired refresh token
    }

    const user = await User.findByPk(user_id);

    // Should not happen.
    if (!user) {
      return null; // User not found
    }

    return await this.generateAuthTokens(user);
  }


  /**
   * Generate a token for the user. This is a helper method that can be used in various parts
   * of the application where a token is needed for a user.
   * @returns A JWT token containing the user's information.
   * @param user
   */
  static async generateAuthTokens(user: User): Promise<AuthTokens> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    const userData: APIUser = {
      google_profile_id: user.google_profile_id,
      name: user.name,
      picture: user.picture,
      role: user.role,
      email: user.email,
      id: user.id,
    }

    const access_token = jwt.sign(userData, secret, {expiresIn: '5m'});

    const refresh_token = await this.generateRefreshToken(user.id);

    return {access_token: access_token, refresh_token: refresh_token};
  }

  /**
   * Generate a refresh token for the user. This method creates a new refresh token in the database
   * and returns the token id. The refresh token can be used to obtain a new access token when the
   * current one expires.
   * @param user_id
   * @private
   */
  private static async generateRefreshToken(user_id: string): Promise<string> {

    // Invalidate existing refresh tokens for the user to ensure only one active refresh token at a time.
    await RefreshToken.destroy({
      where: {
        user_id: user_id
      }
    });

    const refresh_token = await RefreshToken.create({
      user_id: user_id,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 1 day
    });

    return refresh_token.id;
  }
}
