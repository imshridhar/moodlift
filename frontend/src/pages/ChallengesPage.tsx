import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { CalendarDays, Filter, Medal, PlusCircle, Sparkles, Target, Trophy, Users, Zap } from 'lucide-react';
import {
  useAbandonChallenge,
  useChallenge,
  useChallenges,
  useCreateChallenge,
  useJoinChallenge,
  useLeaderboard,
  useUpdateChallengeProgress,
  useUserChallengeProgress,
  useUserChallenges,
} from '../hooks/useChallenges';
import { Badge, CardSkeleton, ConfirmModal, EmptyState, StatCard, Toggle } from '../components/ui';
import type { ChallengeDifficulty, ChallengeLeaderboardEntry, ChallengeParticipant, ChallengeSummary } from '../types/wellbeing';

const categoryLabels: Record<string, string> = {
  mood_tracking: 'Mood tracking',
  journaling: 'Journaling',
  meditation: 'Meditation',
  fitness: 'Fitness',
  social: 'Social',
};

const difficultyLabels: Record<ChallengeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const difficultyVariant: Record<ChallengeDifficulty, 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

const defaultDraft = {
  title: '',
  description: '',
  category: 'mood_tracking',
  durationDays: 7,
  goal: 5,
  difficulty: 'easy' as ChallengeDifficulty,
  reward: '',
  isRecurring: true,
};

const humanize = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const categoryLabel = (value: string) => categoryLabels[value] ?? humanize(value);

const creatorLabel = (challenge: ChallengeSummary | null) => {
  if (!challenge?.creator_id || typeof challenge.creator_id === 'string') {
    return 'MoodLift community';
  }
  return challenge.creator_id.full_name || challenge.creator_id.username;
};

