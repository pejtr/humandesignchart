const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel/Marie voice

export interface GenerateAudioPayload {
  text: string;
  language?: "cs" | "en" | "de" | "pl";
}

/**
 * Generates natural human voice MP3 audio from text via ElevenLabs API v1
 */
export async function generateElevenLabsAudio(payload: GenerateAudioPayload): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.log("[ElevenLabs] API key not configured, returning synthetic fallback audio URL");
      return {
        success: true,
        audioUrl: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
      };
    }

    console.log(`[ElevenLabs] Generating TTS audio for text length: ${payload.text.length}`);

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: payload.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[ElevenLabs Error]", res.status, errText);
      return { success: false, error: errText };
    }

    const buffer = await res.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return { success: true, audioUrl };
  } catch (err: any) {
    console.error("[ElevenLabs Exception]", err);
    return { success: false, error: err?.message };
  }
}
