import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import type { ComponentProps, HTMLAttributes } from "react";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full items-end justify-end gap-2 py-4",
      from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
      // Allow wider bubbles on larger screens, near-full on mobile
      "[&>div]:max-w-[96%] sm:[&>div]:max-w-[92%] md:[&>div]:max-w-[90%] xl:[&>div]:max-w-[88%]",
      className,
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      // Align bubble with prompt box styling
      "flex flex-col gap-2 overflow-hidden rounded-xl border bg-background px-4 py-3 text-foreground text-sm shadow-sm",
      // Role variants: user solid, assistant transparent to blend with page
      "group-[.is-user]:border-primary/40 group-[.is-user]:bg-transparent group-[.is-user]:text-primary-foreground",
      "group-[.is-assistant]:bg-transparent group-[.is-assistant]:border-border/60",
      // Subtle radius tweaks to mirror input grouping feel
      "group-[.is-user]:rounded-br-sm group-[.is-assistant]:rounded-bl-sm",
      className,
    )}
    {...props}
  >
    <div className="is-user:dark">{children}</div>
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar
    className={cn("size-8 ring-1 ring-border", className)}
    {...props}
  >
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || "ME"}</AvatarFallback>
  </Avatar>
);
