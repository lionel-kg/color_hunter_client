import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { SERVER_URL } from "../lib/config";
import type { Grid, GridComment, RepliesPage } from "../types/api";

function resolveImageUrl(url: string) {
  return url.startsWith("/") ? `${SERVER_URL}${url}` : url;
}

const REPLIES_PAGE_SIZE = 5;

interface Props {
  grid: Grid;
  currentUserId?: string;
  ownerActions?: React.ReactNode;
  metaInfo?: React.ReactNode;
  highlightCommentId?: string | null;
  highlightNonce?: string | null;
}

export function GridCard({ grid, currentUserId, ownerActions, metaInfo, highlightCommentId, highlightNonce }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<GridComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ commentId: string; pseudo: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const g = grid as Grid & { _count?: { comments?: number } };
    if (g._count?.comments !== undefined) setCommentCount(g._count.comments);
    api.get<{ liked: boolean; count: number }>(`/likes/${grid.id}`)
      .then((r) => { setLiked(r.data.liked); setLikeCount(r.data.count); })
      .catch(() => {});
  }, [grid.id]);

  // Auto-ouvre les commentaires + scroll vers la carte si on cible un commentaire de cette grille
  // highlightNonce permet de re-rejouer si l'utilisateur re-clique la même notif
  useEffect(() => {
    if (!highlightCommentId) return;
    (async () => {
      try {
        const { data } = await api.get<GridComment[]>(`/comments/${grid.id}`);
        setComments(data);
        const totalReplies = data.reduce((s, c) => s + (c.repliesCount ?? 0), 0);
        setCommentCount(data.length + totalReplies);
        setShowComments(true);
        requestAnimationFrame(() => {
          articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } catch {}
    })();
  }, [highlightCommentId, highlightNonce, grid.id]);

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
        const totalReplies = data.reduce((s, c) => s + (c.repliesCount ?? 0), 0);
        setCommentCount(data.length + totalReplies);
      } catch {}
    }
    setShowComments((v) => !v);
  }

  function focusReply(commentId: string, pseudo: string) {
    setReplyTo({ commentId, pseudo });
    setCommentText((prev) => {
      const mention = `@${pseudo} `;
      return prev.startsWith(mention) ? prev : mention;
    });
    inputRef.current?.focus();
  }

  function cancelReply() {
    setReplyTo(null);
    setCommentText("");
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const body: { text: string; parentCommentId?: string } = { text: commentText.trim() };
      if (replyTo) body.parentCommentId = replyTo.commentId;
      const { data } = await api.post<GridComment>(`/comments/${grid.id}`, body);

      if (replyTo) {
        // Insère la nouvelle réponse dans le parent ciblé
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.commentId
              ? {
                  ...c,
                  repliesCount: (c.repliesCount ?? 0) + 1,
                  _localReplies: [...((c as GridComment & { _localReplies?: GridComment[] })._localReplies ?? []), data],
                } as GridComment
              : c
          )
        );
        setReplyTo(null);
      } else {
        setComments((prev) => [...prev, data]);
      }
      setCommentCount((prev) => prev + 1);
      setCommentText("");
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(commentId: string, parentId?: string | null) {
    try {
      await api.delete(`/comments/${commentId}`);
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? {
                  ...c,
                  repliesCount: Math.max(0, (c.repliesCount ?? 1) - 1),
                  _localReplies: ((c as GridComment & { _localReplies?: GridComment[] })._localReplies ?? []).filter((r) => r.id !== commentId),
                } as GridComment
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      setCommentCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  return (
    <article className="grid-card" ref={articleRef}>
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
          {grid.user.cameraModel && !ownerActions && (
            <span className="grid-card__camera">{grid.user.cameraModel}</span>
          )}
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
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              onReply={focusReply}
              onDelete={deleteComment}
              highlightCommentId={highlightCommentId ?? null}
              highlightNonce={highlightNonce ?? null}
            />
          ))}

          <form onSubmit={submitComment} className="grid-card__comment-form">
            {replyTo && (
              <button type="button" onClick={cancelReply} className="grid-card__reply-cancel" aria-label="Annuler la réponse">
                ×
              </button>
            )}
            <input
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyTo ? `Répondre à ${replyTo.pseudo}…` : "Ajouter un commentaire…"}
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

interface CommentItemProps {
  comment: GridComment;
  currentUserId?: string;
  onReply: (commentId: string, pseudo: string) => void;
  onDelete: (commentId: string, parentId?: string | null) => void;
  isReply?: boolean;
  highlightCommentId?: string | null;
  highlightNonce?: string | null;
}

