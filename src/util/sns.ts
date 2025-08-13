import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';

export const sendSnsMessage = async (message: any, topicArn: string) => {
  let snsClient = new SNSClient({});
  if (process.env.IS_OFFLINE) {
    console.log('SNS publishok skipped.');
    return;
    // snsClient = new SNSClient({
    //   region: process.env.SNS_LOCAL_TEST_REGION ?? 'us-east-1', // replace with your desired region
    //   endpoint: process.env.SNS_LOCAL_TEST_ENDPOINT ?? "http://localhost:4002" // replace with your Serverless Offline SNS endpoint
    // });
  }

  const publishCommand = new PublishCommand({
    Message: JSON.stringify(message),
    TopicArn: topicArn,
  });

  try {
    const response = await snsClient.send(publishCommand);
    console.log('SNS message published', response);
  } catch (err) {
    const errorMessage = {error: err, onMessage: message};
    console.error(errorMessage);

    return;
  }
};
