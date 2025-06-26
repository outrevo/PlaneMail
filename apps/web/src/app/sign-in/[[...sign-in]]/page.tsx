import { SignIn } from "@clerk/nextjs";
import { Logo } from '@/components/icons/Logo';
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
       <div className="mb-8">
        <Link href="/" aria-label="Go to homepage">
          <Logo />
        </Link>
      </div>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" redirectUrl="/dashboard"/>
    </div>
  );
}
