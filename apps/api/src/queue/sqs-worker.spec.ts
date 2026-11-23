import { DeleteMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { describe, expect, it, vi } from "vitest";
import { processBatch } from "./sqs-worker";

const queueUrl = "https://sqs.eu-central-1.amazonaws.com/123/emails";
const job = (to: string) =>
  JSON.stringify({ type: "verify-email", to, name: "", url: "https://example.com/verify" });

// A stand-in for SQSClient: answers ReceiveMessage with the given messages, records deletes
function fakeSqs(messages: { MessageId: string; ReceiptHandle: string; Body: string }[]) {
  const deleted: string[] = [];
  const send = vi.fn(async (command: unknown) => {
    if (command instanceof ReceiveMessageCommand) {
      return { Messages: messages };
    }
    if (command instanceof DeleteMessageCommand) {
      deleted.push(command.input.ReceiptHandle ?? "");
      return {};
    }
    throw new Error("unexpected command");
  });
  // biome-ignore lint/suspicious/noExplicitAny: a minimal fake of the SDK client's send()
  return { client: { send } as any, send, deleted };
}

describe("processBatch", () => {
  it("long-polls the queue and deletes each message it handled", async () => {
    const { client, send, deleted } = fakeSqs([
      { MessageId: "1", ReceiptHandle: "r1", Body: job("a@example.com") },
      { MessageId: "2", ReceiptHandle: "r2", Body: job("b@example.com") },
    ]);
    const handle = vi.fn(async () => {});

    const handled = await processBatch(client, queueUrl, handle);

    expect(handled).toBe(2);
    expect(handle).toHaveBeenCalledTimes(2);
    expect(handle).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com" }));
    expect(deleted).toEqual(["r1", "r2"]);
    const receive = send.mock.calls[0][0] as ReceiveMessageCommand;
    expect(receive.input).toMatchObject({ QueueUrl: queueUrl, WaitTimeSeconds: 20 });
  });

  it("leaves failed and malformed messages in the queue, so SQS retries them", async () => {
    const { client, deleted } = fakeSqs([
      { MessageId: "1", ReceiptHandle: "r1", Body: job("fails@example.com") },
      { MessageId: "2", ReceiptHandle: "r2", Body: "not json" },
      { MessageId: "3", ReceiptHandle: "r3", Body: job("ok@example.com") },
    ]);
    const handle = vi.fn(async (j: { to: string }) => {
      if (j.to === "fails@example.com") throw new Error("SES is down");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const handled = await processBatch(client, queueUrl, handle);

    expect(handled).toBe(1);
    expect(deleted).toEqual(["r3"]);
  });
});
