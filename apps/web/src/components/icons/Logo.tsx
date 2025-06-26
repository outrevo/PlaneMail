import { Send } from 'lucide-react';
import type { HTMLAttributes } from 'react';

export function Logo(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex items-center gap-2 text-primary" {...props}> {/* text-primary will now be black */}
      <Send className="h-6 w-6" />
      <span className="font-headline text-xl font-semibold tracking-tighter">PlaneMail</span>
    </div>
  );
}
