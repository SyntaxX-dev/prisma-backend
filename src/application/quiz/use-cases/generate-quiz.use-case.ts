import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import type { QuizSessionRepository } from '../../../domain/repositories/quiz-session.repository';
import type { QuizQuestionRepository } from '../../../domain/repositories/quiz-question.repository';
import type { QuizOptionRepository } from '../../../domain/repositories/quiz-option.repository';
import { QuizSession } from '../../../domain/entities/quiz-session';
import { GeminiService } from '../../../infrastructure/services/gemini.service';
import {
  QUIZ_SESSION_REPOSITORY,
  QUIZ_QUESTION_REPOSITORY,
  QUIZ_OPTION_REPOSITORY,
} from '../../../domain/tokens';

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctOption: number; // 1-4
  explanation: string;
}

interface GenerateQuizInput {
  userId: string;
  topic: string;
}

interface GenerateQuizOutput {
  sessionId: string;
  topic: string;
  questions: Array<{
    id: string;
    questionText: string;
    order: number;
    options: Array<{
      id: string;
      optionText: string;
      optionNumber: number;
    }>;
  }>;
}

@Injectable()
export class GenerateQuizUseCase {
  constructor(
    @Inject(QUIZ_SESSION_REPOSITORY)
    private readonly sessionRepository: QuizSessionRepository,
    @Inject(QUIZ_QUESTION_REPOSITORY)
    private readonly questionRepository: QuizQuestionRepository,
    @Inject(QUIZ_OPTION_REPOSITORY)
    private readonly optionRepository: QuizOptionRepository,
    private readonly geminiService: GeminiService,
  ) {}

  async execute(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
    // 1. Criar sessão de quiz
    const sessionData = QuizSession.create(input.userId, input.topic, 10);
    const session = await this.sessionRepository.create(sessionData);

    try {
      // 2. Gerar questões com Gemini
      const generatedQuestions = await this.generateQuestionsWithGemini(
        input.topic,
      );

      // 3. Salvar questões no banco
      const questionsToCreate = generatedQuestions.map((q, index) => ({
        sessionId: session.id,
        questionText: q.question,
        correctOption: q.correctOption,
        explanation: q.explanation,
        order: index + 1,
      }));

      const savedQuestions =
        await this.questionRepository.createMany(questionsToCreate);

      // 4. Salvar opções no banco
      const allOptions: Array<{
        questionId: string;
        optionText: string;
        optionNumber: number;
      }> = [];

      savedQuestions.forEach((question, qIndex) => {
        generatedQuestions[qIndex].options.forEach((optionText, oIndex) => {
          allOptions.push({
            questionId: question.id,
            optionText,
            optionNumber: oIndex + 1,
          });
        });
      });

      const savedOptions = await this.optionRepository.createMany(allOptions);

      // 5. Organizar resposta
      const questionsWithOptions = savedQuestions.map((question) => {
        const questionOptions = savedOptions.filter(
          (opt) => opt.questionId === question.id,
        );

        return {
          id: question.id,
          questionText: question.questionText,
          order: question.order,
          options: questionOptions.map((opt) => ({
            id: opt.id,
            optionText: opt.optionText,
            optionNumber: opt.optionNumber,
          })),
        };
      });

      return {
        sessionId: session.id,
        topic: session.topic,
        questions: questionsWithOptions,
      };
    } catch (error) {
      // Se falhar, deletar a sessão criada
      await this.sessionRepository.delete(session.id);
      throw error;
    }
  }

  private async generateQuestionsWithGemini(
    topic: string,
  ): Promise<GeneratedQuestion[]> {
    const prompt = `
Você é um professor especialista. Gere exatamente 10 questões de múltipla escolha sobre o tema: "${topic}"

REGRAS OBRIGATÓRIAS:
- Exatamente 10 questões
- Cada questão deve ter exatamente 4 alternativas
- correctOption deve ser um número de 1 a 4 (não índice 0-3)
- Explicação clara e educativa de 2-3 linhas
- Nível: Ensino Médio/ENEM
- Questões devem ser desafiadoras mas justas
- Alternativas incorretas devem ser plausíveis

FORMATO DE RESPOSTA - RETORNE APENAS O JSON, SEM MARKDOWN:
{
  "questions": [
    {
      "question": "Texto da pergunta aqui?",
      "options": ["Alternativa 1", "Alternativa 2", "Alternativa 3", "Alternativa 4"],
      "correctOption": 2,
      "explanation": "Explicação detalhada da resposta correta"
    }
  ]
}

IMPORTANTE:
- Retorne APENAS o JSON puro, sem \`\`\`json ou markdown
- O array "questions" deve ter EXATAMENTE 10 itens
- correctOption: número de 1 a 4
`.trim();

    try {
      const response = await this.callGeminiAPI(prompt);
      const parsed = this.parseGeminiResponse(response);

      if (parsed.questions.length !== 10) {
        throw new BadRequestException(
          'IA não gerou exatamente 10 questões. Tente novamente.',
        );
      }

      // Validar cada questão
      parsed.questions.forEach((q, index) => {
        if (!q.question || typeof q.question !== 'string') {
          throw new BadRequestException(
            `Questão ${index + 1} inválida: texto ausente`,
          );
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new BadRequestException(
            `Questão ${index + 1} inválida: deve ter 4 alternativas`,
          );
        }
        if (
          typeof q.correctOption !== 'number' ||
          q.correctOption < 1 ||
          q.correctOption > 4
        ) {
          throw new BadRequestException(
            `Questão ${index + 1} inválida: correctOption deve ser 1-4`,
          );
        }
        if (!q.explanation || typeof q.explanation !== 'string') {
          throw new BadRequestException(
            `Questão ${index + 1} inválida: explicação ausente`,
          );
        }
      });

      return parsed.questions;
    } catch (error) {
      console.error('Erro ao gerar questões com Gemini:', error);
      throw new BadRequestException(
        'Não foi possível gerar as questões. Tente novamente ou mude o tema.',
      );
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('GEMINI_API_KEY não configurada');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        `Erro na API do Gemini: ${response.statusText}`,
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new BadRequestException('Resposta vazia da IA');
    }

    return text;
  }

  private parseGeminiResponse(response: string): {
    questions: GeneratedQuestion[];
  } {
    // Limpar markdown se vier
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanedResponse);
      return parsed;
    } catch (error) {
      console.error('Erro ao parsear resposta do Gemini:', error);
      console.error('Resposta recebida:', response);
      throw new BadRequestException(
        'Resposta da IA em formato inválido. Tente novamente.',
      );
    }
  }
}
