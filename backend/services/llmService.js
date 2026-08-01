import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const checkAI = () => {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is missing. Add it to backend/.env before using LLM text generation.');
  }
};

const DEPTH_INSTRUCTIONS = {
  OVERVIEW: "Keep explanations concise and high-level. Focus on core concepts without deep technical detail. Aim for 300-500 words.",
  BASIC: "Provide clear explanations with practical examples. Cover the fundamentals thoroughly. Aim for 500-800 words.",
  DETAILED: "Provide comprehensive, in-depth explanations with code examples, edge cases, and real-world applications. Aim for 800-1500 words.",
};

const QUIZ_QUESTION_COUNT = {
  OVERVIEW: 2,
  BASIC: 3,
  DETAILED: 5,
};

/**
 * Generates an outline for a course and returns structured JSON
 * @param {string} topic - The topic of the course
 * @param {string} depth - The depth (e.g., OVERVIEW, BASIC, DETAILED)
 * @param {string} language - The language to generate content in (default: ENGLISH)
 * @returns {Promise<{title: string | null, description: string | null, estimatedDuration: number | null, chapters: Array<{title: string, objective: string}>}>}
 */
export const generateCourseOutline = async (topic, depth, language = 'ENGLISH') => {
  checkAI();

  const systemPrompt = `You are an expert curriculum designer.
You MUST generate a course syllabus for a ${depth} level course on "${topic}".
Generate ALL content in ${language}.
estimatedDuration should be in hours. Base it on the depth level and number of chapters.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A concise, engaging course title" },
      description: { type: Type.STRING, description: "A 2-3 sentence description of what the course covers and who it is for." },
      estimatedDuration: { type: Type.NUMBER, description: "Estimated duration in hours" },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Chapter Heading" },
            objective: { type: Type.STRING, description: "A short 1-sentence description of the chapter." }
          },
          required: ["title", "objective"]
        }
      }
    },
    required: ["title", "description", "estimatedDuration", "chapters"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate the syllabus for ${topic}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const parsed = JSON.parse(response.text);

    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : null,
      description: typeof parsed.description === 'string' && parsed.description.trim() ? parsed.description.trim() : null,
      estimatedDuration: typeof parsed.estimatedDuration === 'number' && parsed.estimatedDuration >= 0 ? parsed.estimatedDuration : null,
      chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
    };
  } catch (error) {
    console.error(`Error generating course outline from LLM with Gemini:`, error);
    throw new Error("Failed to generate outline from LLM. Check console for details.");
  }
};


/**
 * Generates the detailed content for a specific lesson/chapter
 * @param {string} courseTopic - The overall course topic
 * @param {string} chapterTitle - The chapter this lesson belongs to
 * @param {string} chapterObjective - The objective of the chapter
 * @param {string} depth - The depth level (OVERVIEW, BASIC, DETAILED)
 * @param {string} language - The language to generate content in (default: ENGLISH)
 * @returns {Promise<{content: string, keyTakeaways: string[]}>}
 */
export const generateLessonContent = async (courseTopic, chapterTitle, chapterObjective, depth = 'BASIC', language = 'ENGLISH') => {
  checkAI();

  const depthInstruction = DEPTH_INSTRUCTIONS[depth] || DEPTH_INSTRUCTIONS.BASIC;

  const systemPrompt = `You are an expert technical writer and educator.
Topic: ${courseTopic}
Chapter: ${chapterTitle}
Objective: ${chapterObjective}
Depth level: ${depth}. ${depthInstruction}
Generate ALL content in ${language}.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "A detailed, comprehensive markdown-formatted explanation of the lesson material. Include code examples if applicable." },
      keyTakeaways: {
        type: Type.ARRAY,
        items: { type: Type.STRING, description: "A key point to remember" }
      }
    },
    required: ["content", "keyTakeaways"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate the lesson content and key takeaways based on the chapter details.",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const parsed = JSON.parse(response.text);

    // Validate lesson content before returning
    if (!parsed?.content || typeof parsed.content !== 'string' || !parsed.content.trim()) {
      throw new Error('LLM returned empty or invalid lesson content.');
    }

    return {
      content: parsed.content,
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
    };
  } catch (error) {
    console.error(`Error generating lesson content for ${chapterTitle} with Gemini:`, error);
    throw new Error("Failed to generate lesson content.");
  }
};

