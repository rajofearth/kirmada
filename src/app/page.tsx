"use client";
import { useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, ToolUIPart } from "ai";
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
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/source";
import { Loader, PlusIcon } from "lucide-react";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { id } from "zod/v4/locales";
import Image from "next/image";

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                                <Image
                                  key={toolCallId}
                                  src={output.imageUrl}
                                  alt={input.prompt}
                                  height={400}
                                  width={400}
                                />
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
            </PromptInputTools>
            <PromptInputSubmit disabled={!input} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
