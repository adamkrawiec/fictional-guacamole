import { UserProfile } from "../components/users/user-profile";

// /users/:id
export function UserProfilePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <div className="mt-6">
        <UserProfile />
      </div>
    </>
  );
}
