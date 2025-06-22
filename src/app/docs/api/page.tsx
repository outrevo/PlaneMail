
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Code2, KeyRound, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlaneMail API Documentation | Integrate Programmatically',
  description: 'Access PlaneMail features via our API. Learn how to authenticate and use endpoints like adding subscribers. Get your API key and start building.',
  // keywords: ['api', 'documentation', 'planemail', 'subscribers', 'email marketing api', 'integration'], // Optional: if you want to add keywords
};

const CodeBlock = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <pre className={`p-4 rounded-md bg-muted text-muted-foreground overflow-x-auto text-sm ${className}`}>
    <code>{children}</code>
  </pre>
);

export default function ApiDocumentationPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <PageHeader
        title="PlaneMail API Documentation"
        description="Integrate PlaneMail programmatically using our API."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5" /> Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            All API requests must be authenticated using an API key. Pass your API key as a Bearer token in the <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">Authorization</code> header.
          </p>
          <CodeBlock>
            Authorization: Bearer YOUR_API_KEY
          </CodeBlock>
          <p>
            You can generate and manage your API keys from the{' '}
            <Button variant="link" asChild className="p-0 h-auto text-sm">
              <Link href="/integrations">Integrations page (requires login) <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>.
            Keep your API keys secure and do not share them publicly.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <section id="endpoints">
        <h2 className="font-headline text-2xl font-semibold tracking-tight mb-4">API Endpoints</h2>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Subscribers API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center">
                <span className="mr-2 inline-block px-2 py-0.5 bg-green-600 text-green-50 rounded-md text-xs font-bold">POST</span>
                <code>/api/v1/subscribers</code>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Adds a new subscriber to your list.</p>

              <div className="mt-4 space-y-3">
                <h4 className="font-medium">Headers</h4>
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Header</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">Authorization</TableCell>
                      <TableCell>Bearer token containing your API key. Example: <code className="bg-muted px-1 py-0.5 rounded-sm">Bearer YOUR_API_KEY</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">Content-Type</TableCell>
                      <TableCell><code className="bg-muted px-1 py-0.5 rounded-sm">application/json</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <h4 className="font-medium pt-2">Request Body (JSON)</h4>
                <CodeBlock>
{`{
  "email": "subscriber@example.com",  // Required, must be a valid email
  "name": "John Doe",                 // Optional, string
  "status": "active",                 // Optional, 'active' | 'unsubscribed' | 'pending' | 'bounced'
                                      // Defaults to 'active' if not provided
  "segmentNames": ["Segment Name 1"]  // Optional, array of existing segment names
}`}
                </CodeBlock>
                <p className="text-xs text-muted-foreground">
                  If <code className="bg-muted px-1 py-0.5 rounded-sm">segmentNames</code> are provided, the subscriber will be added to those existing segments. Segments that do not exist for your account will be ignored.
                </p>

                <h4 className="font-medium pt-2">Responses</h4>
                <div className="space-y-2">
                  <Alert variant="default" className="bg-green-50 border-green-300">
                    <AlertTitle className="text-green-700 flex items-center gap-1"><span className="font-bold text-xs bg-green-600 text-green-50 p-0.5 rounded">201 Created</span> - Subscriber Added</AlertTitle>
                    <AlertDescription className="text-green-600 text-xs">
                      <CodeBlock className="mt-1 bg-green-100 text-green-800 text-[0.7rem]">
{`{
  "message": "Subscriber added successfully.",
  "subscriberId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}`}
                      </CodeBlock>
                    </AlertDescription>
                  </Alert>
                  
                  <Alert variant="destructive" className="text-xs">
                    <AlertTitle className="flex items-center gap-1"><span className="font-bold text-xs bg-destructive text-destructive-foreground p-0.5 rounded">400 Bad Request</span> - Validation Error</AlertTitle>
                    <AlertDescription>The request body is invalid (e.g., missing email, invalid email format). Check the <code className="bg-muted px-1 py-0.5 rounded-sm">details</code> field in the response for more information.</AlertDescription>
                  </Alert>
                   <Alert variant="destructive" className="text-xs">
                    <AlertTitle className="flex items-center gap-1"><span className="font-bold text-xs bg-destructive text-destructive-foreground p-0.5 rounded">401 Unauthorized</span> - Authentication Error</AlertTitle>
                    <AlertDescription>The API key is missing, invalid, or expired.</AlertDescription>
                  </Alert>
                  <Alert variant="destructive" className="text-xs">
                    <AlertTitle className="flex items-center gap-1"><span className="font-bold text-xs bg-destructive text-destructive-foreground p-0.5 rounded">409 Conflict</span> - Subscriber Exists</AlertTitle>
                    <AlertDescription>A subscriber with the provided email address already exists for your account.</AlertDescription>
                  </Alert>
                   <Alert variant="destructive" className="text-xs">
                    <AlertTitle className="flex items-center gap-1"><span className="font-bold text-xs bg-destructive text-destructive-foreground p-0.5 rounded">500 Internal Server Error</span> - Server Error</AlertTitle>
                    <AlertDescription>An unexpected error occurred on the server.</AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
            {/* Future endpoints can be added here as new <div> sections or Cards */}
          </CardContent>
        </Card>
      </section>
      <footer className="text-center text-sm text-muted-foreground mt-12">
        <p>&copy; {new Date().getFullYear()} PlaneMail. All rights reserved.</p>
        <p>
          <Link href="/" className="hover:underline">Back to PlaneMail Home</Link>
        </p>
      </footer>
    </div>
  );
}

    