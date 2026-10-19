import "server-only";
import { headers } from "next/headers";
import { connection } from "next/server";
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
  // O Better Auth usa new Date() para checar a validade da sessão; sem connection(),
  // o Next tenta incluir isso no App Shell pré-renderizado das rotas dinâmicas e falha.
  await connection();
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
