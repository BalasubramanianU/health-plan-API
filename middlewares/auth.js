const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const ApiError = require("../utils/ApiError");

/**
 * Fetches Google's public JWK keys
 * @returns {Promise<Object>} Google's public keys
 */
const getGooglePublicKeys = async (next) => {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) {
    return next(ApiError.serviceUnavailable());
  }
  const data = await response.json();
  return data.keys;
};

// Middleware to verify Google OAuth2.0 Bearer JWT Token
const verifyToken = async (req, res, next) => {
  if (!req.headers["authorization"]) {
    return next(ApiError.badRequest());
  }

  const authHeaderParts = req.headers["authorization"].split(" ");
  if (authHeaderParts[0] !== "Bearer" || !authHeaderParts[1]) {
    return next(ApiError.badRequest());
  }

  const idToken = authHeaderParts[1];

  try {
    // Decode JWT header
    const decodedHeader = jwt.decode(idToken, { complete: true });
    if (!decodedHeader) {
      return next(ApiError.badRequest());
    }

    const kid = decodedHeader.header.kid;
    const alg = decodedHeader.header.alg;

    // Fetch Google's public keys
    const keys = await getGooglePublicKeys(next);

    // Find the correct key
    const key = keys.find((k) => k.kid === kid);
    if (!key) {
      return next(ApiError.badRequest());
    }

    // Convert JWK to PEM
    const publicKey = jwkToPem(key);

    // Verify JWT signature and audience
    const payload = jwt.verify(idToken, publicKey, {
      algorithms: [alg],
      //   make the client id here to env variable
      audience:
        "632426186384-tgm3tmmotmpfss1p7rb52fc5pg4lesv5.apps.googleusercontent.com",
    });

    next();
  } catch (err) {
    console.error(err);
    // res.status(401).send("Unauthorized");
    return next(ApiError.unauthorized());
  }
};

module.exports = verifyToken;
