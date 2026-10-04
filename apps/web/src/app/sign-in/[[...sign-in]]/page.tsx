import { AuthExperience } from "@/components/auth/auth-experience";
import { publicEnv } from "@/lib/public-env";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return <AuthExperience configured={publicEnv.success && Boolean(process.env.CLERK_SECRET_KEY)} />;
}
