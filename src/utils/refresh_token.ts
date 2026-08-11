import {createHash, randomBytes} from "crypto";

const REFRESH_TOKEN_BYTES = 48;

export function generateRefreshTokenValue(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

export function hashRefreshToken(refresh_token: string): string {
  return createHash('sha256')
    .update(refresh_token)
    .digest('hex');
}
