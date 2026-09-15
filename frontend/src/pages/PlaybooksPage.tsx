import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Filter,
  Play,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import {
  useAbandonPlaybook,
  useCompleteLesson,
  useEnrollPlaybook,
  usePlaybook,
  usePlaybooks,
  useUserPlaybookProgress,
  useUserPlaybooks,
} from '../hooks/usePlaybooks';
import { Badge, CardSkeleton, ConfirmModal, EmptyState, StatCard } from '../components/ui';
import type {
  PlaybookDifficulty,
  PlaybookLesson,
  PlaybookSummary,
  UserPlaybook,
  UserPlaybookProgress,
} from '../types/wellbeing';

const categoryLabels: Record<string, string> = {
  focus: 'Focus',
  anxiety: 'Anxiety',
  sleep: 'Sleep',
  motivation: 'Motivation',
  stress: 'Stress Relief',
};

const difficultyLabels: Record<PlaybookDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const difficultyVariant: Record<PlaybookDifficulty, 'success' | 'warning' | 'info'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'info',
};

const humanize = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getCategoryLabel = (category: string) => categoryLabels[category] ?? humanize(category);

const getCurrentLesson = (progress: UserPlaybookProgress | undefined) => {
  if (!progress) {
    return null;
  }

  return (
    progress.lessons.find((lesson) => !progress.lessons_completed.includes(lesson.day)) ??
    progress.lessons[progress.lessons.length - 1] ??
    null
  );
};

