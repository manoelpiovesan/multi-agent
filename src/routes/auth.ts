import {Router, Request, Response, NextFunction} from 'express';
import passport from 'passport';
import {AuthTokens} from "../repositories/auth.repository";
import {isGoogleAuthEnabled} from "../config/passport";

const router = Router();

const googleAuthDisabledHandler = (_req: Request, res: Response) => {
  res.status(503).json({
    success: false,
    error: 'Google authentication is not configured',
  });
};

/**
 * Google OAuth login route. This route initiates the Google OAuth flow by redirecting the user
 * to Google's authentication page. The 'scope' parameter specifies that we want to access the
 * user's profile and email information.
 */
router.get(
  '/api/v1/auth/google',
  isGoogleAuthEnabled
    ? passport.authenticate('google', {scope: ['profile', 'email']})
    : googleAuthDisabledHandler
);

/**
 * Google OAuth callback route. This route is called by Google after the user has authenticated.
 * It uses Passport to handle the authentication result and then redirects the user back to the
 * frontend with a JWT token.
 */
router.get(
  '/api/v1/auth/google/callback',
  isGoogleAuthEnabled
    ? (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate('google', {session: false}, (err, tokens: AuthTokens) => {
        if (err || !tokens) {
          console.error('Authentication error:', err);
          return res.redirect(`${process.env.AUTH_REDIRECT_URL}?error=1`);
        }
        return res.redirect(
          `${process.env.AUTH_REDIRECT_URL}?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`
        );
      })(req, res, next);
    }
    : googleAuthDisabledHandler
);

export default router;
