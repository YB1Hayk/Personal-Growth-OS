import { weeklyPlanSchema } from './content.schema';
import { prisma } from '../../shared/lib/prisma';
import { aiProvider } from '../../shared/ai';
import { telegramSkill } from './skills/telegram.skill';
import { copywritingSkill } from './skills/copywriting.skill';
import { editingSkill } from './skills/editing.skill';
import { sellingMeaningsSkill } from './skills/selling-meanings.skill';

export type ContentStrategy = 'PAIN_SOLVE' | 'STORYTELLING';

export class ContentService {

  private readonly systemPrompt = `
ЧЕГО ДЕЛАТЬ НЕЛЬЗЯ:
- НЕТ длинным текстам (максимум лаконичности).
- НЕТ сухим характеристикам (продаем легенду, а не материалы).
- НЕТ агрессивным продажам (никакого "купи прямо сейчас", только аккуратный перевод в бот).

ОБЩИЕ ПРАВИЛА:
- Запрещено использовать клише. 
- Используй рваный ритм текста, сленг индустрии и бей в эмоции. 
- Твоя задача — вызвать острое желание обладания.
`;

  private readonly strategyPrompts: Record<ContentStrategy, string> = {
    PAIN_SOLVE: `
СТРАТЕГИЯ: Pain-Solve (Проблема-Решение).
Инструкция: Сначала жестко подсвети проблему пользователя (например, его текущий стиль или обувь), усиливай это давление, а затем выдай наш продукт как единственное спасение.
`,
    STORYTELLING: `
СТРАТЕГИЯ: Storytelling (История).
Инструкция: Сочини короткий, дерзкий нарратив. Никакой прямой продажи в лоб. Только эмоция, вайб и в конце — органичная ссылка на товар.
`
  };

  async enhanceRequest(userRequest: string): Promise<string[]> {
    const instructions: string[] = [this.systemPrompt];
    instructions.push(telegramSkill.instructions);
    instructions.push(copywritingSkill.instructions);
    instructions.push(editingSkill.instructions);

    if (userRequest.toLowerCase().includes('продай')) {
      instructions.push(sellingMeaningsSkill.instructions);
    }

    return instructions;
  }