/**
 * Generates sentence-based quiz questions for a single chapter's content.
 * Questions are fill-in-the-blank style where the answer is a word or short phrase.
 *
 * @param {string} courseTopic - The course topic
 * @param {string} chapterContent - The lesson content for THIS chapter only
 * @param {string} depth - The depth level (determines question count: OVERVIEW=2, BASIC=3, DETAILED=5)
 * @param {string} language - The language (default: ENGLISH)
 * @returns {Promise<Array<{type: string, question: string, answer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (courseTopic, chapterContent, depth = 'BASIC', language = 'ENGLISH') => {
  checkAI();

  const questionCount = QUIZ_QUESTION_COUNT[depth] || 3;

  const systemPrompt = `You are an expert educator.
Based strictly on the provided lesson material about ${courseTopic}, generate exactly ${questionCount} fill-in-the-blank quiz questions.

Rules:
- Each question should be a sentence with a blank (use "___" to indicate the blank).
- The answer should be a single word or a short phrase (2-4 words maximum).
- Questions should test understanding, not just memorization.
- Generate ALL content in ${language}.

Example:
  question: "The process of converting source code into machine code is called ___."
  answer: "compilation"`;

  const responseSchema = {
    type: Type.ARRAY,
    description: `An array of ${questionCount} fill-in-the-blank questions`,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "Always return 'FILL_BLANK'" },
        question: { type: Type.STRING, description: "A sentence with ___ indicating the blank to fill" },
        answer: { type: Type.STRING, description: "The correct word or short phrase that fills the blank" },
        explanation: { type: Type.STRING, description: "A brief explanation of why this is the correct answer" },
        difficulty: { type: Type.STRING, description: "One of: 'Easy', 'Normal', 'Hard'" }
      },
      required: ["type", "question", "answer", "explanation", "difficulty"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here is the lesson content:\n\n${chapterContent}\n\nGenerate the quiz now.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error(`Error generating quiz with Gemini:`, error);
    throw new Error("Failed to generate quiz.");
  }
};

/**
 * Generates video reference suggestions (YouTube search queries) for a chapter.
 *
 * @param {string} courseTopic - The course topic
 * @param {string} chapterTitle - The chapter title
 * @param {string} chapterContent - The lesson content
 * @param {string} language - The language (default: ENGLISH)
 * @returns {Promise<Array<{title: string, platform: string, url: string, reason: string}>>}
 */
export const generateVideoReferences = async (courseTopic, chapterTitle, chapterContent, language = 'ENGLISH') => {
  checkAI();

  const systemPrompt = `You are an expert educator who recommends supplementary video resources.
Based on the lesson content for "${chapterTitle}" in a course about "${courseTopic}",
suggest 2-3 specific YouTube search queries that would help the student learn this topic visually.

For each suggestion, create a YouTube search URL in this format:
https://www.youtube.com/results?search_query=your+search+terms+here

Generate titles and reasons in ${language}.`;

  const responseSchema = {
    type: Type.ARRAY,
    description: "An array of 2-3 video reference suggestions",
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A descriptive title for the video suggestion" },
        platform: { type: Type.STRING, description: "Always return 'YouTube'" },
        url: { type: Type.STRING, description: "A YouTube search URL like https://www.youtube.com/results?search_query=..." },
        reason: { type: Type.STRING, description: "Why this video would help the student understand the topic" },
      },
      required: ["title", "platform", "url", "reason"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here is the chapter content:\n\n${chapterContent}\n\nSuggest relevant video resources.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error(`Error generating video references for ${chapterTitle} with Gemini:`, error);
    // Video references are non-critical — don't crash the whole step
    console.warn(`[LLM] Skipping video references for "${chapterTitle}" due to error.`);
    return [];
  }
};
