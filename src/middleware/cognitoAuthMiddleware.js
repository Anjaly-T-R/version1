import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "id", 
  clientId: process.env.COGNITO_CLIENT_ID,
});

export async function authCognito(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = await verifier.verify(token);
    req.user = { sub: payload.sub, email: payload.email, groups: payload["cognito:groups"] || [] };
    next();
  } catch (err) {
    console.error("Cognito token verification failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
