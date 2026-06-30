// OpenRouter API Integration with Automatic Failover

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// قائمة النماذج المجانية من OpenRouter
export const FREE_MODELS = [
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct', priority: 1 },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B Instruct', priority: 2 },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B IT', priority: 3 },
  { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B Instruct', priority: 4 },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct', priority: 5 },
  { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B', priority: 6 },
  { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'Zephyr 7B Beta', priority: 7 },
  { id: 'nousresearch/nous-capybara-7b:free', name: 'Nous Capybara 7B', priority: 8 },
];

interface AIResponse {
  success: boolean;
  content?: string;
  model?: string;
  error?: string;
}

interface ModelStatus {
  modelId: string;
  failures: number;
  lastFailure?: Date;
}

// تتبع حالة النماذج
const modelStatus: Map<string, ModelStatus> = new Map();

function getNextAvailableModel(excludeModels: string[] = []): string | null {
  const sortedModels = FREE_MODELS
    .filter(m => !excludeModels.includes(m.id))
    .sort((a, b) => {
      const statusA = modelStatus.get(a.id);
      const statusB = modelStatus.get(b.id);
      const failuresA = statusA?.failures || 0;
      const failuresB = statusB?.failures || 0;
      
      // نفضل النماذج ذات الفشل الأقل
      if (failuresA !== failuresB) return failuresA - failuresB;
      return a.priority - b.priority;
    });
  
  return sortedModels[0]?.id || null;
}

function markModelFailure(modelId: string, error: string) {
  const status = modelStatus.get(modelId) || { modelId, failures: 0 };
  status.failures += 1;
  status.lastFailure = new Date();
  modelStatus.set(modelId, status);
}

function markModelSuccess(modelId: string) {
  const status = modelStatus.get(modelId);
  if (status && status.failures > 0) {
    status.failures = Math.max(0, status.failures - 1);
    modelStatus.set(modelId, status);
  }
}

export async function callAI(
  prompt: string,
  systemPrompt: string = 'أنت مساعد كتابة محتوى محترف. اكتب باللغة العربية بشكل احترافي ومُحسّن لمحركات البحث.',
  maxRetries: number = 3
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'OPENROUTER_API_KEY is not configured' };
  }

  const triedModels: string[] = [];
  let lastError = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const modelId = getNextAvailableModel(triedModels);
    
    if (!modelId) {
      return { success: false, error: 'No available AI models' };
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'AI Content Manager',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from AI');
      }

      markModelSuccess(modelId);
      
      return {
        success: true,
        content: content.trim(),
        model: modelId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      markModelFailure(modelId, errorMessage);
      triedModels.push(modelId);
      lastError = errorMessage;
      
      console.error(`AI Model ${modelId} failed:`, errorMessage);
    }
  }

  return { success: false, error: `All AI models failed. Last error: ${lastError}` };
}

// وظائف إنشاء المحتوى
export async function generateHeadlinesAndSubtitles(niche: string, keywords: string[]): Promise<AIResponse> {
  const prompt = `أنشئ عنوان مقال SEO قوي وجذاب عن موضوع "${niche}" مع مراعاة الكلمات المفتاحية: ${keywords.join(', ')}.

أحتاج منك:
1. عنوان رئيسي واحد محسّن لـ SEO (60-70 حرف)
2. 20 عنوان فرعي (H2/H3) للمقال
3. 5 أسئلة FAQ شائعة

أجب بصيغة JSON فقط:
{
  "mainTitle": "العنوان الرئيسي",
  "subHeadlines": ["عنوان فرعي 1", "عنوان فرعي 2", ...],
  "faqQuestions": ["سؤال 1؟", "سؤال 2؟", ...]
}`;

  return callAI(prompt);
}

export async function generateIntroAndFirstPart(
  mainTitle: string,
  subHeadlines: string[]
): Promise<AIResponse> {
  const prompt = `اكتب مقدمة جذابة ومحتوى لمقال بعنوان "${mainTitle}".

العناوين الفرعية التي ستغطيها:
${subHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

المطلوب:
1. مقدمة جذابة (150-200 كلمة) تتضمن الكلمة المفتاحية الرئيسية
2. محتوى لكل عنوان فرعي (200-300 كلمة لكل قسم)
3. استخدم تنسيق HTML (h2, h3, p, ul, li, strong, em)
4. أضف قوائم نقطية حيث مناسب
5. اجعل المحتوى مفيد وشامل

اكتب المحتوى مباشرة بتنسيق HTML:`;

  return callAI(prompt);
}

export async function generateMiddlePart(
  mainTitle: string,
  subHeadlines: string[]
): Promise<AIResponse> {
  const prompt = `أكمل كتابة محتوى لمقال بعنوان "${mainTitle}".

العناوين الفرعية التالية:
${subHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

المطلوب:
1. محتوى شامل لكل عنوان فرعي (200-300 كلمة لكل قسم)
2. استخدم تنسيق HTML (h2, h3, p, ul, li, strong, em, table)
3. أضف جداول مقارنة إذا مناسب
4. استخدم أمثلة عملية
5. اجعل المحتوى مترابط ومفيد

اكتب المحتوى مباشرة بتنسيق HTML:`;

  return callAI(prompt);
}

export async function generateFinalPart(
  mainTitle: string,
  subHeadlines: string[],
  faqQuestions: string[]
): Promise<AIResponse> {
  const prompt = `اكتب الجزء الأخير لمقال بعنوان "${mainTitle}".

العناوين الفرعية المتبقية:
${subHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

أسئلة FAQ للإجابة عليها:
${faqQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

المطلوب:
1. محتوى لكل عنوان فرعي (200-300 كلمة)
2. قسم FAQ مع إجابات مفصلة
3. خاتمة قوية تلخص المقال (150-200 كلمة)
4. دعوة للعمل (CTA) في النهاية
5. استخدم تنسيق HTML

اكتب المحتوى مباشرة بتنسيق HTML:`;

  return callAI(prompt);
}

export async function generateMetaData(title: string, content: string): Promise<AIResponse> {
  const prompt = `بناءً على العنوان والمحتوى التالي، أنشئ بيانات SEO:

العنوان: ${title}
المحتوى: ${content.substring(0, 1000)}...

أجب بصيغة JSON فقط:
{
  "metaTitle": "عنوان ميتا (60 حرف كحد أقصى)",
  "metaDescription": "وصف ميتا جذاب (155 حرف كحد أقصى)",
  "keywords": ["كلمة1", "كلمة2", "كلمة3"],
  "excerpt": "مقتطف المقال (200 حرف)"
}`;

  return callAI(prompt);
}

export function getModelStatuses(): ModelStatus[] {
  return Array.from(modelStatus.values());
}

export function resetModelStatus(modelId: string) {
  modelStatus.delete(modelId);
}
