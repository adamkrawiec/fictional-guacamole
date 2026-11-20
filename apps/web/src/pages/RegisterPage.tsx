import { Form, redirect, useActionData, useNavigation } from "react-router";

// Mirrors the API's User model. Only name and email are set at sign-up; id, emailVerified and the
// timestamps are filled in by the API. The password is stored on the user's Account, not on User.
type RegisterError = { error: string };

const inputClass =
  "mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-slate-900 dark:bg-slate-950 dark:ring-slate-700 dark:focus:ring-slate-100";

// Runs on submit. Better Auth's sign-up endpoint creates the user and signs them in (session cookie).
export async function registerAction({ request }: { request: Request }) {
  const form = await request.formData();

  let res: Response;
  try {
    res = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
  } catch {
    return { error: "Could not reach the server. Please try again." } satisfies RegisterError;
  }

  if (!res.ok) {
    // Better Auth errors look like { code: "USER_ALREADY_EXISTS", message: "User already exists" }
    const body: { message?: string } = await res.json().catch(() => ({}));
    return { error: body.message ?? `Registration failed (${res.status})` } satisfies RegisterError;
  }

  return redirect("/");
}

export function RegisterPage() {
  // The action returns RegisterError on failure; on success it redirects, so there is no data
  const result = useActionData() as RegisterError | undefined;
  const submitting = useNavigation().state === "submitting";

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>

      <Form method="post" className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" type="text" required autoComplete="name" className={inputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            At least 8 characters
          </span>
        </label>

        {result?.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
          >
            {result.error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </Form>
    </>
  );
}
