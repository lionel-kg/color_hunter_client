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

export function GridCard({ grid, currentUserId, ownerActions, metaInfo }: Props) {
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
    if (g._count?.comments !== undefined) setCommentCount(g._count.comments);
    api.get<{ liked: boolean; count: number }>(`/likes/${grid.id}`)
      .then((r) => { setLiked(r.data.liked); setLikeCount(r.data.count); })
      .catch(() => {});
  }, [grid.id]);

  async function toggleLike() {
    try {
      const { data } = await api.post<{ liked: boolean; count: number }>(`/likes/${grid.id}`);
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
      } catch {}
    }
    setShowComments((v) => !v);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<GridComment>(`/comments/${grid.id}`, { text: commentText.trim() });
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
    <article className="grid-card">
      {grid.user && (
        <div className="grid-card__header">
          <div className="grid-card__avatar">
            {grid.user.avatarUrl ? (
              <img src={grid.user.avatarUrl} alt="" className="grid-card__avatar-img" />
            ) : (
              <span className="grid-card__avatar-initial">{grid.user.pseudo[0].toUpperCase()}</span>
            )}
          </div>
          <span className="grid-card__pseudo">{grid.user.pseudo}</span>
          {ownerActions && <div className="grid-card__owner-actions">{ownerActions}</div>}
        </div>
      )}

      <img src={resolveImageUrl(grid.imageUrl)} alt="Grille" className="grid-card__image" loading="lazy" />

      <div className="grid-card__actions">
        <button
          onClick={toggleLike}
          className={`grid-card__action-btn${liked ? ' grid-card__action-btn--liked' : ''}`}
        >
          <span style={{ fontSize: 18 }}>{liked ? "♥" : "♡"}</span>
          <span className="grid-card__action-count">{likeCount}</span>
        </button>
        <button
          onClick={loadComments}
          className="grid-card__action-btn"
          style={{ color: showComments ? "var(--ch-ink)" : "var(--ch-ink-mute)" }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          <span className="grid-card__action-count">{commentCount > 0 ? commentCount : ""}</span>
        </button>
        {metaInfo && <div className="grid-card__meta">{metaInfo}</div>}
      </div>

      {showComments && (
        <div className="grid-card__comments">
          {comments.length === 0 && (
            <p className="grid-card__comments-empty">Aucun commentaire pour l'instant.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="grid-card__comment">
              <span className="grid-card__comment-pseudo">{c.user.pseudo}</span>
              <span className="grid-card__comment-text">{c.text}</span>
              {currentUserId === c.userId && (
                <button onClick={() => deleteComment(c.id)} className="grid-card__comment-delete">×</button>
              )}
            </div>
          ))}

          <form onSubmit={submitComment} className="grid-card__comment-form">
            <input
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajouter un commentaire…"
              maxLength={500}
              className="grid-card__comment-input"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="grid-card__comment-send"
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