function CommentItem({ comment, currentUserId, onReply, onDelete, isReply, highlightCommentId, highlightNonce }: CommentItemProps) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(!!comment.liked);
  const [likesCount, setLikesCount] = useState(comment.likesCount ?? 0);
  const [replies, setReplies] = useState<GridComment[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(0); // nb chargés depuis le serveur
  const [totalReplies, setTotalReplies] = useState(comment.repliesCount ?? 0);
  const [expanded, setExpanded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const isHighlightTarget = highlightCommentId === comment.id;
  const [flashOn, setFlashOn] = useState(false);

  // Réponses optimistes ajoutées localement (suite à un POST réussi côté parent)
  const localReplies = (comment as GridComment & { _localReplies?: GridComment[] })._localReplies ?? [];

  // Synchronise le compteur si le parent met à jour repliesCount (suppression/ajout local)
  useEffect(() => {
    setTotalReplies(comment.repliesCount ?? 0);
  }, [comment.repliesCount]);

  async function toggleLike() {
    try {
      const { data } = await api.post<{ liked: boolean; count: number }>(`/comments/${comment.id}/like`);
      setLiked(data.liked);
      setLikesCount(data.count);
    } catch {}
  }

  async function loadMoreReplies() {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const { data } = await api.get<RepliesPage>(
        `/comments/${comment.id}/replies?skip=${repliesLoaded}&take=${REPLIES_PAGE_SIZE}`
      );
      setReplies((prev) => [...prev, ...data.replies]);
      setRepliesLoaded((prev) => prev + data.replies.length);
      setTotalReplies(data.total);
      setExpanded(true);
    } catch {
    } finally {
      setLoadingReplies(false);
    }
  }

  // Auto-expand : si la cible n'est pas ce commentaire mais peut être l'une de ses réponses,
  // on charge toutes les pages jusqu'à la trouver (ou jusqu'à épuisement)
  useEffect(() => {
    if (!highlightCommentId || isReply) return;
    if (highlightCommentId === comment.id) return; // c'est nous, rien à déplier
    if (!totalReplies) return;
    let cancelled = false;
    (async () => {
      let skip = 0;
      const collected: GridComment[] = [];
      while (!cancelled) {
        const { data } = await api.get<RepliesPage>(
          `/comments/${comment.id}/replies?skip=${skip}&take=${REPLIES_PAGE_SIZE}`
        );
        collected.push(...data.replies);
        skip += data.replies.length;
        const found = data.replies.some((r) => r.id === highlightCommentId);
        if (found || skip >= data.total || data.replies.length === 0) {
          if (cancelled) return;
          setReplies(collected);
          setRepliesLoaded(skip);
          setTotalReplies(data.total);
          setExpanded(true);
          return;
        }
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [highlightCommentId, highlightNonce, comment.id, isReply, totalReplies]);

  // Scroll + flash visuel sur le commentaire ciblé (re-rejoue si nonce change)
  useEffect(() => {
    if (!isHighlightTarget) return;
    requestAnimationFrame(() => {
      blockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    // Toggle off→on pour redémarrer l'animation CSS si on re-clique
    setFlashOn(false);
    const id = requestAnimationFrame(() => setFlashOn(true));
    const timer = window.setTimeout(() => setFlashOn(false), 2600);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(timer);
    };
  }, [isHighlightTarget, highlightNonce]);

  function collapse() {
    setExpanded(false);
    setReplies([]);
    setRepliesLoaded(0);
  }

  // Quand une réponse enfant est supprimée, on la retire de notre state local
  // (sinon GridCard ne peut pas le faire car les réponses chargées vivent ici)
  function handleChildDelete(childId: string, _parentId?: string | null) {
    setReplies((prev) => prev.filter((r) => r.id !== childId));
    setRepliesLoaded((prev) => Math.max(0, prev - 1));
    onDelete(childId, comment.id);
  }

  // Toutes les réponses fusionnées : serveur + locales (sans doublons)
  const allReplies = [
    ...replies,
    ...localReplies.filter((r) => !replies.some((rs) => rs.id === r.id)),
  ];
  // Le total inclut les locales optimistes
  const effectiveTotal = Math.max(totalReplies, allReplies.length);
  const hasMore = repliesLoaded < totalReplies;
  const allShown = expanded && !hasMore;

  return (
    <div
      ref={blockRef}
      className={`grid-card__comment-block${isReply ? ' grid-card__comment-block--reply' : ''}${flashOn ? ' grid-card__comment-block--highlighted' : ''}`}
    >
      <div className="grid-card__comment">
        <span className="grid-card__comment-pseudo">{comment.user.pseudo}</span>
        <span className="grid-card__comment-text">{comment.text}</span>
        {currentUserId === comment.userId && (
          <button
            onClick={() => {
              const msg = isReply ? t('comments.deleteReplyConfirm') : t('comments.deleteConfirm');
              if (!window.confirm(msg)) return;
              onDelete(comment.id, comment.parentCommentId ?? null);
            }}
            className="grid-card__comment-delete"
          >
            ×
          </button>
        )}
      </div>

      <div className="grid-card__comment-meta">
        <button onClick={toggleLike} className={`grid-card__comment-like${liked ? ' grid-card__comment-like--on' : ''}`}>
          {liked ? '♥' : '♡'} {likesCount > 0 ? likesCount : ''}
        </button>
        {!isReply && (
          <button onClick={() => onReply(comment.id, comment.user.pseudo)} className="grid-card__comment-reply-btn">
            Répondre
          </button>
        )}
      </div>

      {!isReply && effectiveTotal > 0 && (
        <div className="grid-card__replies">
          {expanded && allReplies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={handleChildDelete}
              isReply
              highlightCommentId={highlightCommentId}
              highlightNonce={highlightNonce}
            />
          ))}

          {!expanded && (
            <button onClick={loadMoreReplies} className="grid-card__replies-toggle" disabled={loadingReplies}>
              Voir {effectiveTotal} réponse{effectiveTotal > 1 ? 's' : ''}
            </button>
          )}
          {expanded && hasMore && (
            <button onClick={loadMoreReplies} className="grid-card__replies-toggle" disabled={loadingReplies}>
              Voir plus de réponses
            </button>
          )}
          {expanded && allShown && effectiveTotal > REPLIES_PAGE_SIZE && (
            <button onClick={collapse} className="grid-card__replies-toggle">
              Réduire
            </button>
          )}
        </div>
      )}
    </div>
  );
}
