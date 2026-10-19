import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  role: string;
};

// Lê a sessão da requisição. Com cacheComponents, quem chama precisa estar dentro de <Suspense>.
// Devolve só os campos que a UI precisa (nunca e-mail ou tokens).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, name, username, image, role } = session.user;
  return {
    id,
    name,
    username: username ?? null,
    image: image ?? null,
    role,
  };
}
