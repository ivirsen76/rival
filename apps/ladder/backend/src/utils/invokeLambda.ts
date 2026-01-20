import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export default async (funcName, payload = {}) => {
    const client = new LambdaClient();
    const command = new InvokeCommand({
        FunctionName: funcName,
        Payload: JSON.stringify(payload),
        LogType: 'Tail',
    });

    const { Payload } = await client.send(command);
    const result = JSON.parse(Buffer.from(Payload).toString());

    return result;
};
