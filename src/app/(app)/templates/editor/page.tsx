
"use client"
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text, Image as ImageIcon, Box, Rows, Palette, Save, Eye, Smartphone, Tablet, Monitor, ArrowLeft, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


// This page is a route group, [id] will be handled by src/app/(app)/templates/editor/[id]/page.tsx
// This specific page at /templates/editor should likely redirect or show a "select a template or create new" message.
// For now, let's make it redirect to the "create new" flow.
export default function TemplateEditorBasePage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/templates/editor/new');
    }, [router]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.8))] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <p className="mt-2 text-gray-600">Redirecting to template editor...</p>
    </div>
  );
}
