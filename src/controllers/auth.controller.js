const authService = require('../services/auth.service');
const { AppError, ErrorCodes } = require('../constants/errors');

const isProd = process.env.NODE_ENV === 'production';
const cookieName = isProd ? '__Host-refreshToken' : 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// handler to register a new user
async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      status: 201,
      message: 'User registered successfully.',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// handler to log in and set refresh cookie
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // store the refresh token in a secure HttpOnly cookie
    res.cookie(cookieName, result.refreshToken, cookieOptions);

    res.status(200).json({
      status: 200,
      message: 'Logged in successfully.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// handler to refresh access token using the refresh cookie
async function refresh(req, res, next) {
  try {
    const oldToken = req.cookies[cookieName] || req.cookies['refreshToken'] || req.cookies['__Host-refreshToken'];
    if (!oldToken) {
      throw new AppError(401, ErrorCodes.INVALID_TOKEN, 'No refresh token provided.');
    }

    const result = await authService.refresh(oldToken);

    // update the refresh token cookie
    res.cookie(cookieName, result.refreshToken, cookieOptions);

    res.status(200).json({
      status: 200,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// handler to log out and clear the refresh cookie
async function logout(req, res, next) {
  try {
    const oldToken = req.cookies[cookieName] || req.cookies['refreshToken'] || req.cookies['__Host-refreshToken'];
    if (oldToken) {
      await authService.logout(oldToken);
    }

    // clear the client cookie
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({
      status: 200,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
