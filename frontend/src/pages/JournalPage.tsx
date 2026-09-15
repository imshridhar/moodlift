import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, BookOpen, Clock, Tag, Sparkles } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { journalApi } from '../services/api';
import toast from 'react-hot-toast';

export default function JournalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [promptVisible, setPromptVisible] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['journal', search, tagFilter],
    queryFn: () => journalApi.getAll({ search: search || undefined, tag: tagFilter || undefined }),
  });

  const { data: promptData } = useQuery({
    queryKey: ['journal-prompt'],
    queryFn: () => journalApi.getPrompts(),
  });

  const deleteEntry = useMutation({
    mutationFn: journalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Entry deleted');
    },
  });

  const entries = data?.data?.data?.entries || [];
  const prompt = promptData?.data?.data?.prompt;

  // Collect all unique tags
  const allTags: string[] = [...new Set(entries.flatMap((e: any) => e.tags || []))] as string[];

  const sentimentColor = (score: number | null) => {
    if (!score) return 'text-[var(--color-text-muted)]';
    if (score > 0.3) return 'text-sage-600';
    if (score < -0.3) return 'text-rose-500';
    return 'text-[var(--color-text-muted)]';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Journal</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Your private space to reflect and grow</p>
        </div>
        <Link to="/journal/new" className="btn-primary">
          <Plus size={18} /> New entry
        </Link>
      </div>

      {/* Daily Prompt Banner */}
      {prompt && promptVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-lavender-50 to-dawn-50 dark:from-lavender-950/30 dark:to-dawn-950/20 border-lavender-100 dark:border-lavender-900/40 mb-6 relative"
        >
          <button
            onClick={() => setPromptVisible(false)}
            className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg leading-none"
          >×</button>
          <div className="flex gap-3 items-start pr-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavender-400 to-dawn-400 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1 font-medium">Today's prompt</p>
              <p className="font-display italic text-lg text-[var(--color-text)]">"{prompt}"</p>
              <button
                onClick={() => navigate('/journal/new', { state: { prompt } })}
                className="text-sm text-lavender-600 hover:text-lavender-700 font-medium mt-2 flex items-center gap-1"
              >
                Write to this prompt →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="input pl-10"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <Tag size={14} className="text-[var(--color-text-muted)] shrink-0" />
            {allTags.slice(0, 5).map((tag: string) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`badge text-xs py-1 ${tagFilter === tag ? 'bg-dawn-500 text-white' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'}`}
              >#{tag}</button>
            ))}
          </div>
        )}
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-5 w-2/3 mb-2" />
              <div className="skeleton h-4 w-full mb-1" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-[var(--color-border)] mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No entries yet</h3>
          <p className="text-[var(--color-text-muted)] mb-6">
            {search ? 'No entries match your search.' : 'Start writing to build your journal.'}
          </p>
          {!search && <Link to="/journal/new" className="btn-primary">Write your first entry</Link>}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-3"
        >
          {entries.map((entry: any) => (
            <motion.div
              key={entry.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <div
                className="card hover:shadow-medium cursor-pointer group transition-all duration-200"
                onClick={() => navigate(`/journal/${entry.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {entry.title && (
                      <h3 className="font-display font-semibold text-lg mb-1 truncate">{entry.title}</h3>
                    )}
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed line-clamp-2">
                      {entry.excerpt}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this entry?')) deleteEntry.mutate(entry.id);
                    }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 text-[var(--color-text-muted)] transition-all shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </span>
                  {entry.word_count && (
                    <span>{entry.word_count.toLocaleString()} words</span>
                  )}
                  {entry.reading_time_minutes && (
                    <span>{entry.reading_time_minutes} min read</span>
                  )}
                  {entry.tags?.length > 0 && (
                    <div className="flex gap-1 ml-auto">
                      {entry.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="badge bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px]">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
