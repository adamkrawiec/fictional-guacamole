// Sets a user's role. Mainly for creating the first admin, since only admins can change roles
// through the API.
//   Local:      pnpm --filter @guacamole/api build
//               pnpm --filter @guacamole/api set-role <email> [role]
//   Production: (SSM session on the instance)
//               sudo docker exec app node dist/scripts/set-role.js <email> [role]
// The role defaults to admin.
import "../env";
import { prisma } from "../db/prisma";
import { parseRole, setUserRole, userRoles } from "../users/set-role";

const [email, roleArg = "admin"] = process.argv.slice(2);

async function main() {
  if (!email) {
    console.error(`Usage: set-role <email> [${userRoles.join("|")}]   (default: admin)`);
    process.exitCode = 1;
    return;
  }

  const result = await setUserRole(email, parseRole(roleArg));

  if (result.previousRole === result.role) {
    console.log(`${result.email} is already ${result.role}; nothing changed`);
  } else {
    console.log(`${result.email}: ${result.previousRole} -> ${result.role}`);
  }
  if (!result.emailVerified) {
    console.warn("Note: this user hasn't verified their email yet, so can't sign in until they do");
  }
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
