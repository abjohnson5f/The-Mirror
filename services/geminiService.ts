import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ConsultantType, UserProfile, ClothingItem, StyleCategory } from "../types";
import { WARDROBE_IMAGE_MAP } from "../constants";

// Helper to get client with fresh key
const getAiClient = () => {
  // We assume process.env.API_KEY is populated by the window.aistudio selection
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Analyzes the uploaded user image to determine gender, style, and fit notes.
 * Uses Gemini 2.5 Flash for multimodal reasoning.
 */
export const analyzeUserProfile = async (imageBase64: string, mimeType: string): Promise<UserProfile> => {
  const ai = getAiClient();

  const prompt = `Analyze the person in this image for a personal styling application.
  Determine their likely gender expression (male, female, or neutral) to filter clothing options correctly.
  Provide a brief 1-sentence description of their current style vibe.
  Provide a brief 1-sentence note on their apparent body type for fit advice.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          gender: { type: Type.STRING, enum: ['male', 'female', 'neutral'] },
          styleProfile: { type: Type.STRING },
          fitNotes: { type: Type.STRING }
        },
        required: ['gender', 'styleProfile', 'fitNotes']
      }
    }
  });

  const text = response.text;
  if (!text) return { gender: 'neutral', styleProfile: 'Unknown', fitNotes: 'Standard fit' };
  
  try {
    return JSON.parse(text) as UserProfile;
  } catch (e) {
    console.error("Failed to parse profile JSON", e);
    return { gender: 'neutral', styleProfile: 'Unknown', fitNotes: 'Standard fit' };
  }
};

/**
 * Uses Gemini + Google Search to analyze a product URL and return a visual description + image URL
 */
export const describeItemFromUrl = async (url: string): Promise<{ name: string, description: string, imageUrl: string | null }> => {
  const ai = getAiClient();
  
  const prompt = `I have a link to a clothing item: ${url}
  
  Please use Google Search to find this product. 
  1. Identify the Brand and Product Name.
  2. Write a detailed visual description of the item (color, fabric texture, fit, neckline, key details).
  3. Find the URL of the main product image (high resolution if possible).
  
  Format your response exactly like this:
  Name: [Brand & Product Name]
  Description: [Visual Description]
  ImageURL: [URL of the image]`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text || '';
  
  const nameMatch = text.match(/Name:\s*(.+)/i);
  const descMatch = text.match(/Description:\s*(.+)/i);
  const imgMatch = text.match(/ImageURL:\s*(.+)/i);

  return {
    name: nameMatch ? nameMatch[1].trim() : 'Custom Item',
    description: descMatch ? descMatch[1].trim() : 'A stylish clothing item found online.',
    imageUrl: imgMatch ? imgMatch[1].trim() : null
  };
};

/**
 * Fetches "What's Hot Right Now" - Dynamic wardrobe generation based on profile
 */
export const fetchTrendingWardrobe = async (userProfile: UserProfile): Promise<ClothingItem[]> => {
  const ai = getAiClient();
  
  const genderTerm = userProfile.gender === 'male' ? 'Menswear' : userProfile.gender === 'female' ? 'Womenswear' : 'Unisex fashion';
  const availableKeys = Object.keys(WARDROBE_IMAGE_MAP).join("', '");
  
  const prompt = `Act as a high-end fashion buyer and trend forecaster for ${genderTerm}. 
  Generate a curated list of 9 "Hot Right Now" clothing items for a user with a "${userProfile.styleProfile}" vibe.
  
  TARGET AUDIENCE: Gen X and Elder Millennials who want to look stylish and expensive, not like Gen Z.
  BRANDS: Use currently trending, high-quality brands (e.g., Aimé Leon Dore, Todd Snyder, Kith, Fear of God Essentials, Drake's, The Row, Khaite, Toteme, Reformation, Anine Bing, Buck Mason).
  
  IMPORTANT - VISUAL MATCHING:
  You must select an 'imageKey' for each item from the provided list that BEST visually matches the item you described.
  
  AVAILABLE IMAGE KEYS: ['${availableKeys}']
  
  REQUIREMENTS:
  - Generate 3 items for 'Professional & Work'
  - Generate 3 items for 'Date Night & Going Out'
  - Generate 3 items for 'Casual & Everyday'
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: [StyleCategory.WORK, StyleCategory.DATE, StyleCategory.CASUAL] },
            imageKey: { type: Type.STRING }
          },
          required: ['brand', 'name', 'description', 'price', 'category', 'imageKey']
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];

  try {
    const rawItems = JSON.parse(text);
    return rawItems.map((item: any, index: number) => ({
      id: `dynamic-${index}`,
      brand: item.brand,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      gender: userProfile.gender, 
      imageUrl: WARDROBE_IMAGE_MAP[item.imageKey] || WARDROBE_IMAGE_MAP['default'],
      purchaseUrl: `https://www.google.com/search?q=${encodeURIComponent(item.brand + ' ' + item.name + ' buy online')}`
    }));
  } catch (e) {
    console.error("Failed to parse wardrobe", e);
    return [];
  }
};

