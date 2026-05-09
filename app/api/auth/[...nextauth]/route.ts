import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { initWorker } from "@/lib/worker-runner";

initWorker();

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };