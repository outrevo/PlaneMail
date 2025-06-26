"use client";

import React, { useEffect, useState, useTransition, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Loader2,
  ArrowLeft,
  Monitor,
  Smartphone,
  Code2,
  Settings,
} from "lucide-react";
import { getTemplateById, createTemplate, updateTemplate } from "../../actions";

// Default Unlayer design structure
const defaultUnlayerDesign = {
  body: {
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: "text",
                values: {
                  text: "Start building your email here!",
                  fontSize: "16px",
                  textAlign: "left",
                  lineHeight: "140%",
                  color: "#333333",
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

declare global {
  interface Window {
    unlayer: {
      init: (config: any) => void;
      loadDesign: (design: any) => void;
      exportHtml: (callback: (data: { design: any; html: string }) => void) => void;
      addEventListener: (event: string, callback: () => void) => void;
    };
  }
}

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const templateId = params.id === "new" ? null : (params.id as string);
  const isUnlayerLoaded = useRef(false);
  const isUnlayerInitializing = useRef(false);

  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [currentDesign, setCurrentDesign] = useState(defaultUnlayerDesign);
  const [currentHtml, setCurrentHtml] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeView, setActiveView] = useState<"editor" | "preview-desktop" | "preview-mobile" | "json">("editor");

  const initializeUnlayer = useCallback(() => {
    if (window.unlayer && !isUnlayerLoaded.current && !isUnlayerInitializing.current) {
      isUnlayerInitializing.current = true;
      
      // Check if the editor element exists
      const editorElement = document.getElementById('editor');
      if (!editorElement) {
        console.warn('Editor element not found, retrying...');
        isUnlayerInitializing.current = false;
        // Retry after a short delay
        setTimeout(() => {
          initializeUnlayer();
        }, 100);
        return;
      }
      
      try {
        console.log('Initializing Unlayer with element:', editorElement);
        window.unlayer.init({
          id: 'editor',
          projectId: process.env.NEXT_PUBLIC_UNLAYER_PROJECT_ID || undefined,
          displayMode: 'email',
          appearance: {
            theme: 'light',
            panels: {
              tools: {
                dock: 'left'
              }
            }
          },
          features: {
            preview: false,
            export: false,
            saveAsTemplate: false,
          }
        });

        // Listen for design changes
        window.unlayer.addEventListener('design:updated', () => {
          window.unlayer.exportHtml((data) => {
            setCurrentDesign(data.design);
            setCurrentHtml(data.html);
          });
        });

        isUnlayerLoaded.current = true;
        console.log('Unlayer initialized successfully');
        
        // Load the current design after initialization
        setTimeout(() => {
          if (currentDesign && window.unlayer) {
            window.unlayer.loadDesign(currentDesign);
          }
        }, 100);
        
      } catch (error) {
        console.error('Error initializing Unlayer:', error);
        isUnlayerInitializing.current = false;
      }
    }
  }, [currentDesign]);

  // Load Unlayer script
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://editor.unlayer.com/embed.js"]')) {
      // Script already loaded, try to initialize
      if (window.unlayer) {
        initializeUnlayer();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://editor.unlayer.com/embed.js";
    script.async = true;
    script.onload = () => {
      console.log('Unlayer script loaded');
      initializeUnlayer();
    };
    script.onerror = (error) => {
      console.error('Failed to load Unlayer script:', error);
    };
    
    document.head.appendChild(script);

    return () => {
      // Don't remove the script on cleanup as it might be needed for other instances
    };
  }, [initializeUnlayer]);

  // Load template data
  useEffect(() => {
    setIsLoading(true);
    if (templateId) {
      getTemplateById(templateId)
        .then((data) => {
          if (data) {
            setTemplateName(data.name);
            setTemplateCategory(data.category || "");
            
            if (data.content) {
              try {
                const parsedContent = JSON.parse(data.content);
                
                // Check if it's Unlayer format or old format
                if (parsedContent.design && parsedContent.html) {
                  setCurrentDesign(parsedContent.design);
                  setCurrentHtml(parsedContent.html);
                } else if (parsedContent.body) {
                  // Already in Unlayer format
                  setCurrentDesign(parsedContent);
                } else {
                  // Old format, use default
                  setCurrentDesign(defaultUnlayerDesign);
                }
              } catch (e) {
                console.error("Failed to parse template content:", e);
                toast({
                  title: "Error",
                  description: "Could not load template content. Using default.",
                  variant: "destructive",
                });
                setCurrentDesign(defaultUnlayerDesign);
              }
            } else {
              setCurrentDesign(defaultUnlayerDesign);
            }
          } else {
            toast({
              title: "Error",
              description: "Template not found.",
              variant: "destructive",
            });
            router.push("/templates");
          }
        })
        .catch((err) => {
          console.error("Error loading template:", err);
          toast({
            title: "Error",
            description: "Failed to load template.",
            variant: "destructive",
          });
          setError("Failed to load template.");
          setCurrentDesign(defaultUnlayerDesign);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setTemplateName("Untitled Template");
      setTemplateCategory("General");
      setCurrentDesign(defaultUnlayerDesign);
      setIsLoading(false);
    }
  }, [templateId, router, toast]);

  // Load design into Unlayer when it changes
  useEffect(() => {
    if (window.unlayer && isUnlayerLoaded.current && currentDesign) {
      setTimeout(() => {
        window.unlayer.loadDesign(currentDesign);
      }, 100);
    }
  }, [currentDesign]);

  const handleSave = async () => {
    // Validate required fields
    if (!templateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required.",
        variant: "destructive",
      });
      setError("Template name is required.");
      return;
    }

    if (templateName.trim().length < 3) {
      toast({
        title: "Validation Error",
        description: "Template name must be at least 3 characters long.",
        variant: "destructive",
      });
      setError("Template name must be at least 3 characters long.");
      return;
    }

    // Clear any previous errors
    setError(null);

    // Get current design from Unlayer
    if (window.unlayer && isUnlayerLoaded.current) {
      try {
        window.unlayer.exportHtml((data) => {
          console.log('Exported data from Unlayer:', data);
          if (data && data.design) {
            saveTemplate(data);
          } else {
            console.error('Invalid data from Unlayer:', data);
            saveTemplate({ design: currentDesign, html: currentHtml });
          }
        });
      } catch (exportError) {
        console.error('Export error:', exportError);
        saveTemplate({ design: currentDesign, html: currentHtml });
      }
    } else {
      console.log('Using current design and HTML');
      saveTemplate({ design: currentDesign, html: currentHtml });
    }
  };

  // Add this function to generate preview image
  const generatePreviewImage = async (html: string): Promise<string> => {
    try {
      // Create a temporary iframe to render the email
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '600px';
      iframe.style.height = '800px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      // Write the HTML content to the iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe document');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use html2canvas to capture the iframe content
      const { default: html2canvas } = await import('html2canvas');
      
      const canvas = await html2canvas(iframeDoc.body, {
        width: 600,
        height: 400,
        scale: 0.5, // Reduce size for better performance
        useCORS: true,
        allowTaint: true,
      });

      // Clean up
      document.body.removeChild(iframe);

      // Convert to blob and return data URL
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            resolve('');
          }
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('Error generating preview image:', error);
      return '';
    }
  };

  const saveTemplate = async (data: { design: any; html: string }) => {
    setIsSaving(true);
    setError(null);

    try {
      const templateData = {
        name: templateName.trim(),
        category: templateCategory.trim() || "General",
        content: JSON.stringify({
          design: data.design,
          html: data.html,
        }),
      };

      // Validate required fields before sending
      if (!templateData.name) {
        toast({
          title: "Validation Error",
          description: "Template name is required.",
          variant: "destructive",
        });
        setError("Template name is required.");
        setIsSaving(false);
        return;
      }

      if (templateData.name.length > 255) {
        toast({
          title: "Validation Error",
          description: "Template name must be 255 characters or less.",
          variant: "destructive",
        });
        setError("Template name is too long.");
        setIsSaving(false);
        return;
      }

      console.log('Saving template with data:', templateData);

      // Generate preview image
      let previewImageDataUrl = '';
      if (data.html) {
        try {
          previewImageDataUrl = await generatePreviewImage(data.html);
        } catch (error) {
          console.warn('Failed to generate preview image:', error);
        }
      }

      startTransition(async () => {
        try {
          let result;
          if (templateId) {
            // For updates, create FormData
            const formData = new FormData();
            formData.append("name", templateData.name);
            formData.append("category", templateData.category);
            formData.append("content", templateData.content);
            
            // Add preview image if generated
            if (previewImageDataUrl) {
              // Convert data URL to blob and add to FormData
              const response = await fetch(previewImageDataUrl);
              const blob = await response.blob();
              formData.append("previewImage", blob, `${templateData.name}-preview.jpg`);
            }
            
            result = await updateTemplate(templateId, formData);
          } else {
            // For creates, create FormData
            const formData = new FormData();
            formData.append("name", templateData.name);
            formData.append("category", templateData.category);
            formData.append("content", templateData.content);
            
            // Add preview image if generated
            if (previewImageDataUrl) {
              // Convert data URL to blob and add to FormData
              const response = await fetch(previewImageDataUrl);
              const blob = await response.blob();
              formData.append("previewImage", blob, `${templateData.name}-preview.jpg`);
            }
            
            result = await createTemplate(formData);
          }

          console.log('Server response:', result);

          if (result.success && result.template) {
            toast({
              title: "Success",
              description: `Template ${templateId ? "updated" : "created"} successfully.`,
            });
            
            if (!templateId && result.template.id) {
              router.replace(`/templates/editor/${result.template.id}`, {
                scroll: false,
              });
            }
            
            setCurrentDesign(data.design);
            setCurrentHtml(data.html);
          } else {
            const errorMsg = result.message || "Failed to save template.";
            console.error('Save failed:', result);
            console.error('Validation errors:', result.errors);
            
            // Show specific validation errors if available
            if (result.errors) {
              const errorMessages = Object.entries(result.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('\n');
            
              toast({
                title: "Validation Error",
                description: errorMessages,
                variant: "destructive",
              });
              setError(errorMessages);
            } else {
              toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive",
              });
              setError(errorMsg);
            }
          }
        } catch (e) {
          console.error('Save error:', e);
          const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred.";
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
          setError(errorMsg);
        } finally {
          setIsSaving(false);
        }
      });
    } catch (e) {
      console.error('Pre-save error:', e);
      const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      setError(errorMsg);
      setIsSaving(false);
    }
  };

  // Initialize Unlayer when the component mounts and the editor element is available
  useEffect(() => {
    if (activeView === 'editor' && !isLoading) {
      // Wait a bit for the DOM to be ready
      const timer = setTimeout(() => {
        if (window.unlayer) {
          initializeUnlayer();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeView, isLoading, initializeUnlayer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">
          {templateId ? "Loading template..." : "Initializing editor..."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Compact header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/templates")}
              disabled={isSaving || isPending}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {templateId ? `Edit: ${templateName || "Template"}` : "New Template"}
              </h1>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || isPending}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Compact form controls */}
      <div className="flex-shrink-0 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="h-8 text-sm"
              disabled={isSaving || isPending}
            />
          </div>
          <div className="flex-1">
            <Input
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              placeholder="Category"
              className="h-8 text-sm"
              disabled={isSaving || isPending}
            />
          </div>
          <Tabs
            value={activeView}
            onValueChange={(value) => setActiveView(value as any)}
            className="w-auto"
          >
            <TabsList className="h-8">
              <TabsTrigger value="editor" className="text-xs px-3">
                <Settings className="h-3 w-3 mr-1" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview-desktop" className="text-xs px-3">
                <Monitor className="h-3 w-3 mr-1" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="preview-mobile" className="text-xs px-3">
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs px-3">
                <Code2 className="h-3 w-3 mr-1" />
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>

      {/* Full height editor area */}
      <div className="flex-1 min-h-0 relative">
        {/* Always render the editor div for Unlayer to attach to */}
        <div 
          id="editor" 
          className={`absolute inset-0 ${activeView === "editor" ? "block" : "hidden"}`}
        />
        
        {activeView === "editor" && !isUnlayerLoaded.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading Unlayer editor...</p>
            </div>
          </div>
        )}
        
        {activeView === "preview-desktop" && (
          <div className="absolute inset-0 overflow-auto p-4 bg-muted/40">
            <div className="max-w-[800px] mx-auto">
              <Card className="shadow-xl">
                <CardContent className="p-0">
                  <div 
                    className="w-full"
                    dangerouslySetInnerHTML={{ __html: currentHtml }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeView === "preview-mobile" && (
          <div className="absolute inset-0 overflow-auto p-4 bg-muted/40">
            <div className="max-w-[375px] mx-auto border shadow-xl bg-white rounded-[30px] p-2 border-gray-700">
              <div className="overflow-y-auto h-[667px] rounded-[20px]">
                <div 
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: currentHtml }}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeView === "json" && (
          <div className="absolute inset-0 p-4">
            <Textarea
              className="w-full h-full font-mono text-xs p-4 border rounded-md bg-background resize-none"
              value={JSON.stringify({ design: currentDesign, html: currentHtml }, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (parsed.design) {
                    setCurrentDesign(parsed.design);
                    if (parsed.html) {
                      setCurrentHtml(parsed.html);
                    }
                    if (window.unlayer && isUnlayerLoaded.current) {
                      window.unlayer.loadDesign(parsed.design);
                    }
                  }
                } catch (parseError) {
                  console.warn("Invalid JSON in textarea");
                }
              }}
              readOnly={isSaving || isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}
