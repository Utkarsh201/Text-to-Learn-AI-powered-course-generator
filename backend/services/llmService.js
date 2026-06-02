import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hf = new InferenceClient(process.env.HF_ACCESS_TOKEN);
const DEFAULT_TEXT_MODELS = [
  "mistralai/Mistral-7B-Instruct-v0.3",
  "mistral-community/Mistral-7B-Instruct-v0.3",
];
const configuredTextModels = (process.env.HF_TEXT_MODEL || "")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const HF_TEXT_MODELS = [...new Set([...configuredTextModels, ...DEFAULT_TEXT_MODELS])];

const isModelUnavailableError = (error) => {
  const status = error?.status || error?.response?.status;
  const message = String(error?.message || "");
  return status === 404 || status === 410 || /\b(404|410)\b/.test(message);
};

const createChatCompletion = async (messages, options = {}) => {
  let lastModelError;

  for (const model of HF_TEXT_MODELS) {
    try {
      return await hf.chatCompletion({
        model,
        messages,
        ...options,
      });
    } catch (error) {
      if (!isModelUnavailableError(error)) {
        throw error;
      }

      lastModelError = error;
      console.warn(`Hugging Face text model unavailable: ${model}`, error.message);
    }
  }

  throw lastModelError;
};

/**
 * Generates an outline for a course and returns structured JSON
 * @param {string} topic - The topic of the course
 * @param {string} depth - The depth (e.g., OVERVIEW, BASIC, DETAILED)
 * @returns {Promise<Array<{title: string, order: number, objective: string}>>}
 */
export const generateCourseOutline = async (topic, depth) => {
  const systemPrompt = `You are an expert curriculum designer. 
Your MUST generate a course syllabus for a ${depth} level course on "${topic}".
You MUST respond with ONLY valid JSON and nothing else. No markdown wrappers, no intro text.
The desired output format is a JSON array of objects representing chapters:
[
  {
    "title": "Chapter Heading",
    "order": 1,
    "objective": "A short 1-sentence description of the chapter."
  }
]`;

  try {
    // using chatCompletion for better instruction following
    const response = await createChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the syllabus for ${topic}. Return ONLY the JSON array.` }
      ],
      {
        max_tokens: 1500,
        temperature: 0.2, // Keep temperature low so it is predictable JSON
      }
    );

    let jsonText = response.choices[0].message.content.trim();


    // donot know about this one.
    // Safety check: sometimes LLMs still wrap JSON in markdown block even when told not to.
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/```$/, "").trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/```$/, "").trim();
    }

    // Try to parse the result. If this fails, it goes to the catch block
    const outline = JSON.parse(jsonText);
    return outline;

  } catch (error) {
    console.error(`Error generating course outline from LLM with ${HF_TEXT_MODELS.join(", ")}:`, error);
    throw new Error("Failed to generate outline from LLM. Check console for details.");
  }
};


// this thing is very similar to type script interface. Here we are defining the arguments passed and the return type of the function.
/**
 * Generates the detailed content for a specific lesson/chapter
 * @param {string} courseTopic - The overall course topic
 * @param {string} chapterTitle - The chapter this lesson belongs to
 * @param {string} chapterObjective - The objective of the chapter
 * @returns {Promise<{content: string, keyTakeaways: string[]}>}
 */
export const generateLessonContent = async (courseTopic, chapterTitle, chapterObjective) => {
  const systemPrompt = `You are an expert technical writer and educator.
Topic: ${courseTopic}
Chapter: ${chapterTitle}
Objective: ${chapterObjective}

You MUST output ONLY valid JSON.
The JSON must have this exact structure:
{
  "content": "A detailed, comprehensive markdown-formatted explanation of the lesson material. Include code examples if applicable.",
  "keyTakeaways": ["point 1", "point 2", "point 3"]
}`;

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the lesson content and key takeaways based on the chapter details. Return ONLY JSON." }
      ],
      {
        max_tokens: 3000,
        temperature: 0.3,
      }
    );

    let jsonText = response.choices[0].message.content.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.replace(/```json\n?/, "").replace(/```$/, "").trim();
    else if (jsonText.startsWith("```")) jsonText = jsonText.replace(/```\n?/, "").replace(/```$/, "").trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Error generating lesson content for ${chapterTitle} with ${HF_TEXT_MODELS.join(", ")}:`, error);
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
  const systemPrompt = `You are an expert educator.
Based strictly on the provided lesson material about ${courseTopic}, generate a 3-question multiple-choice quiz.
You MUST output ONLY valid JSON.
The JSON must be an array of objects matching this exact structure:
[
  {
    "type": "MCQ",
    "question": "What is...?",
    "options": ["A", "B", "C", "D"],
    "answer": "A",
    "explanation": "A is correct because...",
    "difficulty": "Intermediate"
  }
]`;

  try {
    const response = await createChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the lesson content:\n\n${lessonContent}\n\nGenerate the quiz JSON now.` }
      ],
      {
        max_tokens: 1500,
        temperature: 0.2, // Low temperature to stick closely to facts in the content
      }
    );

    let jsonText = response.choices[0].message.content.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.replace(/```json\n?/, "").replace(/```$/, "").trim();
    else if (jsonText.startsWith("```")) jsonText = jsonText.replace(/```\n?/, "").replace(/```$/, "").trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Error generating quiz with ${HF_TEXT_MODELS.join(", ")}:`, error);
    throw new Error("Failed to generate quiz.");
  }
};
