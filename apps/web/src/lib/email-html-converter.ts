import { JSDOM } from 'jsdom';

/**
 * Email-safe style templates that work across email clients
 */
const EMAIL_STYLES = {
  // Base styles
  body: `
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333333;
    background-color: #ffffff;
  `,
  
  // Typography
  h1: `
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
    margin: 32px 0 20px 0;
    color: #1a1a1a;
    letter-spacing: -0.02em;
  `,
  h2: `
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    margin: 28px 0 16px 0;
    color: #1a1a1a;
    letter-spacing: -0.01em;
  `,
  h3: `
    font-size: 24px;
    font-weight: 600;
    line-height: 1.4;
    margin: 24px 0 12px 0;
    color: #1a1a1a;
  `,
  h4: `
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
    margin: 20px 0 8px 0;
    color: #1a1a1a;
  `,
  h5: `
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    margin: 16px 0 8px 0;
    color: #1a1a1a;
  `,
  h6: `
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    margin: 12px 0 8px 0;
    color: #1a1a1a;
  `,
  p: `
    margin: 16px 0;
    line-height: 1.7;
    color: #333333;
  `,
  
  // Text formatting
  strong: `
    font-weight: 700;
    color: #1a1a1a;
  `,
  em: `
    font-style: italic;
  `,
  u: `
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  `,
  s: `
    text-decoration: line-through;
  `,
  
  // Links
  a: `
    color: #2563eb;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  `,
  
  // Lists
  ul: `
    margin: 16px 0;
    padding-left: 24px;
    list-style-type: disc;
  `,
  ol: `
    margin: 16px 0;
    padding-left: 24px;
    list-style-type: decimal;
  `,
  li: `
    margin: 8px 0;
    line-height: 1.6;
  `,
  
  // Code
  code: `
    background-color: #f3f4f6;
    color: #374151;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
    border: 1px solid #e5e7eb;
  `,
  pre: `
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
    overflow-x: auto;
    font-family: 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.4;
    color: #374151;
  `,
  
  // Blockquotes
  blockquote: `
    border-left: 4px solid #2563eb;
    background-color: #f8fafc;
    padding: 16px 16px 16px 20px;
    margin: 20px 0;
    font-style: italic;
    color: #64748b;
    border-radius: 0 8px 8px 0;
  `,
  
  // Images
  img: `
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
    display: block;
  `,
  
  // Horizontal rule
  hr: `
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 32px 0;
  `,
  
  // Tables (if needed)
  table: `
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  `,
  th: `
    background-color: #f8fafc;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border: 1px solid #e5e7eb;
  `,
  td: `
    padding: 12px;
    border: 1px solid #e5e7eb;
  `,
  
  // Task lists
  'input[type="checkbox"]': `
    margin-right: 8px;
    margin-top: 4px;
  `,
  
  // Highlights
  mark: `
    background-color: #fef3c7;
    color: #92400e;
    padding: 1px 4px;
    border-radius: 3px;
  `,
};

/**
 * Convert TipTap editor HTML to email-safe HTML with inline styles
 */
export function convertToEmailHTML(editorHTML: string): string {
  if (!editorHTML) return '';
  
  // Create a DOM from the editor HTML
  const dom = new JSDOM(editorHTML);
  const document = dom.window.document;
  
  // Function to apply styles to an element
  function applyInlineStyles(element: Element, tag: string) {
    const styles = EMAIL_STYLES[tag as keyof typeof EMAIL_STYLES];
    if (styles) {
      // Clean up the styles and apply them
      const cleanStyles = styles.replace(/\s+/g, ' ').trim();
      element.setAttribute('style', cleanStyles);
    }
  }
  
  // Apply styles to all relevant elements
  Object.keys(EMAIL_STYLES).forEach(tag => {
    const elements = document.querySelectorAll(tag);
    elements.forEach(element => {
      applyInlineStyles(element, tag);
    });
  });
  
  // Handle special cases
  
  // Convert task list items
  const taskListItems = document.querySelectorAll('li[data-type="taskItem"]');
  taskListItems.forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox) {
      applyInlineStyles(checkbox, 'input[type="checkbox"]');
    }
  });
  
  // Convert highlighted text
  const highlights = document.querySelectorAll('[style*="background"]');
  highlights.forEach(element => {
    if (element.textContent) {
      // Replace with mark element for better email compatibility
      const mark = document.createElement('mark');
      mark.textContent = element.textContent;
      applyInlineStyles(mark, 'mark');
      element.parentNode?.replaceChild(mark, element);
    }
  });
  
  // Ensure images have alt attributes for accessibility
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', img.getAttribute('title') || 'Image');
    }
  });
  
  // Wrap everything in a container with base styles
  const container = document.createElement('div');
  container.setAttribute('style', `
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333333;
  `.replace(/\s+/g, ' ').trim());
  
  // Move all body content to the container
  while (document.body.firstChild) {
    container.appendChild(document.body.firstChild);
  }
  document.body.appendChild(container);
  
  // Return the complete HTML with proper email structure
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="${EMAIL_STYLES.body.replace(/\s+/g, ' ').trim()}">
  ${document.body.innerHTML}
</body>
</html>`.trim();
}

/**
 * Generate a plain text version of the email content
 */
export function convertToPlainText(editorHTML: string): string {
  if (!editorHTML) return '';
  
  const dom = new JSDOM(editorHTML);
  const document = dom.window.document;
  
  // Extract text content with some basic formatting
  let text = '';
  
  function processNode(node: Node, level = 0) {
    if (node.nodeType === 3) { // Text node
      const textContent = node.textContent?.trim();
      if (textContent) {
        text += textContent;
      }
    } else if (node.nodeType === 1) { // Element node
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          text += '\n\n';
          processChildren(element);
          text += '\n';
          // Add underline for headers
          if (tagName === 'h1' || tagName === 'h2') {
            text += '='.repeat(Math.min(element.textContent?.length || 0, 50));
            text += '\n';
          }
          break;
          
        case 'p':
          text += '\n\n';
          processChildren(element);
          break;
          
        case 'br':
          text += '\n';
          break;
          
        case 'ul':
        case 'ol':
          text += '\n';
          processChildren(element);
          text += '\n';
          break;
          
        case 'li':
          text += '\n• ';
          processChildren(element);
          break;
          
        case 'blockquote':
          text += '\n\n> ';
          processChildren(element);
          text += '\n';
          break;
          
        case 'a':
          processChildren(element);
          const href = element.getAttribute('href');
          if (href && href !== element.textContent) {
            text += ` (${href})`;
          }
          break;
          
        case 'code':
          text += '`';
          processChildren(element);
          text += '`';
          break;
          
        case 'pre':
          text += '\n\n```\n';
          processChildren(element);
          text += '\n```\n';
          break;
          
        case 'hr':
          text += '\n\n---\n\n';
          break;
          
        default:
          processChildren(element);
          break;
      }
    }
  }
  
  function processChildren(element: Element) {
    element.childNodes.forEach(child => processNode(child));
  }
  
  processNode(document.body);
  
  // Clean up extra whitespace
  return text
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
    .trim();
}
