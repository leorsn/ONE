import { Platform } from 'react-native';
import { recognizeText } from 'expo-ocr-kit';

export type OneOcrResult = {
  text: string;
  blocks: Array<{
    text: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
};

export async function extractTextFromImage(uri: string): Promise<OneOcrResult> {
  if (Platform.OS === 'web') {
    return { text: '', blocks: [] };
  }

  const result = await recognizeText(uri);
  return {
    text: normalizeOcrText(result.text),
    blocks: result.blocks ?? []
  };
}

function normalizeOcrText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
