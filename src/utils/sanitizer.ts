/**
 * Content Sanitization Utilities
 * 
 * Provides XSS-safe HTML escaping and content sanitization
 */

/**
 * Escape HTML characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=\/]/g, (s) => map[s]);
}

/**
 * Escape HTML attributes to prevent XSS in attributes
 */
export function escapeHtmlAttribute(text: string): string {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Sanitize URLs to prevent javascript: and data: protocol attacks
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '#';
  }
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:') ||
    trimmedUrl.startsWith('file:') ||
    trimmedUrl.startsWith('about:')
  ) {
    return '#';
  }
  
  // Allow relative URLs and safe protocols
  if (
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('./') ||
    trimmedUrl.startsWith('../') ||
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('mailto:') ||
    trimmedUrl.startsWith('tel:') ||
    trimmedUrl.startsWith('#')
  ) {
    return url;
  }
  
  // For anything else, prepend https://
  return `https://${url}`;
}

/**
 * Sanitize CSS values to prevent CSS injection
 */
export function sanitizeCss(cssValue: string): string {
  if (typeof cssValue !== 'string') {
    return '';
  }
  
  // Remove dangerous CSS constructs
  return cssValue
    .replace(/javascript:/gi, '')
    .replace(/expression\(/gi, '')
    .replace(/@import/gi, '')
    .replace(/url\(/gi, '')
    .replace(/behavior:/gi, '')
    .replace(/-moz-binding:/gi, '');
}

/**
 * Create safe HTML from template literals
 * Usage: html`<div>${safeContent}</div>`
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
  let result = '';
  
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    
    if (i < values.length) {
      const value = values[i];
      
      // If it's marked as safe HTML (using unsafeHtml), don't escape it
      if (value && typeof value === 'object' && value.__unsafeHtml) {
        result += value.html;
      } else {
        result += escapeHtml(String(value));
      }
    }
  }
  
  return result;
}

/**
 * Mark HTML as safe (use with extreme caution!)
 * Only use this for HTML that you trust completely
 */
export function unsafeHtml(htmlString: string): { __unsafeHtml: true; html: string } {
  return { __unsafeHtml: true, html: htmlString };
}

/**
 * Sanitize message content for display
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeMessageContent(content: string): string {
  if (typeof content !== 'string') {
    return '';
  }
  
  // First escape all HTML
  let sanitized = escapeHtml(content);
  
  // Allow basic formatting by converting escaped characters back
  // Only allow safe, basic formatting
  sanitized = sanitized
    .replace(/&lt;br&gt;/gi, '<br>')
    .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/gi, '<strong>$1</strong>')
    .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/gi, '<em>$1</em>')
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<b>$1</b>')
    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<i>$1</i>');
  
  return sanitized;
}

/**
 * Sanitize user profile data
 */
export function sanitizeProfileData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? escapeHtml(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize JSON data
 */
export function sanitizeJsonData(data: any): any {
  if (typeof data === 'string') {
    return escapeHtml(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeJsonData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Sanitize the key as well
      const sanitizedKey = escapeHtml(String(key));
      sanitized[sanitizedKey] = sanitizeJsonData(value);
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Safe innerHTML replacement
 * Use this instead of element.innerHTML = content
 */
export function safeSetInnerHTML(element: Element, content: string): void {
  // Clear existing content
  element.textContent = '';
  
  // Create a temporary container
  const temp = document.createElement('div');
  temp.innerHTML = content;
  
  // Move nodes from temp to target element
  while (temp.firstChild) {
    element.appendChild(temp.firstChild);
  }
}

/**
 * Safe text content setter
 * Always use this for user-generated content
 */
export function safeSetTextContent(element: Element, content: string): void {
  element.textContent = String(content);
}

/**
 * Content Security Policy helper
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that content doesn't contain potential XSS vectors
 */
export function validateSafeContent(content: string): boolean {
  if (typeof content !== 'string') {
    return false;
  }
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /onmouseover=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /data:text\/html/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(content));
}

export default {
  escapeHtml,
  escapeHtmlAttribute,
  sanitizeUrl,
  sanitizeCss,
  html,
  unsafeHtml,
  sanitizeMessageContent,
  sanitizeProfileData,
  sanitizeJsonData,
  safeSetInnerHTML,
  safeSetTextContent,
  generateCSPNonce,
  validateSafeContent,
};