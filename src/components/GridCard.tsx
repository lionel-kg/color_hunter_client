import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import { SERVER_URL } from "../lib/config";
import type { Grid, GridComment } from "../types/api";

function resolveImageUrl(url: string) {
  return url.startsWith("/") ? `${SERVER_URL}${url}` : url;
}

interface Props {
  grid: Grid;
  currentUserId?: string;
  ownerActions?: React.ReactNode;
  metaInfo?: React.ReactNode;
}

export function GridCard({
  grid,
  currentUserId,
  ownerActions,
  metaInfo,
}: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<GridComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const g = grid as Grid & { _count?: { comments?: number } };
    if (g._count?.comments !== undefined) {
      setCommentCount(g._count.comments);
    }
    api
      .get<{ liked: boolean; count: number }>(`/likes/${grid.id}`)
      .then((r) => {
        setLiked(r.data.liked);
        setLikeCount(r.data.count);
      })
      .catch(() => {});
  }, [grid.id]);

  async function toggleLike() {
    try {
      const { data } = await api.post<{ liked: boolean; count: number }>(
        `/likes/${grid.id}`,
      );
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch {}
  }

  async function loadComments() {
    if (!showComments) {
      try {
        const { data } = await api.get<GridComment[]>(`/comments/${grid.id}`);
        setComments(data);
        setCommentCount(data.length);
        console.log(commentCount);
      } catch {}
    }
    setShowComments((v) => !v);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<GridComment>(`/comments/${grid.id}`, {
        text: commentText.trim(),
      });
      setComments((prev) => [...prev, data]);
      setCommentCount((prev) => prev + 1);
      setCommentText("");
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(commentId: string) {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => prev - 1);
    } catch {}
  }

  return (
    <article style={styles.card}>
      {/* Header auteur */}
      {grid.user && (
        <div style={styles.header}>
          <div style={styles.avatar}>
            {grid.user.avatarUrl ? (
              <img src={grid.user.avatarUrl} alt="" style={styles.avatarImg} />
            ) : (
              <span style={styles.avatarInitial}>
                {grid.user.pseudo[0].toUpperCase()}
              </span>
            )}
          </div>
          <span style={styles.pseudo}>{grid.user.pseudo}</span>
          {ownerActions && (
            <div style={{ marginLeft: "auto" }}>{ownerActions}</div>
          )}
        </div>
      )}

      {/* Image grille */}
      <img
        src={resolveImageUrl(grid.imageUrl)}
        alt="Grille"
        style={styles.image}
        loading="lazy"
      />

      {/* Actions */}
      <div style={styles.actions}>
        <button
          onClick={toggleLike}
          style={{
            ...styles.actionBtn,
            color: liked ? "#C97B7B" : "var(--ch-ink-mute)",
          }}
        >
          <span style={{ fontSize: 18 }}>{liked ? "♥" : "♡"}</span>
          <span style={styles.count}>{likeCount}</span>
        </button>
        <button
          onClick={loadComments}
          style={{
            ...styles.actionBtn,
            color: showComments ? "var(--ch-ink)" : "var(--ch-ink-mute)",
          }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          <span style={styles.count}>
            {commentCount > 0 ? commentCount : ""}
          </span>
        </button>
        {metaInfo && (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
            }}
          >
            {metaInfo}
          </div>
        )}
      </div>

      {/* Commentaires */}
      {showComments && (
        <div style={styles.commentsSection}>
          {comments.length === 0 && (
            <p style={styles.emptyComments}>
              Aucun commentaire pour l'instant.
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} style={styles.comment}>
              <span style={styles.commentPseudo}>{c.user.pseudo}</span>
              <span style={styles.commentText}>{c.text}</span>
              {currentUserId === c.userId && (
                <button
                  onClick={() => deleteComment(c.id)}
                  style={styles.deleteBtn}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <form onSubmit={submitComment} style={styles.commentForm}>
            <input
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajouter un commentaire…"
              maxLength={500}
              style={styles.commentInput}
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              style={styles.sendBtn}
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "var(--ch-paper)",
    borderRadius: "var(--ch-r-lg)",
    border: "1px solid var(--ch-line)",
    overflow: "hidden",
    boxShadow: "var(--ch-shadow-sm)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    background: "var(--ch-cream-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitial: {
    fontFamily: "var(--ch-serif)",
    fontSize: 14,
    color: "var(--ch-ink-soft)",
  },
  pseudo: {
    fontFamily: "var(--ch-sans)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ch-ink)",
  },
  image: {
    width: "100%",
    aspectRatio: "1",
    objectFit: "cover",
    display: "block",
  },
  actions: {
    display: "flex",
    gap: 4,
    padding: "10px 12px",
    borderTop: "1px solid var(--ch-line)",
  },
  actionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 8px",
    borderRadius: "var(--ch-r-sm)",
    fontFamily: "var(--ch-sans)",
    fontSize: 13,
    transition: "background 0.15s",
  },
  count: { fontSize: 13 },
  commentsSection: {
    padding: "0 16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  emptyComments: {
    fontFamily: "var(--ch-sans)",
    fontSize: 12,
    color: "var(--ch-ink-mute)",
    textAlign: "center",
    margin: "8px 0",
  },
  comment: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    fontFamily: "var(--ch-sans)",
    fontSize: 13,
  },
  commentPseudo: { fontWeight: 600, color: "var(--ch-ink)", flexShrink: 0 },
  commentText: { color: "var(--ch-ink-soft)", flex: 1 },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--ch-ink-mute)",
    fontSize: 16,
    lineHeight: 1,
    padding: "0 2px",
    flexShrink: 0,
  },
  commentForm: {
    display: "flex",
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    fontFamily: "var(--ch-sans)",
    fontSize: 13,
    padding: "8px 12px",
    borderRadius: "var(--ch-r-pill)",
    border: "1px solid var(--ch-line-2)",
    background: "var(--ch-cream)",
    color: "var(--ch-ink)",
    outline: "none",
  },
  sendBtn: {
    background: "var(--ch-ink)",
    color: "var(--ch-ivory)",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    cursor: "pointer",
    fontSize: 16,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
