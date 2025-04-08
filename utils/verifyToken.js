import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  console.log("🚀 ~ verifyToken ~ token:", token)
  console.log('Here')

  if (!token) {
    console.log("🚀 ~ No token found");
    return res.status(401).json({
      success: false,
      message: "You're not authorize",
    });
  }

  // if token is exist then verify the token
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log("🚀 ~ Token is invalid:", err.message);
      return res.status(401).json({
        success: false,
        message: "token is invalid",
      });
    }

    console.log("🚀 ~ Decoded user:", user);
    req.user = user;
    next(); // fon't forget to call next() method
  });
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    console.log(req.user)
    // console.log(req.user.id)
    // console.log(req.params.id)
    if (req.user.id === req.params.id || req.user.role === "admin" || req.user.role === "user") {
      console.log('user is true')
      next();
    } else {
      console.log('user is false')
      return res.status(401).json({
        success: false,
        message: "You're not authenticated",
      });
    }
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    console.log(req.user)
    if (req.user.role === "admin") {
      console.log("🚀 ~ Admin is true");
      next();
    } else {
      console.log("🚀 ~ Not Admin");
      return res.status(401).json({
        success: false,
        message: "You're not authorize",
      });
    }
  });
};

export const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
};
