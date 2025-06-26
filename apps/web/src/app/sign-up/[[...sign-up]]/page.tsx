import { SignUp } from "@clerk/nextjs";
import { Logo } from '@/components/icons/Logo';
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="mb-8">
        <Link href="/" aria-label="Go to homepage">
          <Logo />
        </Link>
      </div>
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" redirectUrl="/dashboard" />
    </div>
  );
}
