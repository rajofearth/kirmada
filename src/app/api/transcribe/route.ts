import { experimental_transcribe as transcribe } from "ai";
import { groq } from "@ai-sdk/groq";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const arrayBuffer = await file.arrayBuffer();

  const result = await transcribe({
    model: groq.transcription("whisper-large-v3"),
    audio: Buffer.from(arrayBuffer),
    providerOptions: { groq: { language: "en" } },
  });

  return Response.json({ text: result.text });
};
