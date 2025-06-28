import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Type, Image, Hash, List, Code, Link2, Table, Zap, Save, Eye } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creating Posts with PlaneMail | Notion-Style Editor Guide',
  description: 'Master PlaneMail\'s Notion-style editor. Learn slash commands, keyboard shortcuts, image uploads, block types, and content creation best practices for email and web publishing.',
  keywords: ['Notion editor', 'content creation', 'slash commands', 'email editor', 'rich text editor', 'blog post creation', 'image upload', 'keyboard shortcuts'],
  openGraph: {
    title: 'Creating Posts with PlaneMail - Notion-Style Editor Guide',
    description: 'Learn to create engaging content with PlaneMail\'s powerful Notion-style editor. Master slash commands, shortcuts, and advanced features.',
    type: 'article',
    siteName: 'PlaneMail',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creating Posts with PlaneMail - Notion-Style Editor Guide',
    description: 'Learn to create engaging content with PlaneMail\'s powerful Notion-style editor. Master slash commands, shortcuts, and advanced features.',
  },
};

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/docs" className="flex items-center space-x-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold">PlaneMail Docs</span>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Docs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creating Posts: Master the Notion-Style Editor</h1>
          <p className="text-gray-600 mb-8">
            Learn to create compelling content with PlaneMail's advanced Notion-style editor. Master slash commands, keyboard shortcuts, 
            image uploads, and content blocks to create engaging posts for both email campaigns and web publishing.
          </p>

          {/* Editor Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Notion-Style Editor Overview</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Type className="h-5 w-5 text-blue-600" />
                  <span>Rich Text Editor</span>
                </CardTitle>
                <CardDescription>
                  PlaneMail's editor is designed to feel familiar and powerful, similar to Notion and other modern writing tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Slash Commands</strong> - Type "/" to quickly insert blocks and formatting</li>
                    <li><strong>Block Indicators</strong> - Visual cues to help navigate and edit content</li>
                    <li><strong>Drag & Drop</strong> - Easily rearrange content blocks</li>
                    <li><strong>Auto-save</strong> - Your work is automatically saved as you type</li>
                    <li><strong>Live Preview</strong> - See how your content will look in real-time</li>
                    <li><strong>Keyboard Shortcuts</strong> - Speed up your workflow with hotkeys</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
                  <p className="text-blue-800 text-sm">
                    Start by typing your content naturally, then use slash commands to enhance formatting and add elements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Slash Commands */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Slash Commands</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Quick Actions with "/"</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Text Formatting</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/h1</code>
                        <span className="text-gray-700">Large heading</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/h2</code>
                        <span className="text-gray-700">Medium heading</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/h3</code>
                        <span className="text-gray-700">Small heading</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/p</code>
                        <span className="text-gray-700">Paragraph</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/quote</code>
                        <span className="text-gray-700">Blockquote</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/code</code>
                        <span className="text-gray-700">Code block</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/hr</code>
                        <span className="text-gray-700">Horizontal rule</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Lists and Structure</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/ul</code>
                        <span className="text-gray-700">Bullet list</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/ol</code>
                        <span className="text-gray-700">Numbered list</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/todo</code>
                        <span className="text-gray-700">Task list</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/table</code>
                        <span className="text-gray-700">Table</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/callout</code>
                        <span className="text-gray-700">Callout box</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Media and Links</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/image</code>
                        <span className="text-gray-700">Insert image</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/link</code>
                        <span className="text-gray-700">Insert link</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/video</code>
                        <span className="text-gray-700">Embed video</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">/embed</code>
                        <span className="text-gray-700">Embed content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h2>
            <Card>
              <CardHeader>
                <CardTitle>Speed Up Your Workflow</CardTitle>
                <CardDescription>
                  Use these keyboard shortcuts to format text and navigate the editor quickly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Text Formatting</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Bold</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + B</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Italic</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + I</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Underline</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + U</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Strikethrough</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + Shift + S</code>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Code</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + E</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Link</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + K</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Highlight</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + Shift + H</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Document Actions</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Save</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + S</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Undo</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + Z</code>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Redo</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + Shift + Z</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Select All</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">⌘ + A</code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Image and Media */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Images and Media</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="h-5 w-5 text-green-600" />
                  <span>Adding Visual Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Image Upload Methods</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Drag & Drop</strong> - Simply drag image files into the editor</li>
                    <li><strong>Slash Command</strong> - Type "/image" and select from computer</li>
                    <li><strong>Copy & Paste</strong> - Paste images directly from clipboard</li>
                    <li><strong>URL Import</strong> - Insert images from web URLs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Supported Formats</h3>
                  <div className="flex flex-wrap gap-2">
                    {['JPG', 'PNG', 'GIF', 'WebP', 'SVG'].map((format) => (
                      <span key={format} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Image Options</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Resize and crop images</li>
                    <li>Add alt text for accessibility</li>
                    <li>Set image alignment (left, center, right)</li>
                    <li>Add captions and descriptions</li>
                    <li>Link images to URLs</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">📸 Best Practices</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Use high-quality images (at least 1200px wide for headers)</li>
                    <li>• Optimize file sizes to improve loading speed</li>
                    <li>• Always add descriptive alt text for accessibility</li>
                    <li>• Consider your audience when using images in emails</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Block Types */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content Blocks</h2>
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Text Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Type className="h-5 w-5 text-blue-600" />
                    <span>Text Blocks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700">
                    <li><strong>Headings</strong> - H1, H2, H3 for structure</li>
                    <li><strong>Paragraphs</strong> - Regular body text</li>
                    <li><strong>Quotes</strong> - Highlighted quotations</li>
                    <li><strong>Callouts</strong> - Important notices</li>
                    <li><strong>Code Blocks</strong> - Formatted code snippets</li>
                  </ul>
                </CardContent>
              </Card>

              {/* List Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <List className="h-5 w-5 text-purple-600" />
                    <span>List Blocks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700">
                    <li><strong>Bullet Lists</strong> - Unordered lists</li>
                    <li><strong>Numbered Lists</strong> - Ordered sequences</li>
                    <li><strong>Task Lists</strong> - Checkable todo items</li>
                    <li><strong>Definition Lists</strong> - Term and definition pairs</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Media Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Image className="h-5 w-5 text-green-600" />
                    <span>Media Blocks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700">
                    <li><strong>Images</strong> - Photos and graphics</li>
                    <li><strong>Videos</strong> - Embedded video content</li>
                    <li><strong>Files</strong> - Downloadable attachments</li>
                    <li><strong>Embeds</strong> - Social media and web content</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Structure Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Table className="h-5 w-5 text-orange-600" />
                    <span>Structure Blocks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700">
                    <li><strong>Tables</strong> - Structured data presentation</li>
                    <li><strong>Columns</strong> - Multi-column layouts</li>
                    <li><strong>Dividers</strong> - Section separators</li>
                    <li><strong>Spacers</strong> - Custom spacing control</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Auto-save and Drafts */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Auto-save and Drafts</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Save className="h-5 w-5 text-teal-600" />
                  <span>Never Lose Your Work</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Automatic Saving</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Content is saved automatically every few seconds</li>
                    <li>Visual indicator shows save status</li>
                    <li>No risk of losing work due to browser crashes</li>
                    <li>All changes are instantly backed up</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Draft Management</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Save posts as drafts for later editing</li>
                    <li>Access all drafts from your dashboard</li>
                    <li>Share draft links with team members</li>
                    <li>Version history for tracking changes</li>
                  </ul>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-teal-900 mb-2">💾 Save Status Indicators</h4>
                  <ul className="text-teal-800 text-sm space-y-1">
                    <li>• <strong>Saving...</strong> - Content is being saved</li>
                    <li>• <strong>Saved</strong> - All changes are saved</li>
                    <li>• <strong>Draft</strong> - Post is saved but not published</li>
                    <li>• <strong>Error</strong> - Save failed, please try again</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Best Practices */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content Creation Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>✍️ Writing Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Start with a compelling headline</li>
                    <li>• Write a clear, engaging introduction</li>
                    <li>• Use subheadings to break up content</li>
                    <li>• Keep paragraphs short and scannable</li>
                    <li>• End with a clear call-to-action</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎨 Design Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Use consistent formatting throughout</li>
                    <li>• Include relevant images and media</li>
                    <li>• Balance text with white space</li>
                    <li>• Test how content looks on mobile</li>
                    <li>• Use highlights and callouts strategically</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📧 Email Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Keep subject lines under 50 characters</li>
                    <li>• Front-load important information</li>
                    <li>• Use alt text for all images</li>
                    <li>• Include a text version of links</li>
                    <li>• Test across different email clients</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🌐 Web Publishing</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Optimize for search engines (SEO)</li>
                    <li>• Use descriptive URLs and meta tags</li>
                    <li>• Include social sharing buttons</li>
                    <li>• Ensure fast loading times</li>
                    <li>• Make content mobile-friendly</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Next Steps */}
          <section className="text-center bg-gray-50 p-8 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Create Amazing Content?</h2>
            <p className="text-gray-600 mb-6">
              Now that you know the editor features, start creating your first post or explore more advanced topics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/posts">
                  Create New Post
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/email-marketing">
                  Learn Email Marketing
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
