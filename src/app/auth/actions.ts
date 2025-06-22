import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, PlusCircle, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

// Mock data for templates
const templates = [
  { id: '1', name: 'Welcome Email Series', lastModified: '2024-07-28', category: 'Welcome', previewImage: 'https://placehold.co/600x400.png?text=Welcome+Email', aiHint: 'abstract welcome' },
  { id: '2', name: 'Monthly Newsletter Digest', lastModified: '2024-07-25', category: 'Newsletter', previewImage: 'https://placehold.co/600x400.png?text=Newsletter+Digest', aiHint: 'geometric pattern'},
  { id: '3', name: 'Product Launch Announcement', lastModified: '2024-07-20', category: 'Promotion', previewImage: 'https://placehold.co/600x400.png?text=Product+Launch', aiHint: 'modern tech' },
  { id: '4', name: 'Holiday Special Offer', lastModified: '2024-07-15', category: 'Promotion', previewImage: 'https://placehold.co/600x400.png?text=Holiday+Offer', aiHint: 'festive celebration' },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Manage your email templates or create new ones."
        actions={
          <Button asChild>
            <Link href="/templates/editor">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Template
            </Link>
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Templates Yet</CardTitle>
            <CardDescription>
              Start by creating your first email template.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/templates/editor">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200">
              <div className="aspect-[3/2] w-full overflow-hidden">
                <Image 
                  src={template.previewImage} 
                  alt={template.name} 
                  width={600} 
                  height={400} 
                  className="object-cover w-full h-full"
                  data-ai-hint={template.aiHint} 
                />
              </div>
              <CardHeader className="flex-grow p-4">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>Last modified: {template.lastModified}</CardDescription>
                <CardDescription>Category: {template.category}</CardDescription>
              </CardHeader>
              <CardFooter className="p-4 border-t">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/templates/editor?id=${template.id}`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}