/**
 * Generates a natural movement video using Veo 3.1
 */
export const generateAvatarVideo = async (imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  
  const prompt = `A cinematic wide shot. Full body visible from head to toe. 
  The person in the uploaded image stands in a luxurious, private walk-in closet with dark wood cabinetry, warm ambient lighting, and shelves of clothes in the background.
  The person turns slowly 360 degrees to show their outfit.
  Maintain facial identity and features exactly.
  Camera Distance: Far enough to show feet and head clearly with space around them.
  Atmosphere: High-end, expensive, warm, sophisticated.`;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: imageBase64,
      mimeType: mimeType, 
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  if (operation.error) {
    throw new Error(operation.error.message || "Unknown generation error");
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed: No video returned.");

  const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  if (!response.ok) throw new Error("Failed to download generated video.");
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Generates a "Try-On" image. 
 * If a reference product image is provided, it performs an Image-to-Image transfer (Virtual Try-On).
 * Otherwise, it uses Text-to-Image editing.
 */
export const generateTryOnImage = async (
  baseImageBase64: string, 
  mimeType: string,
  clothingDescription: string,
  productImage?: { data: string, mimeType: string }
): Promise<string> => {
  const ai = getAiClient();
  
  const parts: any[] = [];
  let prompt = "";

  if (productImage) {
    // Strategy: Visual Reference Try-On
    prompt = `Photorealistic virtual try-on. 
    Task: Dress the person shown in the FIRST image with the clothing item shown in the SECOND image.
    
    Instructions:
    1. Keep the person's identity, pose, and body shape exactly as they appear in the first image.
    2. Replace their current outfit with the item from the second image.
    3. Ensure the item fits naturally, respecting the person's physique and the fabric's drape.
    4. Background: Luxury walk-in closet with dark wood.
    5. Output: Full body, high fidelity, 8k resolution.`;

    parts.push({ text: prompt });
    parts.push({ inlineData: { mimeType: mimeType, data: baseImageBase64 } }); // First Image (User)
    parts.push({ inlineData: { mimeType: productImage.mimeType, data: productImage.data } }); // Second Image (Product)

  } else {
    // Strategy: Text-Based Try-On
    prompt = `Full body wide shot. The person from the reference image wearing: ${clothingDescription}.
    The person is standing in a luxury walk-in closet with dark wood shelving and warm lighting.
    Ensure the entire head and feet are visible. Do not crop.
    Photorealistic, 8k resolution.
    Preserve facial features exactly.`;

    parts.push({ text: prompt });
    parts.push({ inlineData: { mimeType: mimeType, data: baseImageBase64 } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: '3:4',
        imageSize: '1K'
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
};

/**
 * Chat with the consultant
 */
export const getConsultantResponse = async (
  history: { role: string, text: string }[],
  newMessage: string,
  type: ConsultantType,
  userProfile: UserProfile | null
): Promise<string> => {
  const ai = getAiClient();
  
  let userContext = "Gen X / Elder Millennial client.";
  if (userProfile) {
    userContext += ` Gender: ${userProfile.gender}. Style Vibe: ${userProfile.styleProfile}. Fit Notes: ${userProfile.fitNotes}.`;
  }

  const systemInstruction = type === ConsultantType.STYLE
    ? `You are a high-end Style Consultant for a Gen X / Elder Millennial client. 
       Your tone is sophisticated, honest, and encouraging. You avoid Gen Z slang. 
       Focus on "Timeless", "Chic", "Elevated", "Polished", "Rugged", "Refined".
       
       CLIENT CONTEXT: ${userContext}
       
       If the client is male, focus on fit, quality of materials (leather, denim, wool), and classic silhouettes.`
    : `You are a technical Fit Consultant. Focus on tailoring, fabric drape, silhouettes, and sizing.
       Explain *why* something fits well or poorly based on the visual description.
       
       CLIENT CONTEXT: ${userContext}`;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const response: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
  return response.text || "I'm contemplating the look. One moment.";
};