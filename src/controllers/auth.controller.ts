import {Body, Controller, Post, Route, Tags} from 'tsoa';
import {AuthRepository, AuthTokens} from "../repositories/auth.repository";
import {APIUserLogin, APIUserRegister} from "../types/api/user_types";
import {APIRefreshToken, APIRevokeRefreshToken} from "../types/api/auth_types";

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {

  @Post('register')
  public async register(
    @Body() payload: APIUserRegister,
  ): Promise<AuthTokens> {
    this.validateRegisterPayload(payload);

    const tokens = await AuthRepository.register(payload);

    if (!tokens) {
      return Promise.reject({status: 409, message: 'E-mail already in use'});
    }

    this.setStatus(201);
    return tokens;
  }

  @Post('login')
  public async login(
    @Body() payload: APIUserLogin,
  ): Promise<AuthTokens> {
    this.validateLoginPayload(payload);

    const tokens = await AuthRepository.login(payload);

    if (!tokens) {
      return Promise.reject({status: 401, message: 'Invalid e-mail or password'});
    }

    return tokens;
  }

  @Post('refresh-token')
  public async refreshToken(
    @Body() payload: APIRefreshToken,
  ): Promise<AuthTokens> {
    this.validateRefreshTokenPayload(payload);

    const tokens = await AuthRepository.refreshToken(payload.refresh_token.trim());

    if (!tokens) {
      return Promise.reject({status: 401, message: 'Invalid or expired refresh token'});
    }

    return tokens;
  }

  @Post('logout')
  public async logout(
    @Body() payload: APIRevokeRefreshToken,
  ): Promise<{success: boolean}> {
    this.validateRefreshTokenPayload(payload);

    const revoked = await AuthRepository.revokeRefreshToken(payload.refresh_token.trim());

    if (!revoked) {
      return Promise.reject({status: 401, message: 'Invalid or expired refresh token'});
    }

    return {success: true};
  }

  private validateRegisterPayload(payload: APIUserRegister): void {
    if (!payload.name?.trim()) {
      throw {status: 400, message: 'Name is required'};
    }

    this.validateLoginPayload(payload);

    if (payload.password.trim().length < 8) {
      throw {status: 400, message: 'Password must be at least 8 characters long'};
    }
  }

  private validateLoginPayload(payload: APIUserLogin): void {
    if (!payload.email?.trim()) {
      throw {status: 400, message: 'E-mail is required'};
    }

    if (!payload.password?.trim()) {
      throw {status: 400, message: 'Password is required'};
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      throw {status: 400, message: 'Invalid e-mail address'};
    }
  }

  private validateRefreshTokenPayload(payload: APIRefreshToken): void {
    if (!payload.refresh_token?.trim()) {
      throw {status: 400, message: 'Refresh token is required'};
    }
  }
}
