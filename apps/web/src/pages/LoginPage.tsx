import { Form, Link, redirect, useActionData, useNavigation } from "react-router";

type LoginError = { error: string };

const inputClass =
  "mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-slate-900 dark:bg-slate-950 dark:ring-slate-700 dark:focus:ring-slate-100";

// Runs on submit. Better Auth checks the password and sets the session cookie.
export async function loginAction({ request }: { request: Request }) {
  const form = await request.formData();

  let res: Response;
  try {
    res = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
  } catch {
    return { error: "Could not reach the server. Please try again." } satisfies LoginError;
  }

  if (!res.ok) {
    // Wrong email or password: { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }
    const body: { message?: string } = await res.json().catch(() => ({}));
    return { error: body.message ?? `Login failed (${res.status})` } satisfies LoginError;
  }

  return redirect("/");
}

export function LoginPage() {
  // The action returns LoginError on failure; on success it redirects, so there is no data
  const result = useActionData() as LoginError | undefined;
  const submitting = useNavigation().state === "submitting";

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Log in</h1>

      <Form method="post" className="mt-6 space-y-4">
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
            autoComplete="current-password"
            className={inputClass}
          />
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
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </Form>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        No account yet?{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </p>
    </>
  );
}
