import * as FileSystem from 'expo-file-system';

const STT_KEY = process.env.EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY;

const buildSpeechConfig = () => ({
  encoding: 'AMR_WB',
  sampleRateHertz: 16000,
  languageCode: 'fil-PH',
  alternativeLanguageCodes: ['en-PH'],
  model: 'default',
  enableAutomaticPunctuation: true,
});

export const transcribeAudio = async (audioUri: string): Promise<string | null> => {
  if (!STT_KEY) throw new Error('EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY is not configured');

  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${STT_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: buildSpeechConfig(),
        audio: { content: base64Audio },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`STT API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    results?: { alternatives?: { transcript?: string }[] }[];
  };

  return data.results?.[0]?.alternatives?.[0]?.transcript ?? null;
};
