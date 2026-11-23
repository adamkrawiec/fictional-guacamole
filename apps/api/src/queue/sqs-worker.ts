import { DeleteMessageCommand, ReceiveMessageCommand, type SQSClient } from "@aws-sdk/client-sqs";
import { type EmailJob, parseEmailJob } from "../emails/email-job";

type Handle = (job: EmailJob) => Promise<void>;
type SqsLike = Pick<SQSClient, "send">;

// One round of the worker loop: wait up to 20 s for messages, handle each, delete the ones that
// succeeded. A failed one is left alone, so SQS shows it again after the visibility timeout (60 s)
// and moves it to the dead-letter queue after 5 attempts (infra/app/email.tf).
// Returns how many messages were handled successfully.
export async function processBatch(
  client: SqsLike,
  queueUrl: string,
  handle: Handle,
  abortSignal?: AbortSignal,
): Promise<number> {
  const { Messages = [] } = await client.send(
    new ReceiveMessageCommand({ QueueUrl: queueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 20 }),
    { abortSignal },
  );

  let handled = 0;
  for (const message of Messages) {
    try {
      await handle(parseEmailJob(message.Body));
      await client.send(
        new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }),
      );
      handled++;
    } catch (err) {
      console.error(`[worker] message ${message.MessageId} failed, SQS will retry it`, err);
    }
  }
  return handled;
}