function BrowseCard({
  playbook,
  selected,
  onSelect,
  onEnroll,
  isPending,
}: {
  playbook: PlaybookSummary;
  selected: boolean;
  onSelect: () => void;
  onEnroll: () => void;
  isPending: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`card text-left transition-all duration-200 ${
        selected ? 'border-dawn-400 shadow-medium' : 'hover:-translate-y-0.5 hover:shadow-medium'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <Badge variant="info">{getCategoryLabel(playbook.category)}</Badge>
          <h3 className="font-display text-xl font-semibold mt-3 mb-2">{playbook.title}</h3>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{playbook.description}</p>
        </div>
        <Badge variant={difficultyVariant[playbook.difficulty]}>
          {difficultyLabels[playbook.difficulty]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-5 text-[var(--color-text-muted)]">
        <div className="flex items-center gap-2">
          <Clock3 size={16} />
          <span>{playbook.duration_days} days</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen size={16} />
          <span>{playbook.lesson_count} lessons</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} />
          <span>{playbook.enrollment_count} active</span>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} className="text-dawn-500" />
          <span>{playbook.rating.toFixed(1)} rating</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEnroll();
          }}
          disabled={isPending}
          className="btn-primary px-4 py-2 text-sm"
        >
          <Play size={16} />
          Start
        </button>
        <span className="text-xs text-[var(--color-text-muted)]">
          {playbook.review_count} learner reviews
        </span>
      </div>
    </div>
  );
}

function MyPlaybookCard({
  enrollment,
  selected,
  onSelect,
}: {
  enrollment: UserPlaybook;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`card text-left transition-all duration-200 ${
        selected ? 'border-dawn-400 shadow-medium' : 'hover:-translate-y-0.5 hover:shadow-medium'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <Badge variant="warning">{getCategoryLabel(enrollment.playbook.category)}</Badge>
          <h3 className="font-display text-xl font-semibold mt-3 mb-2">{enrollment.playbook.title}</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Started {formatDistanceToNowStrict(new Date(enrollment.start_date), { addSuffix: true })}
          </p>
        </div>
        <Badge variant={enrollment.status === 'completed' ? 'success' : enrollment.status === 'abandoned' ? 'danger' : 'info'}>
          {humanize(enrollment.status)}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--color-text-muted)]">
            Day {Math.min(enrollment.current_day, enrollment.playbook.duration_days)} of {enrollment.playbook.duration_days}
          </span>
          <span className="font-medium">{enrollment.progress}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-dawn-500 to-rose-500"
            style={{ width: `${enrollment.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <BookOpen size={16} />
        <span>{enrollment.lessons_completed.length} lessons completed</span>
      </div>
    </button>
  );
}

function LessonRow({
  lesson,
  completed,
  active,
}: {
  lesson: PlaybookLesson;
  completed: boolean;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border px-4 py-3 ${
        active
          ? 'border-dawn-300 bg-dawn-50/70 dark:bg-dawn-950/20'
          : completed
            ? 'border-sage-200 bg-sage-50/60 dark:bg-sage-950/20'
            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
            completed
              ? 'bg-sage-500 text-white'
              : active
                ? 'bg-dawn-500 text-white'
                : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}
        >
          {completed ? <CheckCircle2 size={14} /> : lesson.day}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{lesson.title}</h4>
            <span className="text-xs text-[var(--color-text-muted)]">{lesson.estimated_duration} min</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{lesson.description}</p>
          <p className="text-sm mt-2 leading-relaxed">{lesson.instructions}</p>
        </div>
      </div>
    </div>
  );
}

export default function PlaybooksPage() {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'' | PlaybookDifficulty>('');
  const [view, setView] = useState<'browse' | 'my'>('browse');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  const browseQuery = usePlaybooks({ category: category || undefined, difficulty: difficulty || undefined }, { enabled: view === 'browse' });
  const myPlaybooksQuery = useUserPlaybooks(undefined, { enabled: view === 'my' });
  const playbookDetailQuery = usePlaybook(selectedPlaybookId ?? '', { enabled: view === 'browse' && !!selectedPlaybookId });
  const playbookProgressQuery = useUserPlaybookProgress(selectedPlaybookId ?? '', { enabled: view === 'my' && !!selectedPlaybookId });

  const enrollMutation = useEnrollPlaybook();
  const completeLessonMutation = useCompleteLesson(selectedPlaybookId ?? '');
  const abandonPlaybookMutation = useAbandonPlaybook();

  const playbooks = browseQuery.data ?? [];
  const myPlaybooks = myPlaybooksQuery.data ?? [];
  const activePrograms = myPlaybooks.filter((entry) => entry.status === 'active');
  const completedPrograms = myPlaybooks.filter((entry) => entry.status === 'completed');
  const selectedEnrollment = myPlaybooks.find((entry) => entry.playbook.id === selectedPlaybookId) ?? null;
  const currentLesson = getCurrentLesson(playbookProgressQuery.data);

  useEffect(() => {
    if (view === 'browse') {
      const nextId = playbooks[0]?.id ?? null;
      const stillVisible = selectedPlaybookId && playbooks.some((playbook) => playbook.id === selectedPlaybookId);
      if (!stillVisible) {
        setSelectedPlaybookId(nextId);
      }
      return;
    }

    const nextId = myPlaybooks[0]?.playbook.id ?? null;
    const stillVisible = selectedPlaybookId && myPlaybooks.some((entry) => entry.playbook.id === selectedPlaybookId);
    if (!stillVisible) {
      setSelectedPlaybookId(nextId);
    }
  }, [myPlaybooks, playbooks, selectedPlaybookId, view]);

  useEffect(() => {
    if (!enrollMutation.data) {
      return;
    }

    const nextId =
      typeof enrollMutation.data.playbook_id === 'string'
        ? enrollMutation.data.playbook_id
        : enrollMutation.data.playbook?.id ?? null;

    setView('my');
    setSelectedPlaybookId(nextId);
  }, [enrollMutation.data]);

  const selectedBrowsePlaybook =
    playbookDetailQuery.data ?? playbooks.find((playbook) => playbook.id === selectedPlaybookId) ?? null;
  const selectedMyPlaybook = playbookProgressQuery.data?.playbook ?? selectedEnrollment?.playbook ?? null;
  const selectedLessons = view === 'browse'
    ? playbookDetailQuery.data?.lessons ?? []
    : playbookProgressQuery.data?.lessons ?? [];

  const canCompleteCurrentLesson =
    !!playbookProgressQuery.data &&
    !!currentLesson &&
    playbookProgressQuery.data.status === 'active' &&
    !playbookProgressQuery.data.lessons_completed.includes(currentLesson.day);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="card relative overflow-hidden bg-gradient-to-br from-dawn-50 to-rose-50 dark:from-dawn-950/25 dark:to-rose-950/20">
          <div className="absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-dawn-300/20 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-dawn-700 dark:bg-black/20 dark:text-dawn-300">
                <Sparkles size={14} />
                Multi-day guided programs
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold mt-4 mb-3">Playbooks that turn insight into daily follow-through</h1>
              <p className="text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
                Browse structured programs, start one that matches your current season, and keep your momentum with a clear next lesson.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Available" value={playbooks.length} sub="Live playbooks" icon={<Compass size={18} />} color="var(--color-dawn)" loading={browseQuery.isLoading && view === 'browse'} />
              <StatCard label="Active" value={activePrograms.length} sub="Programs in progress" icon={<Play size={18} />} color="var(--color-sage)" loading={myPlaybooksQuery.isLoading && view === 'my'} />
              <StatCard label="Completed" value={completedPrograms.length} sub="Finished programs" icon={<CheckCircle2 size={18} />} color="var(--color-lavender)" loading={myPlaybooksQuery.isLoading && view === 'my'} />
              <StatCard
                label="Avg rating"
                value={playbooks.length ? (playbooks.reduce((total, playbook) => total + playbook.rating, 0) / playbooks.length).toFixed(1) : '0.0'}
                sub="Across all playbooks"
                icon={<Star size={18} />}
                color="var(--color-dawn)"
                loading={browseQuery.isLoading && view === 'browse'}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setView('browse')}
          className={view === 'browse' ? 'btn-primary px-4 py-2 text-sm' : 'btn-secondary px-4 py-2 text-sm'}
        >
          Browse all
        </button>
        <button
          type="button"
          onClick={() => setView('my')}
          className={view === 'my' ? 'btn-primary px-4 py-2 text-sm' : 'btn-secondary px-4 py-2 text-sm'}
        >
          My playbooks
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
        <section>
          {view === 'browse' && (
            <div className="card mb-5">
              <div className="flex items-center gap-2 text-sm font-medium mb-4">
                <Filter size={16} className="text-[var(--color-text-muted)]" />
                Narrow the list
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="input"
                  >
                    <option value="">All categories</option>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="label">Difficulty</span>
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as '' | PlaybookDifficulty)}
                    className="input"
                  >
                    <option value="">All levels</option>
                    {Object.entries(difficultyLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {view === 'browse' && browseQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : view === 'browse' && playbooks.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="PB"
                title="No playbooks match those filters"
                description="Try widening the difficulty or category filters to discover more guided programs."
                action={{ label: 'Clear filters', onClick: () => { setCategory(''); setDifficulty(''); } }}
              />
            </div>
          ) : view === 'browse' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {playbooks.map((playbook) => (
                <BrowseCard
                  key={playbook.id}
                  playbook={playbook}
                  selected={selectedPlaybookId === playbook.id}
                  onSelect={() => setSelectedPlaybookId(playbook.id)}
                  onEnroll={() => enrollMutation.mutate(playbook.id)}
                  isPending={enrollMutation.isPending && enrollMutation.variables === playbook.id}
                />
              ))}
            </div>
          ) : myPlaybooksQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : myPlaybooks.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="GO"
                title="You have not started a playbook yet"
                description="Pick a program that matches your current challenge and we will keep the next lesson front and center."
                action={{ label: 'Browse playbooks', onClick: () => setView('browse') }}
              />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {myPlaybooks.map((entry) => (
                <MyPlaybookCard
                  key={entry.id}
                  enrollment={entry}
                  selected={selectedPlaybookId === entry.playbook.id}
                  onSelect={() => setSelectedPlaybookId(entry.playbook.id)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-6 self-start">
          <div className="card min-h-[420px]">
            {view === 'browse' ? (
              selectedBrowsePlaybook ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <Badge variant="info">{getCategoryLabel(selectedBrowsePlaybook.category)}</Badge>
                      <h2 className="font-display text-2xl font-semibold mt-3">{selectedBrowsePlaybook.title}</h2>
                      <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">
                        {selectedBrowsePlaybook.description}
                      </p>
                    </div>
                    <Badge variant={difficultyVariant[selectedBrowsePlaybook.difficulty]}>
                      {difficultyLabels[selectedBrowsePlaybook.difficulty]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <StatCard label="Length" value={`${selectedBrowsePlaybook.duration_days}d`} sub="Program length" icon={<Clock3 size={16} />} />
                    <StatCard label="Lessons" value={selectedBrowsePlaybook.lesson_count} sub="Daily sessions" icon={<BookOpen size={16} />} />
                    <StatCard label="Active" value={selectedBrowsePlaybook.enrollment_count} sub="Current learners" icon={<TrendingUp size={16} />} />
                    <StatCard label="Rating" value={selectedBrowsePlaybook.rating.toFixed(1)} sub={`${selectedBrowsePlaybook.review_count} reviews`} icon={<Star size={16} />} />
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => enrollMutation.mutate(selectedBrowsePlaybook.id)}
                      disabled={enrollMutation.isPending}
                      className="btn-primary flex-1"
                    >
                      <Play size={16} />
                      Start this playbook
                    </button>
                    <span className="text-xs text-[var(--color-text-muted)] max-w-[120px]">
                      You can switch to My playbooks after enrolling.
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={16} className="text-[var(--color-text-muted)]" />
                      <h3 className="font-semibold">Preview the lessons</h3>
                    </div>
                    {playbookDetailQuery.isLoading ? (
                      <div className="space-y-3">
                        <CardSkeleton />
                        <CardSkeleton />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedLessons.map((lesson, index) => (
                          <LessonRow key={lesson.id} lesson={lesson} completed={false} active={index === 0} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="PL"
                  title="Pick a playbook"
                  description="Select a program from the list to preview the lesson flow before you start."
                />
              )
            ) : selectedMyPlaybook && selectedEnrollment ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <Badge variant="warning">{getCategoryLabel(selectedMyPlaybook.category)}</Badge>
                    <h2 className="font-display text-2xl font-semibold mt-3">{selectedMyPlaybook.title}</h2>
                    <p className="text-sm text-[var(--color-text-muted)] mt-2">
                      Started {formatDistanceToNowStrict(new Date(selectedEnrollment.start_date), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={selectedEnrollment.status === 'completed' ? 'success' : selectedEnrollment.status === 'abandoned' ? 'danger' : 'info'}>
                    {humanize(selectedEnrollment.status)}
                  </Badge>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Progress</p>
                      <p className="font-display text-3xl font-bold">{selectedEnrollment.progress}%</p>
                    </div>
                    <div className="text-right text-sm text-[var(--color-text-muted)]">
                      <p>Day {Math.min(selectedEnrollment.current_day, selectedMyPlaybook.duration_days)}</p>
                      <p>{selectedEnrollment.lessons_completed.length} of {selectedMyPlaybook.lesson_count} lessons</p>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sage-500 to-dawn-500"
                      style={{ width: `${selectedEnrollment.progress}%` }}
                    />
                  </div>
                </div>

                {currentLesson ? (
                  <div className="rounded-[var(--radius-lg)] bg-gradient-to-br from-sage-50 to-dawn-50 dark:from-sage-950/20 dark:to-dawn-950/20 border border-sage-200 dark:border-sage-900/40 p-5 mb-5">
                    <div className="flex items-center gap-2 text-sm text-sage-700 dark:text-sage-300 mb-2">
                      <Compass size={16} />
                      Current lesson
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-1">
                      Day {currentLesson.day}: {currentLesson.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">{currentLesson.description}</p>
                    <p className="text-sm leading-relaxed mb-5">{currentLesson.instructions}</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => completeLessonMutation.mutate(currentLesson.day)}
                        disabled={!canCompleteCurrentLesson || completeLessonMutation.isPending}
                        className="btn-primary flex-1"
                      >
                        <CheckCircle2 size={16} />
                        {selectedEnrollment.status === 'completed' ? 'Completed' : 'Mark lesson complete'}
                      </button>
                      <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        {currentLesson.estimated_duration} min
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setShowAbandonConfirm(true)}
                    disabled={selectedEnrollment.status !== 'active'}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Leave program
                  </button>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {selectedEnrollment.status === 'active' ? 'You can rejoin later from the library.' : 'This program is no longer active.'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-[var(--color-text-muted)]" />
                    <h3 className="font-semibold">Lesson roadmap</h3>
                  </div>
                  {playbookProgressQuery.isLoading ? (
                    <div className="space-y-3">
                      <CardSkeleton />
                      <CardSkeleton />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedLessons.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          completed={!!playbookProgressQuery.data?.lessons_completed.includes(lesson.day)}
                          active={lesson.day === currentLesson?.day}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                icon="MY"
                title="Select a program"
                description="Choose one of your active or completed playbooks to see its progress and next lesson."
              />
            )}
          </div>
        </aside>
      </div>

      <ConfirmModal
        isOpen={showAbandonConfirm}
        title="Leave this playbook?"
        message="Your progress will be kept, but this playbook will move out of your active list."
        confirmLabel="Leave playbook"
        cancelLabel="Keep going"
        danger={true}
        onCancel={() => setShowAbandonConfirm(false)}
        onConfirm={() => {
          if (selectedPlaybookId) {
            abandonPlaybookMutation.mutate(selectedPlaybookId);
          }
          setShowAbandonConfirm(false);
        }}
      />
    </div>
  );
}
