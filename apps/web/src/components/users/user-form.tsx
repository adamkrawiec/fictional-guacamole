import { type ChangeEvent, type FormEvent, useState } from "react";

// The fields of the API's User model this form sends
export type UserFormValues = {
  name: string;
  email: string;
};

// What the API answers with ({ user }) after a create or update
export type SavedUser = UserFormValues & { id: string };

type Props = {
  // Where the form sends its { name, email }, e.g. "/api/users" (create) or `/api/users/${id}` (edit)
  endpoint: string;
  method?: "POST" | "PATCH"; // default POST
  // Prefilled values, for editing. Without them the form starts blank.
  initialValues?: UserFormValues;
  // Called with the API's user after a successful save
  onSaved?: (user: SavedUser) => void;
};

type State =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; message: string }
  | { status: "error"; error: string };

const blank: UserFormValues = { name: "", email: "" };

const inputClass =
  "mt-1 block w-full rounded-lg border-0 bg-white px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-slate-900 dark:bg-slate-950 dark:ring-slate-700 dark:focus:ring-slate-100";

// A user's name and email, sent as JSON to `endpoint`. The API decides who may do what.
// When the API sends a verification link (new user, or a changed email), the success message
// says so.
export function UserForm({ endpoint, method = "POST", initialValues, onSaved }: Props) {
  const [values, setValues] = useState<UserFormValues>(initialValues ?? blank);
  const [state, setState] = useState<State>({ status: "idle" });

  const setField = (field: keyof UserFormValues) => (event: ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving" });

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        // The API answers { error: "..." }, e.g. a validation message or "A user with this email
        // already exists"
        const body: { error?: string } = await res.json().catch(() => ({}));
        setState({ status: "error", error: body.error ?? `Saving failed (${res.status})` });
        return;
      }

      const data: { user: SavedUser } = await res.json();
      const newEmail = data.user.email !== initialValues?.email;
      setState({
        status: "saved",
        message: newEmail ? `Saved. We sent a verification link to ${data.user.email}.` : "Saved.",
      });
      // A form that started blank is for adding: empty it again for the next one
      if (!initialValues) setValues(blank);
      onSaved?.(data.user);
    } catch {
      setState({ status: "error", error: "Could not reach the server. Please try again." });
    }
  }

  const saving = state.status === "saving";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={setField("name")}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={setField("email")}
          className={inputClass}
        />
      </label>

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
        >
          {state.error}
        </p>
      )}

      {state.status === "saved" && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
