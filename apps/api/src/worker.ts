// Background worker: sends queued emails. Runs as its own container from the same image
// (`node dist/worker.js`), started by the deploy script next to the API.
import "./env";
import { SQSClient } from "@aws-sdk/client-sqs";
import { handleEmailJob } from "./emails/handle-email-job";
import { createMailer } from "./mailer/mailer";
import { processBatch } from "./queue/sqs-worker";

const queueUrl = process.env.EMAIL_QUEUE_URL;
if (!queueUrl) {
  console.error("[worker] EMAIL_QUEUE_URL is not set; nothing to do");
  process.exit(1);
}

const client = new SQSClient({});
const mailer = createMailer();
const stop = new AbortController();

// `docker stop` sends SIGTERM: stop polling (the abort ends a pending 20 s wait right away).
// A message being sent finishes first; anything not deleted yet is simply retried by SQS.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`[worker] ${signal}, stopping`);
    stop.abort();
  });
}

async function main(queue: string) {
  console.log("[worker] polling", queue);
  while (!stop.signal.aborted) {
    try {
      await processBatch(client, queue, (job) => handleEmailJob(job, mailer), stop.signal);
    } catch (err) {
      if (stop.signal.aborted) break;
      // e.g. a network blip: wait a little instead of spinning
      console.error("[worker] receiving failed, retrying in 5 s", err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  console.log("[worker] stopped");
}

void main(queueUrl);
