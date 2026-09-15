import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Tag, X, Loader2 } from 'lucide-react';
import { journalApi } from '../services/api';
import toast from 'react-hot-toast';

export default function JournalEntryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isNew = !id;

  const [form, setForm] = useState({
    title: '',
    content: location.state?.prompt ? `Prompt: "${location.state.prompt}"\n\n` : '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Load existing entry
  const { data, isLoading } = useQuery({
    queryKey: ['journal', id],
    queryFn: () => journalApi.getEntry(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (data?.data?.data?.entry) {
      const entry = data.data.data.entry;
      setForm({ title: entry.title || '', content: entry.content || '', tags: entry.tags || [] });
    }
  }, [data]);

  useEffect(() => {
    setWordCount(form.content.trim() ? form.content.trim().split(/\s+/).length : 0);
  }, [form.content]);

  const createEntry = useMutation({
    mutationFn: journalApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setSaved(true);
      toast.success('Entry saved!');
      navigate(`/journal/${res.data.data.entry.id}`, { replace: true });
    },
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }: any) => journalApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setSaved(true);
      toast.success('Entry updated');
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    if (!form.content.trim()) return toast.error('Write something first');
    const payload = { ...form, prompt_used: location.state?.prompt };
    if (isNew) {
      createEntry.mutate(payload);
    } else {
      updateEntry.mutate({ id, data: payload });
    }
  };

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  };

  const isPending = createEntry.isPending || updateEntry.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-dawn-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/journal')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)]">
            {wordCount.toLocaleString()} words
          </span>
          <button
            onClick={handleSave}
            disabled={isPending}
            className={`btn-primary flex items-center gap-2 transition-all ${saved ? 'bg-sage-500 hover:bg-sage-600' : ''}`}
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <><span>✓</span> Saved</>
            ) : (
              <><Save size={16} /> Save</>
            )}
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Entry title (optional)"
        className="w-full text-3xl font-display font-bold bg-transparent border-none outline-none mb-4
                   text-[var(--color-text)] placeholder:text-[var(--color-border)]"
      />

      {/* Content */}
      <textarea
        value={form.content}
        onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
        placeholder="Start writing... Let your thoughts flow freely."
        className="w-full min-h-[50vh] bg-transparent border-none outline-none resize-none
                   text-base leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-border)]
                   font-body"
        autoFocus={isNew}
      />

      {/* Tags */}
      <div className="border-t border-[var(--color-border)] pt-4 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={14} className="text-[var(--color-text-muted)]" />
          {form.tags.map((tag) => (
            <span key={tag} className="badge bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] flex items-center gap-1">
              #{tag}
              <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))} className="hover:text-rose-500">
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            placeholder="Add tag..."
            className="text-sm bg-transparent border-none outline-none text-[var(--color-text-muted)] w-24"
          />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Press Enter or comma to add a tag · Ctrl+S to save</p>
      </div>
    </div>
  );
}
