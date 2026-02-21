import NextAuth from "next-auth"

const handler = NextAuth({
  providers: [],
  pages: {
    signIn: '/auth/signin',
  },
})

export { handler as GET, handler as POST }
