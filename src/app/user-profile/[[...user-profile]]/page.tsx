import { UserProfile } from "@clerk/nextjs";
import { Logo } from '@/components/icons/Logo';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserProfilePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-6 px-4">
        <Link href="/dashboard" aria-label="Go to dashboard">
          <Logo />
        </Link>
        <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </header>
      <main className="flex flex-col items-center justify-center flex-grow">
        <UserProfile path="/user-profile" routing="path" />
      </main>
    </div>
  );
}
