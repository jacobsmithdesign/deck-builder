"use client";

import * as React from "react";
import { useCardList } from "@/app/context/CardListContext";
import { useUser } from "@/app/context/userContext";
import { useResolvedCardReferences } from "@/app/hooks/useResolvedCardReferences";
import { CardReferenceText } from "@/app/components/card-ref/CardReferenceText";

export type DeckComment = {
  id: string;
  deck_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: { username: string | null } | null;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DeckCommentsSection() {
  const { deck, setDeck, userOwnsDeck } = useCardList();
  const { profile } = useUser();
  const [comments, setComments] = React.useState<DeckComment[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [commentFormBody, setCommentFormBody] = React.useState("");
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const { resolved, loading: refsLoading, resolve } = useResolvedCardReferences();

  const fetchComments = React.useCallback(async () => {
    if (!deck?.id) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/decks/${deck.id}/comments`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.comments)) {
        setComments(data.comments);
        resolve(data.comments.map((c: DeckComment) => c.body));
      }
    } finally {
      setCommentsLoading(false);
    }
  }, [deck?.id, resolve]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = React.useCallback(async () => {
    if (!deck?.id || !commentFormBody.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    const body = commentFormBody.trim();
    setCommentFormBody("");
    try {
      const res = await fetch(`/api/decks/${deck.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [
          ...prev,
          {
            ...data.comment,
            author: profile ? { username: profile.username ?? null } : null,
          },
        ]);
        setDeck({
          ...deck,
          commentCount: (deck.commentCount ?? 0) + 1,
        });
      }
    } finally {
      setCommentSubmitting(false);
    }
  }, [deck, commentFormBody, commentSubmitting, profile, setDeck]);

  const deleteComment = React.useCallback(
    async (commentId: string) => {
      if (!deck?.id || deletingId) return;
      setDeletingId(commentId);
      try {
        const res = await fetch(
          `/api/decks/${deck.id}/comments/${commentId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setDeck({
            ...deck,
            commentCount: Math.max(0, (deck.commentCount ?? 1) - 1),
          });
        }
      } finally {
        setDeletingId(null);
      }
    },
    [deck, deletingId, setDeck]
  );

  const canDeleteComment = React.useCallback(
    (c: DeckComment) => {
      if (!profile?.id) return false;
      return userOwnsDeck || c.user_id === profile.id;
    },
    [profile?.id, userOwnsDeck]
  );

  if (!deck?.id) return null;

  return (
    <div id="deck-comments" className="scroll-mt-24 mb-6">
      <h3 className="text-sm font-semibold text-dark/80 mb-2">Comments</h3>
      {profile && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitComment();
          }}
          className="mb-4"
        >
          <textarea
            value={commentFormBody}
            onChange={(e) =>
              setCommentFormBody(e.target.value.slice(0, 2000))
            }
            placeholder="Add a comment..."
            rows={2}
            className="w-full rounded-lg border border-dark/20 bg-light/10 px-3 py-2 text-sm text-dark/90 placeholder:text-dark/50 focus:outline-none focus:ring-2 focus:ring-dark/20"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!commentFormBody.trim() || commentSubmitting}
            className="mt-2 rounded-full bg-dark/20 px-3 py-1.5 text-sm font-medium text-dark/80 hover:bg-dark/30 disabled:opacity-50"
          >
            {commentSubmitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      )}
      {commentsLoading ? (
        <p className="text-sm text-dark/60">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-dark/60">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg bg-light/15 px-3 py-2 text-sm flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium text-dark/80">
                  {c.author?.username ?? "Anonymous"}
                </span>
                <span className="text-dark/50 text-xs">
                  {formatDate(c.created_at)}
                </span>
                {canDeleteComment(c) && (
                  <button
                    type="button"
                    onClick={() => deleteComment(c.id)}
                    disabled={deletingId === c.id}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 focus:outline-none"
                  >
                    {deletingId === c.id ? "Deleting…" : "Delete"}
                  </button>
                )}
              </div>
              <p className="text-dark/90 whitespace-pre-wrap">
                <CardReferenceText text={c.body} resolvedCards={resolved} />
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
