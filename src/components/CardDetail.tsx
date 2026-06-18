import React, { useState, useRef } from 'react';
import {
  X, Pencil, Check, Trash2, Calendar, User, Flag, Tag as TagIcon,
  Paperclip, MessageSquare, Clock, Upload, FileText, Image, File,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store';
import {
  CARD_COLORS, CARD_HEADER_COLORS, PRIORITY_STYLES, PRIORITY_LABELS,
  formatDate, formatDateTime, formatRelative, formatFileSize
} from '../utils';
import type { CardColor, Priority, Tag } from '../types';

const COLOR_CIRCLE_MAP: Record<string, string> = {
  none: 'bg-slate-200',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  pink: 'bg-pink-400',
};

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
];

const hashColor = (str: string): string => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const TAG_PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b',
];

const generateId = (): string => {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

export const CardDetail = () => {
  const {
    cards,
    selectedCardId,
    setSelectedCard,
    updateCard,
    deleteCard,
    addCardComment,
    addCardAttachment,
    removeCardAttachment,
    setActivityFilterCard,
    setShowActivityPanel,
  } = useStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descMode, setDescMode] = useState<'preview' | 'edit'>('preview');
  const [descDraft, setDescDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagInputVisible, setTagInputVisible] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const card = selectedCardId ? cards[selectedCardId] : null;

  React.useEffect(() => {
    if (!card) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCard(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [card, setSelectedCard]);

  React.useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  React.useEffect(() => {
    if (tagInputVisible && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [tagInputVisible]);

  if (!card) return null;

  const handleClose = () => {
    setSelectedCard(null);
    setEditingTitle(false);
    setDescMode('preview');
    setConfirmDelete(false);
    setTagInputVisible(false);
    setTagInput('');
  };

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== card.title) {
      updateCard(card.id, { title: trimmed });
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditingTitle(false);
    }
  };

  const handleStartEditTitle = () => {
    setTitleDraft(card.title);
    setEditingTitle(true);
  };

  const handleDescSave = () => {
    if (descDraft !== card.description) {
      updateCard(card.id, { description: descDraft });
    }
    setDescMode('preview');
  };

  const handleStartEditDesc = () => {
    setDescDraft(card.description);
    setDescMode('edit');
  };

  const handlePriorityChange = (p: Priority) => {
    updateCard(card.id, { priority: p });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateCard(card.id, { assignee: val || null });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      updateCard(card.id, { dueDate: new Date(val).getTime() });
    } else {
      updateCard(card.id, { dueDate: null });
    }
  };

  const handleColorChange = (c: CardColor) => {
    updateCard(card.id, { color: c });
  };

  const handleAddTag = () => {
    const name = tagInput.trim();
    if (!name) return;
    const exists = card.tags.some((t) => t.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setTagInput('');
      return;
    }
    const color = TAG_PRESET_COLORS[card.tags.length % TAG_PRESET_COLORS.length];
    const newTag: Tag = { id: generateId(), name, color };
    updateCard(card.id, { tags: [...card.tags, newTag] });
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setTagInputVisible(false);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    updateCard(card.id, { tags: card.tags.filter((t) => t.id !== tagId) });
  };

  const handleAddComment = () => {
    const content = commentDraft.trim();
    if (!content) return;
    addCardComment(card.id, content);
    setCommentDraft('');
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddComment();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      await addCardAttachment(card.id, files[i]);
    }
    e.target.value = '';
  };

  const handleDeleteCard = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCard(card.id);
  };

  const handleViewActivity = () => {
    setActivityFilterCard(card.id);
    setShowActivityPanel(true);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-pink-500" />;
    if (type.includes('pdf') || type.includes('text') || type.includes('document') || type.includes('sheet'))
      return <FileText size={16} className="text-blue-500" />;
    return <File size={16} className="text-slate-400" />;
  };

  const dueDateValue = card.dueDate ? formatDate(card.dueDate) : '';
  const isOverdue = card.dueDate !== null && card.dueDate < Date.now();

  return (
    <AnimatePresence>
      <motion.div
        key="card-detail-backdrop"
        className="fixed inset-0 z-40"
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      </motion.div>

      <motion.div
        key="card-detail-panel"
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
        className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-lg font-semibold text-slate-800 border border-indigo-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            ) : (
              <div className="flex items-center gap-2 group/title">
                <h2 className="text-lg font-semibold text-slate-800 truncate">
                  {card.title}
                </h2>
                <button
                  onClick={handleStartEditTitle}
                  className="p-1 rounded opacity-0 group-hover/title:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Flag size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">属性</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="w-16 text-xs text-slate-500 shrink-0">负责人</label>
                  <div className="flex-1 flex items-center gap-2">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={card.assignee ?? ''}
                      onChange={handleAssigneeChange}
                      placeholder="未指定"
                      className="flex-1 text-sm text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none py-1 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-16 text-xs text-slate-500 shrink-0">优先级</label>
                  <div className="flex gap-1.5">
                    {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePriorityChange(p)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          card.priority === p
                            ? PRIORITY_STYLES[p]
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-16 text-xs text-slate-500 shrink-0">截止日期</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className={`shrink-0 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                    <input
                      type="date"
                      value={dueDateValue}
                      onChange={handleDueDateChange}
                      className={`text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none py-1 transition-colors ${
                        isOverdue ? 'text-red-500' : 'text-slate-700'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-16 text-xs text-slate-500 shrink-0">颜色</label>
                  <div className="flex items-center gap-2">
                    {(Object.keys(COLOR_CIRCLE_MAP) as CardColor[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          COLOR_CIRCLE_MAP[c]
                        } ${
                          card.color === c
                            ? 'border-slate-800 scale-110'
                            : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        {card.color === c && <Check size={12} className="text-white drop-shadow-sm" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <label className="w-16 text-xs text-slate-500 shrink-0 pt-1">标签</label>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: tag.color + '20',
                            color: tag.color,
                            border: `1px solid ${tag.color}40`,
                          }}
                        >
                          {tag.name}
                          <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    {tagInputVisible ? (
                      <input
                        ref={tagInputRef}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onBlur={() => {
                          if (!tagInput.trim()) {
                            setTagInputVisible(false);
                          }
                        }}
                        onKeyDown={handleTagKeyDown}
                        placeholder="输入标签名，回车添加"
                        className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                      />
                    ) : (
                      <button
                        onClick={() => setTagInputVisible(true)}
                        className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                      >
                        <TagIcon size={12} />
                        添加标签
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">描述</span>
                </div>
                <button
                  onClick={descMode === 'preview' ? handleStartEditDesc : handleDescSave}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {descMode === 'preview' ? (
                    <>
                      <Pencil size={12} />
                      编辑
                    </>
                  ) : (
                    <>
                      <Check size={12} />
                      保存
                    </>
                  )}
                </button>
              </div>
              {descMode === 'edit' ? (
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  placeholder="添加描述（支持 Markdown）..."
                  className="w-full min-h-[160px] text-sm text-slate-700 font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-y"
                />
              ) : (
                <div
                  className="markdown-body text-sm text-slate-700 min-h-[60px]"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('a')) return;
                  }}
                >
                  {card.description ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {card.description}
                    </ReactMarkdown>
                  ) : (
                    <button
                      onClick={handleStartEditDesc}
                      className="text-slate-400 hover:text-slate-500 transition-colors"
                    >
                      点击添加描述...
                    </button>
                  )}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">评论</span>
                {card.comments.length > 0 && (
                  <span className="text-xs text-slate-400">{card.comments.length}</span>
                )}
              </div>

              <div className="space-y-3 mb-3">
                {card.comments.map((comment) => {
                  const color = hashColor(comment.author);
                  const initial = comment.author ? comment.author.charAt(0).toUpperCase() : 'U';
                  return (
                    <div key={comment.id} className="flex gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-semibold ${color}`}
                      >
                        {/^[\u4e00-\u9fa5]/.test(initial) ? (
                          <User size={12} />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-slate-700">{comment.author}</span>
                          <span className="text-[10px] text-slate-400" title={formatDateTime(comment.createdAt)}>
                            {formatRelative(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <textarea
                  ref={commentInputRef}
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="添加评论... (Ctrl+Enter 发送)"
                  rows={2}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentDraft.trim()}
                  className="self-end px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  发送
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">附件</span>
                  {card.attachments.length > 0 && (
                    <span className="text-xs text-slate-400">{card.attachments.length}</span>
                  )}
                </div>
                <button
                  onClick={handleFileUpload}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  <Upload size={12} />
                  上传
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {card.attachments.length > 0 && (
                <div className="space-y-2">
                  {card.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                    >
                      <div className="shrink-0">{getFileIcon(att.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-700 truncate">{att.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatFileSize(att.size)} · {formatRelative(att.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={att.dataUrl}
                          download={att.name}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => removeCardAttachment(card.id, att.id)}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {card.attachments.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">
                  暂无附件
                </div>
              )}
            </section>

            <section>
              <button
                onClick={handleViewActivity}
                className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                <Clock size={14} />
                查看活动记录
              </button>
            </section>
          </div>
        </div>

        <div className="shrink-0 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[10px] text-slate-400">
            创建于 {formatDateTime(card.createdAt)} · 更新于 {formatRelative(card.updatedAt)}
          </div>
          <div className="relative">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">确认删除？</span>
                <button
                  onClick={handleDeleteCard}
                  className="px-2.5 py-1 rounded-md bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteCard}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
                删除卡片
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
