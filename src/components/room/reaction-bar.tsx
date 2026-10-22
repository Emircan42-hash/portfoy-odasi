"use client";

import { useState } from "react";
import { MessageSquarePlus, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Reaction = { id: string; kind: "LIKE" | "DISLIKE" | "NOTE"; text: string | null; photoId: string | null };

type Props = {
  token: string;
  propertyId: string;
  photoId?: string;
  initial: Reaction[];
  compact?: boolean;
};

/** Beğen / ele / not. photoId verilirse o fotoğrafa, verilmezse dairenin tamamına. */
export function ReactionBar({ token, propertyId, photoId, initial, compact }: Props) {
  const scoped = initial.filter((r) => (photoId ? r.photoId === photoId : r.photoId === null));
  const [vote, setVote] = useState<"LIKE" | "DISLIKE" | null>(
    scoped.findLast((r) => r.kind !== "NOTE")?.kind as "LIKE" | "DISLIKE" | undefined ?? null,
  );
  const [notes, setNotes] = useState(scoped.filter((r) => r.kind === "NOTE" && r.text).map((r) => r.text!));
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  async function post(kind: "LIKE" | "DISLIKE" | "NOTE", text?: string) {
    await fetch(`/api/r/${token}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, photoId, kind, text }),
    });
  }

  function toggle(kind: "LIKE" | "DISLIKE") {
    setVote(kind);
    void post(kind);
  }

  function submitNote() {
    const text = draft.trim();
    if (!text) return;
    setNotes((n) => [...n, text]);
    setDraft("");
    setOpen(false);
    void post("NOTE", text);
  }

  const size = compact ? "icon" : "sm";

  return (
    <div className={cn("flex flex-col gap-2", compact && "items-end")}>
      <div className="flex items-center gap-1">
        <Button type="button" size={size} variant={vote === "LIKE" ? "default" : "outline"} onClick={() => toggle("LIKE")} aria-label="Beğendim">
          <ThumbsUp /> {!compact && "Beğendim"}
        </Button>
        <Button type="button" size={size} variant={vote === "DISLIKE" ? "destructive" : "outline"} onClick={() => toggle("DISLIKE")} aria-label="Olmaz">
          <ThumbsDown /> {!compact && "Olmaz"}
        </Button>
        <Button type="button" size={size} variant="ghost" onClick={() => setOpen((o) => !o)} aria-label="Not ekle">
          <MessageSquarePlus /> {!compact && "Not"}
        </Button>
      </div>
      {open && (
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitNote();
          }}
        >
          <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Örn: mutfak dar ama manzara süper" />
          <Button type="submit" size="sm">
            Gönder
          </Button>
        </form>
      )}
      {notes.length > 0 && !compact && (
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {notes.map((n, i) => (
            <li key={i}>&quot;{n}&quot;</li>
          ))}
        </ul>
      )}
    </div>
  );
}
