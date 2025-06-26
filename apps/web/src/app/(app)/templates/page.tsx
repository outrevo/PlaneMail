
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, PlusCircle, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getTemplates, deleteTemplate } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { InferSelectModel } from 'drizzle-orm';
import { templates } from '@/db/schema';

type TemplateSchemaType = InferSelectModel<typeof templates>;

async function TemplatesList() {
  const templates = await getTemplates();

  if (templates.length === 0) {
    return (
      <Card className="text-center py-12 col-span-full border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader>
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <CardTitle className="mt-4 text-xl font-semibold text-black" style={{letterSpacing: '-0.01em'}}>No Templates Yet</CardTitle>
          <CardDescription className="text-gray-600">
            Start by creating your first email template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
            <Link href="/templates/editor">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Template
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {templates.map((template: TemplateSchemaType) => ( // Use imported type
        <Card key={template.id} className="flex flex-col overflow-hidden border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="aspect-[3/2] w-full overflow-hidden bg-gray-50">
            <Image 
              src={template.previewImageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(template.name)}`} 
              alt={template.name} 
              width={600} 
              height={400} 
              className="object-cover w-full h-full"
              data-ai-hint={template.category || 'email template'}
            />
          </div>
          <CardHeader className="flex-grow p-4">
            <CardTitle className="text-lg text-black font-semibold" style={{letterSpacing: '-0.01em'}}>{template.name}</CardTitle>
            <CardDescription className="text-gray-600">Last modified: {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'N/A'}</CardDescription>
            {template.category && <CardDescription className="text-gray-600">Category: {template.category}</CardDescription>}
          </CardHeader>
          <CardFooter className="p-4 border-t border-gray-200">
            <Button variant="outline" size="sm" asChild className="flex-1 border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
              <Link href={`/templates/editor/${template.id}`}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border border-gray-200 rounded-2xl bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black font-semibold" style={{letterSpacing: '-0.01em'}}>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    This action cannot be undone. This will permanently delete the template "{template.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>Cancel</AlertDialogCancel>
                  <form action={async () => {
                    'use server';
                    await deleteTemplate(template.id);
                  }}>
                    <AlertDialogAction type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>Delete</AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}

export default function TemplatesPage() {
  // TODO: Add search and filter functionality if needed by making this an async Client Component or using Route Handlers
  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Manage your email templates or create new ones."
        actions={
          <Button asChild className="bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
            <Link href="/templates/editor/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Template
            </Link>
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search templates..." className="pl-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
        </div>
        <Button variant="outline" className="border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <TemplatesList />
      </div>
    </div>
  );
}
