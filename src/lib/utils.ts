// Utility functions

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9\-]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0).length;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try direct parse
    return JSON.parse(json);
  } catch {
    // Try to find JSON object in the string
    const objectMatch = json.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200; // Average reading speed in Arabic
  return Math.ceil(wordCount / wordsPerMinute);
}

export function generateBreadcrumbs(
  path: string,
  labels: Record<string, string> = {}
): { name: string; url: string }[] {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs: { name: string; url: string }[] = [
    { name: 'الرئيسية', url: '/' }
  ];
  
  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    breadcrumbs.push({
      name: labels[part] || part,
      url: currentPath,
    });
  }
  
  return breadcrumbs;
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  imageUrl?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: article.imageUrl,
  };
}

export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string; image?: string }[];
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function cronToNextRun(cronExpression: string): Date {
  // Simple cron parser for common patterns
  const now = new Date();
  const parts = cronExpression.split(' ');
  
  if (parts.length !== 5) return now;
  
  const [minute, hour] = parts;
  
  const nextRun = new Date(now);
  
  if (minute !== '*') {
    nextRun.setMinutes(parseInt(minute));
  }
  
  if (hour !== '*') {
    nextRun.setHours(parseInt(hour));
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  }
  
  return nextRun;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove scripts and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
