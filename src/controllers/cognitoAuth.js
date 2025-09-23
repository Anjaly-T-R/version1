import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand
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

// SIGNUP
export async function cognitoSignUp(req, res) {
  const { username, password, email } = req.body;
  try {
    await client.send(new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
      SecretHash: generateSecretHash(username),
    }));
    res.json({ message: "User registered, check email" });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(400).json({ error: e.message });
  }
}

// CONFIRM
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
