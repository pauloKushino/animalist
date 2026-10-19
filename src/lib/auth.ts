import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db } from "@/lib/db";

// Login social só é ativado quando as chaves existem no .env
const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
    ? {
        discord: {
          clientId: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
        },
      }
    : {}),
};

export const enabledSocialProviders = Object.keys(socialProviders) as (
  "google" | "discord"
)[];

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders,
  user: {
    additionalFields: {
      // role e bio não podem ser enviados pelo cliente no cadastro
      role: { type: "string", defaultValue: "USER", input: false },
      bio: { type: "string", required: false, input: false },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
    }),
    // precisa ser o último: grava cookies em Server Actions
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
