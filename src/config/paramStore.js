import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: "ap-southeast-2" });

export async function getParam(name) {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true
  });
  const response = await client.send(command);
  return response.Parameter.Value;
}

