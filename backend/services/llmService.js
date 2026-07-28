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

/**
 * Generates an outline for a course and returns structured JSON
 * @param {string} topic - The topic of the course
 * @param {string} depth - The depth (e.g., OVERVIEW, BASIC, DETAILED)
 * @returns {Promise<{title: string | null, description: string | null, estimatedDuration: number | null, chapters: Array<{title: string, order: number, objective: string}>}>}
 */
export const generateCourseOutline = async (topic, depth) => {
  checkAI();

  const systemPrompt = `You are an expert curriculum designer. 
You MUST generate a course syllabus for a ${depth} level course on "${topic}".
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
            order: { type: Type.INTEGER, description: "The numerical order of the chapter (1, 2, 3...)" },
            objective: { type: Type.STRING, description: "A short 1-sentence description of the chapter." }
          },
          required: ["title", "order", "objective"]
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
        temperature: 0.2, // Keep temperature low so it is predictable
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const parsed = JSON.parse(response.text);

    return {
      title: parsed.title || null,
      description: parsed.description || null,
      estimatedDuration: parsed.estimatedDuration || null,
      chapters: parsed.chapters || [],
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
 * @returns {Promise<{content: string, keyTakeaways: string[]}>}
 */
export const generateLessonContent = async (courseTopic, chapterTitle, chapterObjective) => {
  checkAI();

  const systemPrompt = `You are an expert technical writer and educator.
Topic: ${courseTopic}
Chapter: ${chapterTitle}
Objective: ${chapterObjective}`;

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

    return JSON.parse(response.text);
  } catch (error) {
    console.error(`Error generating lesson content for ${chapterTitle} with Gemini:`, error);
    throw new Error("Failed to generate lesson content.");
  }
};

/**
 * Generates a multiple-choice quiz based on the provided content
 * @param {string} courseTopic - The course topic
 * @param {string} lessonContent - The actual text content to base the quiz on
 * @returns {Promise<Array<{type: string, question: string, options: string[], answer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (courseTopic, lessonContent) => {
  checkAI();

  const systemPrompt = `You are an expert educator.
Based strictly on the provided lesson material about ${courseTopic}, generate a 3-question multiple-choice quiz.`;

  const responseSchema = {
    type: Type.ARRAY,
    description: "An array of 3 multiple choice questions",
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "Always return 'MCQ'" },
        question: { type: Type.STRING, description: "The quiz question" },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 multiple choice options" },
        answer: { type: Type.STRING, description: "The exact string from the options array that is the correct answer" },
        explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct" },
        difficulty: { type: Type.STRING, description: "E.g., 'Normal', 'Intermediate', 'Hard'" }
      },
      required: ["type", "question", "options", "answer", "explanation", "difficulty"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here is the lesson content:\n\n${lessonContent}\n\nGenerate the quiz now.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Low temperature to stick closely to facts in the content
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
