import { UsersList } from "../components/users/users-list";

export function UsersPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      <div className="mt-6">
        <UsersList />
      </div>
    </>
  );
}
