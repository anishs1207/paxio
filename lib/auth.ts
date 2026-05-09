import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./db";
import { DefaultSession } from "next-auth";
import { INITIAL_CREDITS } from "./credits";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/",
    signOut: "/",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async redirect({ baseUrl }) {
      // Always redirect to dashboard after sign-in
      return `${baseUrl}/voice`;
    },

    // ✅ UPDATED
    async signIn({ user }) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name,
            credits: INITIAL_CREDITS,
            // transactions: {
            //   create: {
            //     type: "INIT",
            //     amount: INITIAL_CREDITS,
            //     balanceAfter: INITIAL_CREDITS,
            //   },
            // },
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser) {
          token.userId = dbUser.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.userId) {
        session.user = {
          ...session.user,
          id: token.userId,
        };
      }
      return session;
    },
  },
};
