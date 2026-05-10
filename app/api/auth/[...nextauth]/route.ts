import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Auth attempt for:", credentials?.email);

        try {
          const email = credentials?.email?.trim().toLowerCase();
          const password = credentials?.password;

          if (!email || !password) {
            return null;
          }

          await connectToDatabase();
          const user = await User.findOne({ email }).lean();

          if (!user) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("NextAuth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as unknown as Record<string, unknown>;
        (token as Record<string, unknown>).id = user.id;
        (token as Record<string, unknown>).role = authUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