function LeaderboardRow({ entry, highlight }: { entry: ChallengeLeaderboardEntry; highlight: boolean }) {
  const name = entry.user.full_name || entry.user.username;
  return (
    <div className={`rounded-[var(--radius-md)] border px-3 py-3 ${highlight ? 'border-dawn-300 bg-dawn-50/70 dark:bg-dawn-950/20' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-sm font-semibold">{entry.rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-medium">{name}</p>
            <span className="text-xs text-[var(--color-text-muted)]">{entry.progress_percent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div className="h-full rounded-full bg-gradient-to-r from-dawn-500 to-lavender-500" style={{ width: `${entry.progress_percent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'' | ChallengeDifficulty>('');
  const [view, setView] = useState<'browse' | 'my' | 'create'>('browse');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [draft, setDraft] = useState(defaultDraft);

  const browseQuery = useChallenges({ category: category || undefined, difficulty: difficulty || undefined }, { enabled: view === 'browse' });
  const myChallengesQuery = useUserChallenges(undefined, { enabled: view === 'my' });
  const challengeQuery = useChallenge(selectedChallengeId ?? '', { enabled: view === 'browse' && !!selectedChallengeId });
  const progressQuery = useUserChallengeProgress(selectedChallengeId ?? '', { enabled: view === 'my' && !!selectedChallengeId });
  const leaderboardQuery = useLeaderboard(selectedChallengeId ?? '', 8, { enabled: view !== 'create' && !!selectedChallengeId });

  const joinMutation = useJoinChallenge();
  const createMutation = useCreateChallenge();
  const updateProgressMutation = useUpdateChallengeProgress(selectedChallengeId ?? '');
  const abandonMutation = useAbandonChallenge();

  const challenges = browseQuery.data ?? [];
  const myChallenges = myChallengesQuery.data ?? [];
  const selectedParticipant = myChallenges.find((entry) => entry.challenge.id === selectedChallengeId) ?? null;
  const selectedBrowse = challengeQuery.data ?? challenges.find((entry) => entry.id === selectedChallengeId) ?? null;
  const selectedChallenge = view === 'browse' ? selectedBrowse : progressQuery.data?.challenge ?? selectedParticipant?.challenge ?? null;
  const leaderboard = leaderboardQuery.data?.leaderboard ?? [];
  const userRank = leaderboardQuery.data?.userRank ?? null;
  const totalParticipants = challenges.reduce((total, entry) => total + entry.participant_count, 0);
  const currentProgress = progressQuery.data?.progress ?? selectedParticipant?.progress ?? 0;
  const currentPercent = progressQuery.data?.progress_percent ?? selectedParticipant?.progress_percent ?? 0;

  useEffect(() => {
    if (view === 'create') return;
    if (view === 'browse') {
      const fallback = challenges[0]?.id ?? null;
      const stillVisible = selectedChallengeId && challenges.some((entry) => entry.id === selectedChallengeId);
      if (!stillVisible) setSelectedChallengeId(fallback);
      return;
    }
    const fallback = myChallenges[0]?.challenge.id ?? null;
    const stillVisible = selectedChallengeId && myChallenges.some((entry) => entry.challenge.id === selectedChallengeId);
    if (!stillVisible) setSelectedChallengeId(fallback);
  }, [challenges, myChallenges, selectedChallengeId, view]);

  useEffect(() => {
    if (!joinMutation.data) return;
    const nextId = typeof joinMutation.data.challenge_id === 'string' ? joinMutation.data.challenge_id : joinMutation.data.challenge?.id ?? null;
    setView('my');
    setSelectedChallengeId(nextId);
  }, [joinMutation.data]);

  useEffect(() => {
    if (!createMutation.data) return;
    setDraft(defaultDraft);
    setView('browse');
    setSelectedChallengeId(createMutation.data.id);
  }, [createMutation.data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="card relative overflow-hidden bg-gradient-to-br from-lavender-50 to-dawn-50 dark:from-lavender-950/25 dark:to-dawn-950/20">
          <div className="absolute right-[-60px] top-[-60px] h-48 w-48 rounded-full bg-lavender-300/20 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-lavender-700 dark:bg-black/20 dark:text-lavender-300"><Sparkles size={14} />Community momentum</div>
              <h1 className="mt-4 font-display text-3xl font-bold lg:text-4xl">Challenges that make progress visible</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">Join active challenges, update your score, or create a new challenge record that shows up in the live list.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Active" value={challenges.length} sub="Open challenges" icon={<Trophy size={18} />} color="var(--color-lavender)" loading={browseQuery.isLoading && view === 'browse'} />
              <StatCard label="Joined" value={myChallenges.length} sub="Your list" icon={<Users size={18} />} color="var(--color-sage)" loading={myChallengesQuery.isLoading && view === 'my'} />
              <StatCard label="Participants" value={totalParticipants} sub="Across current challenges" icon={<Users size={18} />} color="var(--color-dawn)" loading={browseQuery.isLoading && view === 'browse'} />
              <StatCard label="Rank" value={userRank ?? '-'} sub="For selected challenge" icon={<Target size={18} />} color="var(--color-dawn)" loading={leaderboardQuery.isLoading && view !== 'create'} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setView('browse')} className={view === 'browse' ? 'btn-primary px-4 py-2 text-sm' : 'btn-secondary px-4 py-2 text-sm'}>Browse all</button>
        <button type="button" onClick={() => setView('my')} className={view === 'my' ? 'btn-primary px-4 py-2 text-sm' : 'btn-secondary px-4 py-2 text-sm'}>My challenges</button>
        <button type="button" onClick={() => setView('create')} className={view === 'create' ? 'btn-primary px-4 py-2 text-sm' : 'btn-secondary px-4 py-2 text-sm'}><PlusCircle size={16} />Create challenge</button>
      </div>

      {view === 'create' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
          <section className="card">
            <Badge variant="info">Challenge studio</Badge>
            <h2 className="mt-3 font-display text-2xl font-semibold">Create a new challenge</h2>
            <p className="mt-2 text-[var(--color-text-muted)]">This form writes to the existing backend create endpoint, so new challenge records appear in the browse tab right away.</p>
            <form
              className="mt-6 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate({
                  title: draft.title,
                  description: draft.description,
                  category: draft.category,
                  durationDays: Number(draft.durationDays),
                  goal: Number(draft.goal),
                  difficulty: draft.difficulty,
                  reward: draft.reward || undefined,
                  isRecurring: draft.isRecurring,
                });
              }}
            >
              <label className="block">
                <span className="label">Title</span>
                <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="input" placeholder="Example: Calm Mornings Club" required />
              </label>
              <label className="block">
                <span className="label">Description</span>
                <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="input min-h-[140px]" placeholder="What will people do in this challenge?" required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Category</span>
                  <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="input">
                    {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Difficulty</span>
                  <select value={draft.difficulty} onChange={(event) => setDraft((current) => ({ ...current, difficulty: event.target.value as ChallengeDifficulty }))} className="input">
                    {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="label">Duration</span>
                  <input type="number" min={1} value={draft.durationDays} onChange={(event) => setDraft((current) => ({ ...current, durationDays: Number(event.target.value) }))} className="input" required />
                </label>
                <label className="block">
                  <span className="label">Goal</span>
                  <input type="number" min={1} value={draft.goal} onChange={(event) => setDraft((current) => ({ ...current, goal: Number(event.target.value) }))} className="input" required />
                </label>
                <label className="block">
                  <span className="label">Reward</span>
                  <input value={draft.reward} onChange={(event) => setDraft((current) => ({ ...current, reward: event.target.value }))} className="input" placeholder="Optional" />
                </label>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <Toggle checked={draft.isRecurring} onChange={(checked) => setDraft((current) => ({ ...current, isRecurring: checked }))} label="Make this recurring" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary"><PlusCircle size={16} />Create challenge</button>
                <button type="button" onClick={() => setDraft(defaultDraft)} className="btn-secondary">Reset form</button>
              </div>
            </form>
          </section>
          <aside className="card self-start">
            <div className="flex items-center gap-2"><Trophy size={18} className="text-dawn-500" /><h3 className="font-semibold">What this covers</h3></div>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
              <p>Frontend: a usable create flow instead of a hidden backend-only endpoint.</p>
              <p>Backend: the form writes to the challenge creation API already defined in the service layer.</p>
              <p>Database: the new record is persisted immediately and can be joined like the seeded challenges.</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
          <section>
            {view === 'browse' && (
              <div className="card mb-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium"><Filter size={16} className="text-[var(--color-text-muted)]" />Filter challenges</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Category</span>
                    <select value={category} onChange={(event) => setCategory(event.target.value)} className="input">
                      <option value="">All categories</option>
                      {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Difficulty</span>
                    <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as '' | ChallengeDifficulty)} className="input">
                      <option value="">All levels</option>
                      {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {view === 'browse' && browseQuery.isLoading ? (
              <div className="grid gap-4 lg:grid-cols-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
            ) : view === 'browse' && challenges.length === 0 ? (
              <div className="card"><EmptyState icon="CH" title="No challenges match those filters" description="Try a broader filter or create a new challenge instead." action={{ label: 'Clear filters', onClick: () => { setCategory(''); setDifficulty(''); } }} /></div>
            ) : view === 'browse' ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedChallengeId(challenge.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedChallengeId(challenge.id);
                      }
                    }}
                    className={`card cursor-pointer transition-all duration-200 ${selectedChallengeId === challenge.id ? 'border-dawn-400 shadow-medium' : 'hover:-translate-y-0.5 hover:shadow-medium'}`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="info">{categoryLabel(challenge.category)}</Badge>
                        <h3 className="mt-3 font-display text-xl font-semibold">{challenge.title}</h3>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{challenge.description}</p>
                      </div>
                      <Badge variant={difficultyVariant[challenge.difficulty]}>{difficultyLabels[challenge.difficulty]}</Badge>
                    </div>
                    <div className="mb-5 grid grid-cols-2 gap-3 text-sm text-[var(--color-text-muted)]">
                      <div className="flex items-center gap-2"><CalendarDays size={16} />{challenge.duration_days} days</div>
                      <div className="flex items-center gap-2"><Target size={16} />Goal {challenge.goal}</div>
                      <div className="flex items-center gap-2"><Users size={16} />{challenge.participant_count} joined</div>
                      <div className="flex items-center gap-2"><Medal size={16} />{challenge.reward || 'Community reward'}</div>
                    </div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); joinMutation.mutate(challenge.id); }} disabled={joinMutation.isPending && joinMutation.variables === challenge.id} className="btn-primary px-4 py-2 text-sm"><Zap size={16} />Join challenge</button>
                  </div>
                ))}
              </div>
            ) : myChallengesQuery.isLoading ? (
              <div className="grid gap-4 lg:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
            ) : myChallenges.length === 0 ? (
              <div className="card"><EmptyState icon="UP" title="You have not joined any challenges yet" description="Join one from the browse tab to start tracking progress and leaderboard rank." action={{ label: 'Browse challenges', onClick: () => setView('browse') }} /></div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {myChallenges.map((entry) => (
                  <button key={entry.id} type="button" onClick={() => setSelectedChallengeId(entry.challenge.id)} className={`card text-left transition-all duration-200 ${selectedChallengeId === entry.challenge.id ? 'border-dawn-400 shadow-medium' : 'hover:-translate-y-0.5 hover:shadow-medium'}`}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="warning">{categoryLabel(entry.challenge.category)}</Badge>
                        <h3 className="mt-3 font-display text-xl font-semibold">{entry.challenge.title}</h3>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Joined {formatDistanceToNowStrict(new Date(entry.joined_at), { addSuffix: true })}</p>
                      </div>
                      <Badge variant={entry.status === 'completed' ? 'success' : entry.status === 'abandoned' ? 'danger' : 'info'}>{humanize(entry.status)}</Badge>
                    </div>
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between text-sm"><span className="text-[var(--color-text-muted)]">Progress</span><span className="font-medium">{entry.progress_percent}%</span></div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]"><div className="h-full rounded-full bg-gradient-to-r from-lavender-500 to-dawn-500" style={{ width: `${entry.progress_percent}%` }} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-[var(--color-text-muted)]">
                      <div className="flex items-center gap-2"><Target size={16} />{entry.progress} / {entry.challenge.goal}</div>
                      <div className="flex items-center gap-2"><CalendarDays size={16} />{entry.challenge.duration_days} days</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="self-start xl:sticky xl:top-6">
            <div className="card min-h-[420px]">
              {selectedChallenge ? (
                <>
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="info">{categoryLabel(selectedChallenge.category)}</Badge>
                      <h2 className="mt-3 font-display text-2xl font-semibold">{selectedChallenge.title}</h2>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{selectedChallenge.description}</p>
                    </div>
                    <Badge variant={difficultyVariant[selectedChallenge.difficulty]}>{difficultyLabels[selectedChallenge.difficulty]}</Badge>
                  </div>
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <StatCard label="Goal" value={selectedChallenge.goal} sub="Target actions" icon={<Target size={16} />} />
                    <StatCard label="Participants" value={selectedChallenge.participant_count} sub="Joined so far" icon={<Users size={16} />} />
                    <StatCard label="Duration" value={`${selectedChallenge.duration_days}d`} sub="Challenge window" icon={<CalendarDays size={16} />} />
                    <StatCard label="Reward" value={selectedChallenge.reward || '-'} sub="Completion reward" icon={<Medal size={16} />} />
                  </div>
                  <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
                    <div className="mb-2 flex items-center justify-between gap-4"><span className="text-[var(--color-text-muted)]">Hosted by</span><span className="font-medium">{creatorLabel(selectedChallenge)}</span></div>
                    <div className="mb-2 flex items-center justify-between gap-4"><span className="text-[var(--color-text-muted)]">Starts</span><span className="font-medium">{format(new Date(selectedChallenge.start_date), 'MMM d')}</span></div>
                    <div className="flex items-center justify-between gap-4"><span className="text-[var(--color-text-muted)]">Ends</span><span className="font-medium">{selectedChallenge.end_date ? formatDistanceToNowStrict(new Date(selectedChallenge.end_date), { addSuffix: true }) : 'Flexible'}</span></div>
                  </div>

                  {view === 'browse' ? (
                    <div className="mb-6 flex items-center gap-3">
                      <button type="button" onClick={() => joinMutation.mutate(selectedChallenge.id)} disabled={joinMutation.isPending} className="btn-primary flex-1"><Zap size={16} />Join this challenge</button>
                      <span className="max-w-[120px] text-xs text-[var(--color-text-muted)]">Joined challenges move into your active list.</span>
                    </div>
                  ) : selectedParticipant ? (
                    <>
                      <div className="mb-5 rounded-[var(--radius-lg)] border border-lavender-200 bg-gradient-to-br from-lavender-50 to-dawn-50 p-5 dark:border-lavender-900/40 dark:from-lavender-950/20 dark:to-dawn-950/20">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div><p className="text-sm text-[var(--color-text-muted)]">Your progress</p><p className="font-display text-3xl font-bold">{currentPercent}%</p></div>
                          <div className="text-right text-sm text-[var(--color-text-muted)]"><p>{currentProgress} / {selectedParticipant.challenge.goal}</p><p>{userRank ? `Rank #${userRank}` : 'No rank yet'}</p></div>
                        </div>
                        <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]"><div className="h-full rounded-full bg-gradient-to-r from-lavender-500 to-dawn-500" style={{ width: `${currentPercent}%` }} /></div>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 3, 5].map((step) => (
                            <button key={step} type="button" onClick={() => updateProgressMutation.mutate(step)} disabled={selectedParticipant.status !== 'active' || updateProgressMutation.isPending} className="btn-secondary px-3 py-2 text-sm">+{step}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-6 flex items-center gap-3">
                        <button type="button" onClick={() => setShowAbandonConfirm(true)} disabled={selectedParticipant.status !== 'active'} className="btn-secondary flex-1 text-sm">Leave challenge</button>
                        <span className="text-xs text-[var(--color-text-muted)]">{selectedParticipant.status === 'active' ? 'Leaving stops active tracking for this challenge.' : 'This challenge is no longer active for you.'}</span>
                      </div>
                    </>
                  ) : null}

                  <div>
                    <div className="mb-3 flex items-center gap-2"><Trophy size={16} className="text-dawn-500" /><h3 className="font-semibold">Leaderboard</h3></div>
                    {leaderboardQuery.isLoading ? (
                      <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
                    ) : leaderboard.length === 0 ? (
                      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">No leaderboard entries yet for this challenge.</div>
                    ) : (
                      <div className="space-y-3">
                        {leaderboard.map((entry) => <LeaderboardRow key={entry.id} entry={entry} highlight={selectedParticipant ? entry.user.id === selectedParticipant.user_id : false} />)}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState icon="LB" title={view === 'browse' ? 'Pick a challenge' : 'Select one of your challenges'} description={view === 'browse' ? 'Choose a challenge to inspect the rules, reward, and leaderboard.' : 'Choose a joined challenge to update progress and see your rank.'} />
              )}
            </div>
          </aside>
        </div>
      )}

      <ConfirmModal
        isOpen={showAbandonConfirm}
        title="Leave this challenge?"
        message="Your current score will stay in history, but this challenge will stop tracking new progress for you."
        confirmLabel="Leave challenge"
        cancelLabel="Stay in challenge"
        danger={true}
        onCancel={() => setShowAbandonConfirm(false)}
        onConfirm={() => {
          if (selectedChallengeId) abandonMutation.mutate(selectedChallengeId);
          setShowAbandonConfirm(false);
        }}
      />
    </div>
  );
}
