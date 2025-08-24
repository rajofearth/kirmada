"use client";
import { useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/source";
import { DownloadIcon, Loader, MicIcon, PlusIcon } from "lucide-react";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleMicClick = async () => {
    if (!recording) {
      // Start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const { text } = await res.json();
        setInput((prev) => prev + " " + text);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } else {
      // Stop recording
      mediaRecorderRef.current?.stop();

      // 🔴 Important: stop mic tracks so the mic turns off
      mediaRecorderRef.current?.stream
        .getTracks()
        .forEach((track) => track.stop());

      setRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input, files: files });
      setInput("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen dark">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          );
                        case "reasoning":
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={
                                message.parts[-1]?.type === "reasoning" &&
                                status === "streaming"
                              }
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        case "tool-generateImage":
                          const { state, toolCallId } = part;
                          if (state === "input-available") {
                            return (
                              <div key={`${message.id}-part-${toolCallId}`}>
                                Generating Image...
                              </div>
                            );
                          }
                          if (state === "output-available") {
                            const { input, output } = part as {
                              input: { prompt: string };
                              output: { imageUrl?: string; prompt: string };
                            };
                            if (output.imageUrl) {
                              return (
                                <Card
                                  className="border-none p-0 group"
                                  key={toolCallId}
                                >
                                  <div className="relative w-full">
                                    <Image
                                      key={toolCallId}
                                      src={output.imageUrl}
                                      alt={input.prompt}
                                      height={400}
                                      width={400}
                                      className="object-cover rounded-lg mx-auto"
                                    />

                                    <CardFooter
                                      className="absolute bottom-0 left-0 right-0
                                                 flex justify-between items-start gap-2
                                                 bg-black/60 backdrop-blur-sm
                                                 px-2 py-1.5 rounded-b-lg
                                                 transition-all duration-500 ease-in-out
                                                 overflow-hidden group-hover:overflow-visible"
                                    >
                                      <p
                                        className="text-[12px] leading-snug text-white
                                                   max-h-[2.8em] overflow-hidden
                                                   transition-[max-height] duration-500 ease-in-out
                                                   hover:max-h-[200px]"
                                      >
                                        {input.prompt}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          if (!output.imageUrl) return;
                                          fetch(output.imageUrl)
                                            .then((r) => r.blob())
                                            .then((b) => {
                                              const a = Object.assign(
                                                document.createElement("a"),
                                                {
                                                  href: URL.createObjectURL(b),
                                                  download:
                                                    input.prompt.replace(
                                                      /[^a-z0-9_\-]/gi,
                                                      "_",
                                                    ) + ".png",
                                                },
                                              );
                                              a.click();
                                              URL.revokeObjectURL(a.href);
                                            });
                                        }}
                                      >
                                        <DownloadIcon className="h-4 w-4" />
                                      </Button>
                                    </CardFooter>
                                  </div>
                                </Card>
                              );
                            }
                            return null;
                          }
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
                {message.role === "assistant" &&
                  message.parts.some((m) => m.type === "source-url") && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === "source-url",
                          ).length
                        }
                      />
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "source-url":
                            return (
                              <SourcesContent key={`${message.id}-${i}`}>
                                <Source
                                  key={`${message.id}-${i}`}
                                  href={part.url}
                                  title={part.url}
                                />
                              </SourcesContent>
                            );
                        }
                      })}
                    </Sources>
                  )}
              </div>
            ))}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach Files"
              >
                <PlusIcon />
              </PromptInputButton>
              <input
                type="file"
                onChange={(event) => {
                  if (event.target.files) {
                    setFiles(event.target.files);
                  }
                }}
                multiple
                accept="application/pdf,image/*"
                ref={fileInputRef}
                className="hidden"
              />
              <PromptInputButton
                onClick={handleMicClick}
                aria-label="Capture Audio"
                className={recording ? "bg-red-500" : ""}
              >
                <MicIcon />
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input.trim()}
              status={status === "streaming" ? "streaming" : "ready"}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
