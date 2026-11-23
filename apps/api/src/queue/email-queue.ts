import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { EmailJob } from "../emails/email-job";
import { handleEmailJob } from "../emails/handle-email-job";
import { ConsoleMailer } from "../mailer/console-mailer";

// Where enqueued emails go, picked once at startup:
//   tests            -> recorded in memory (recordedEmailJobs), never sent, never reaches AWS,
//                       even if a local .env has a real EMAIL_QUEUE_URL
//   EMAIL_QUEUE_URL  -> SQS, and the worker container (src/worker.ts) sends them
//   otherwise (dev)  -> handled right away in this process, printed to the console
type EnqueueFn = (job: EmailJob) => Promise<void>;

export const recordedEmailJobs: EmailJob[] = [];

function createEnqueue(): EnqueueFn {
  if (process.env.NODE_ENV === "test") {
    return async (job) => {
      recordedEmailJobs.push(job);
    };
  }

  const queueUrl = process.env.EMAIL_QUEUE_URL;
  if (queueUrl) {
    const client = new SQSClient({});
    return async (job) => {
      const body = JSON.stringify(job);
      const message = new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: body });
      await client.send(message);
    };
  }

  const mailer = new ConsoleMailer();
  return (job) => handleEmailJob(job, mailer);
}

const enqueue = createEnqueue();

export function enqueueEmail(job: EmailJob): Promise<void> {
  return enqueue(job);
}
