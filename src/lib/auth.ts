import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

type GithubOrg = {
  login?: string;
};

async function fetchGithubOrgs(accessToken: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.github.com/user/orgs", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }

    const orgs = (await response.json()) as GithubOrg[];
    return orgs.map((org) => org.login).filter((org): org is string => !!org);
  } catch {
    return [];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user read:org",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.orgs = await fetchGithubOrgs(account.access_token);
      }

      const githubProfile = profile as { login?: string } | undefined;
      const profileLogin =
        typeof githubProfile?.login === "string"
          ? githubProfile.login
          : typeof token.login === "string"
            ? token.login
            : undefined;
      if (profileLogin) {
        token.login = profileLogin;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.login = typeof token.login === "string" ? token.login : undefined;
      session.orgs = Array.isArray(token.orgs)
        ? token.orgs.filter((org): org is string => typeof org === "string")
        : [];

      if (session.user) {
        session.user.login = session.login;
        session.user.orgs = session.orgs;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