  async generateWeeklyPlan(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const { dna, niche, brandVoice } = project;
    
    const existingPosts = await prisma.contentPost.findMany({
      where: { projectId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { title: true }
    });
    const existingTitles = existingPosts.map(p => p.title).join(', ');

    const planPrompt = `
Создай контент-план на неделю (7 постов) для проекта "${project.name}" (Ниша: ${niche}).
ДНК проекта: ${dna || 'Инновации и стиль'}
Голос бренда: ${brandVoice || 'Дерзкий'}

УЖЕ ЕСТЬ ТЕМЫ (НЕ ПОВТОРЯТЬ): ${existingTitles}

Инструкция: Сгенерируй 7 УНИКАЛЬНЫХ постов. 
Для каждого поста придумай заголовок и напиши ПОЛНЫЙ текст (100-300 слов).

ТРЕБОВАНИЯ К ФОРМАТУ:
1. НИКАКОЙ РАЗМЕТКИ. Запрещено использовать **, *, #, и прочее. Только чистый текст.
2. Используй эмодзи для акцентов и разделения.
3. Заголовок должен быть ПЕРВОЙ строкой текста, написан БОЛЬШИМИ БУКВАМИ.
4. Разные форматы для каждого дня: Кейс, Лайфхак, Аналитика, Провокация, Вайб, Экспертность, Инсайд.

Верни ответ ТОЛЬКО в формате JSON (массив объектов):
[
  {"title": "ЗАГОЛОВОК", "content": "Полный текст поста..."},
  ...
]
`.trim();

    const planJson = await aiProvider.generateText(planPrompt, { temperature: 0.8 });
    const cleanJson = planJson.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const plans = weeklyPlanSchema.parse(JSON.parse(cleanJson));

    const now = new Date();
    const postsData = plans.slice(0, 7).map((plan, index) => {
      const scheduledAt = new Date(now);
      scheduledAt.setDate(now.getDate() + index + 1);
      
      // Рандомное время между 10:00 и 19:00
      const randomHour = Math.floor(Math.random() * (19 - 10 + 1)) + 10;
      const randomMinute = Math.floor(Math.random() * 60);
      scheduledAt.setHours(randomHour, randomMinute, 0, 0);

      return {
        title: plan.title.trim(),
        content: plan.content.trim(),
        projectId,
        status: "DRAFT",
        scheduledAt
      };
    });

    await prisma.contentPost.createMany({
      data: postsData
    });

    return this.getPostsByProject(projectId);
  }

  async getPostsByProject(projectId: string) {
    return prisma.contentPost.findMany({
      where: { projectId },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  async generatePost(postId: string, strategy: ContentStrategy = 'PAIN_SOLVE') {
    const post = await prisma.contentPost.findUnique({
      where: { id: postId },
      include: { project: true }
    });

    if (!post) throw new Error('Post not found');
    if (!['DRAFT', 'APPROVED'].includes(post.status)) throw new Error('Пост недоступен для генерации');

    const { dna, targetAudience, brandVoice } = post.project;
    const baseInstructions = await this.enhanceRequest(post.title);
    
    const diversityPrompt = `
ФОРМАТ КОНТЕНТА: Используй один из подходов (кейс, лайфхак, аналитика, провокация).
НИКАКОЙ РАЗМЕТКИ МАРКДАУН (запрещено **, *, #). 
Текст должен быть чистым. Используй переносы строк и эмодзи.
Заголовок должен быть первой строкой (ЗАГЛАВНЫМИ БУКВАМИ).
`;

    const dnaPrompt = `
Используя философию: ${dna || 'Инновации'}, 
аудиторию: ${targetAudience || 'Профи'}, 
стиль: ${brandVoice || 'Дерзкий'}, 
напиши пост на тему: "${post.title}".
`.trim();

    const finalPrompt = [
        ...baseInstructions, 
        this.strategyPrompts[strategy],
        diversityPrompt, 
        dnaPrompt
    ].join('\n\n');

    const generatedContent = await aiProvider.generateText(finalPrompt, { temperature: 0.8 });

    await this.updatePost(postId, { content: generatedContent }, post.updatedAt);
    return prisma.contentPost.findUniqueOrThrow({ where: { id: postId } });
  }

  async deletePost(id: string) {
    const result = await prisma.contentPost.deleteMany({ where: { id, status: { in: ['DRAFT', 'APPROVED'] } } });
    if (result.count !== 1) throw new Error('Пост недоступен для удаления');
    return result;
  }

  async clearProjectQueue(projectId: string) {
    return prisma.contentPost.deleteMany({
      where: { 
        projectId,
        status: 'DRAFT'
      }
    });
  }

  async approvePost(id: string) {
    const post = await prisma.contentPost.findUnique({ where: { id } });
    if (!post?.content?.trim()) throw new Error('Нельзя одобрить пустой пост');
    const result = await prisma.contentPost.updateMany({
      where: { id, status: { in: ['DRAFT', 'APPROVED'] }, updatedAt: post.updatedAt },
      data: { status: 'APPROVED' },
    });
    if (result.count !== 1) throw new Error('Пост нельзя одобрить');
  }

  async updatePost(id: string, data: { title?: string; content?: string | null; scheduledAt?: Date | null }, updatedAt?: Date) {
    const result = await prisma.contentPost.updateMany({
      where: { id, status: { in: ['DRAFT', 'APPROVED'] }, ...(updatedAt ? { updatedAt } : {}) },
      data: { ...data, ...(data.content !== undefined || data.title !== undefined ? { status: 'DRAFT' } : {}) },
    });
    if (result.count !== 1) throw new Error('Пост изменён или недоступен для редактирования');
    return prisma.contentPost.findUniqueOrThrow({ where: { id } });
  }
}
