import OpenAI from 'openai';

export async function generateRegex(description: string, flags: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('未配置 OPENAI_API_KEY，请检查环境变量配置');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const prompt = `我需要一个正则表达式来满足以下需求：${description}。

请只返回纯文本的正则表达式本身，不要包含任何额外的解释、markdown格式、反引号、括号等内容，只返回正则表达式。
如果有修饰符flags，请包含这些修饰符：${flags || '无'}。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const regex = response.choices[0]?.message?.content?.trim();
    if (!regex) {
      throw new Error('生成失败，请重试');
    }

    // Clean up any markdown code block wrapping
    let cleanedRegex = regex.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '');
    cleanedRegex = cleanedRegex.replace(/^`|`$/g, '');

    return cleanedRegex;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('API调用失败，请检查配置');
  }
}