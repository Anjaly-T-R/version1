import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});
const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;

function generateSecretHash(username) {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

// SIGNUP with auto-confirmation
export async function cognitoSignUp(req, res) {
  const { username, password, email } = req.body;
  try {
    // First, sign up the user
    await client.send(new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
      SecretHash: generateSecretHash(username),
    }));

    // Auto-confirm the user (bypass email verification)
    try {
      await client.send(new AdminConfirmSignUpCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
      }));
      
      res.json({ message: "User registered and confirmed automatically" });
    } catch (confirmError) {
      console.log("Auto-confirm failed, user needs manual confirmation:", confirmError.message);
      res.json({ message: "User registered successfully" });
    }
    
  } catch (e) {
    console.error("Signup error:", e);
    res.status(400).json({ error: e.message });
  }
}

// CONFIRM (keeping this but not using it in frontend)
export async function cognitoConfirm(req, res) {
  const { username, code } = req.body;
  try {
    await client.send(new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: code,
      SecretHash: generateSecretHash(username),
    }));
    res.json({ message: "User confirmed" });
  } catch (e) {
    console.error("Confirm error:", e);
    res.status(400).json({ error: e.message });
  }
}

// LOGIN
export async function cognitoLogin(req, res) {
  const { username, password } = req.body;
  try {
    const resp = await client.send(new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: generateSecretHash(username),
      },
    }));
    res.json({ tokens: resp.AuthenticationResult });
  } catch (e) {
    console.error("Login error:", e);
    res.status(400).json({ error: e.message });
  }
}