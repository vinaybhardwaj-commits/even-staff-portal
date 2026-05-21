'use client';
import { useState } from 'react';
import { EyeOff, Reply, ChevronDown } from 'lucide-react';
import type { BulletinComment } from '@/lib/portal/bulletin';
import { Avatar } from './Avatar';
import { TimeChip } from './TimeChip';
import { ReplyForm } from './ReplyForm';

type CommentNode = BulletinComment & { children: CommentNode[] };

function buildTree(comments: BulletinComment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  for (const c of comments) map.set(c.id, { ...c, children: [] });
  const roots: CommentNode[] = [];
  for (const c of map.values()) {
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.children.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

const VISIBLE_DEPTH = 3; // PRD §3 #15

function CommentRow({ node, depth, postId }: { node: CommentNode; depth: number; postId: number }) {
  const [showReply, setShowReply] = useState(false);
  const [unfolded, setUnfolded] = useState(false);
  const hidden = !!node.hidden_at;

  const indent = depth === 0 ? '' : 'pl-3 border-l-2 border-brand-faint ml-2';

  return (
    <div className={`mt-3 ${indent}`}>
      {hidden ? (
        <div className="flex items-center gap-2 text-[11px] italic text-[var(--color-text-muted)]">
          <EyeOff className="w-3 h-3" /> Comment removed by moderator
          {node.hidden_reason && <span className="text-[10px]">— {node.hidden_reason}</span>}
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2.5">
            <Avatar name={node.author_display_name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold text-navy">{node.author_display_name}</span>
                <TimeChip iso={node.created_at} />
              </div>
              <div className="text-[12px] text-[var(--color-text-secondary)] leading-snug whitespace-pre-wrap">{node.body}</div>
              <button
                type="button"
                onClick={() => setShowReply((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-brand"
              >
                <Reply className="w-3 h-3" /> {showReply ? 'Cancel' : 'Reply'}
              </button>
              {showReply && (
                <ReplyForm
                  postId={postId}
                  parentCommentId={node.id}
                  placeholder={`Reply to ${node.author_display_name}…`}
                  compact
                  onPosted={() => setShowReply(false)}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Render children */}
      {node.children.length > 0 && (
        depth + 1 < VISIBLE_DEPTH || unfolded ? (
          node.children.map((c) => <CommentRow key={c.id} node={c} depth={depth + 1} postId={postId} />)
        ) : (
          <button
            type="button"
            onClick={() => setUnfolded(true)}
            className="mt-2 ml-2 inline-flex items-center gap-1 text-[10px] text-brand hover:text-brand-dark border-l-2 border-brand-faint pl-3 py-1"
          >
            <ChevronDown className="w-3 h-3" /> {countDescendants(node.children)} more {countDescendants(node.children) === 1 ? 'reply' : 'replies'}
          </button>
        )
      )}
    </div>
  );
}

function countDescendants(nodes: CommentNode[]): number {
  let n = 0;
  for (const c of nodes) n += 1 + countDescendants(c.children);
  return n;
}

export function CommentTree({ comments, postId }: { comments: BulletinComment[]; postId: number }) {
  const tree = buildTree(comments);
  if (tree.length === 0) {
    return (
      <div className="mt-4 px-3 py-6 text-center text-[12px] text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-lg">
        No replies yet. Be the first.
      </div>
    );
  }
  return (
    <div>
      {tree.map((c) => <CommentRow key={c.id} node={c} depth={0} postId={postId} />)}
    </div>
  );
}
