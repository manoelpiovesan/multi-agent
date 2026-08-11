import { User} from "../models/api/user";
import {DefaultSearchParams} from "../types/api/search_types";
import {Op} from "sequelize";
import {APIUser, APIUserCreate, APIUserRegister} from "../types/api/user_types";
import {randomUUID} from "crypto";

export class UserRepository {

  /**
   * Get All users with pagination and optional search by name. For admin users only.
   * @param params
   */
  static async findAll(params: DefaultSearchParams): Promise<APIUser[]> {
    return await User.findAll(
      {
        where: params.search ? {
          name: {
            [Op.iLike]: `%${params.search}%`
          },
        } : {},
        limit: params.size && params.size > 0 ? params.size : 10,
        offset: params.page && params.page > 0 ? (params.page - 1) *
          (params.size && params.size > 0 ? params.size : 10) : 0,
        order: [['id', 'ASC']],
      }
    );
  }

  /**
   * Creates a new user if one with the given email does not already exist.
   * @param data
   */
  static async createIfNotExists(data: APIUserCreate): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(data.email);
    const userData = {
      ...data,
      email: normalizedEmail,
    };

    const userByGoogleProfileId = await User.findOne({where: {google_profile_id: data.google_profile_id}});

    if (userByGoogleProfileId) {
      await userByGoogleProfileId.update({
        email: normalizedEmail,
        name: data.name,
        picture: data.picture,
      });
      return userByGoogleProfileId;
    }

    const userByEmail = await User.findOne({where: {email: normalizedEmail}});

    if (userByEmail) {
      await userByEmail.update({
        google_profile_id: data.google_profile_id,
        name: data.name,
        picture: data.picture,
      });
      return userByEmail;
    }

    return await User.create({
      ...userData,
      role: await this.getDefaultRole(),
    });
  }

  static async createWithPassword(data: APIUserRegister, password_hash: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(data.email);
    const existingUser = await User.findOne({where: {email: normalizedEmail}});

    if (existingUser) {
      return null;
    }

    return await User.create({
      google_profile_id: `local:${randomUUID()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      password_hash: password_hash,
      role: await this.getDefaultRole(),
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await User.findOne({
      where: {
        email: this.normalizeEmail(email),
      }
    });
  }

  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private static async getDefaultRole(): Promise<string> {
    const isFirstUser = await User.count() === 0;

    if (isFirstUser) {
      console.log('[INFO] First user created. Granting admin role.');
      return 'admin';
    }

    return 'user';
  }

}
