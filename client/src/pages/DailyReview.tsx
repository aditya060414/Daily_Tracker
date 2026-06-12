import React, { useEffect, useState } from 'react';
import {
  PenLine,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useReviewsStore, useDateStore } from '../store';
import { format, parseISO, subDays } from 'date-fns';
import { DayReview } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

const MOODS = [
  { value: 1, emoji: '😫', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export const DailyReview: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);

  // Zustand Store
  const { currentReview, allReviews, loading, fetchReview, fetchAllReviews, saveReview } = useReviewsStore();

  // Local draft states
  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [mood, setMood] = useState(3);

  // Fetch reviews on load / date change
  useEffect(() => {
    fetchReview(selectedDate);
    fetchAllReviews();
  }, [selectedDate, fetchReview, fetchAllReviews]);

  // Sync draft states on load
  useEffect(() => {
    if (currentReview) {
      setHighlights(currentReview.highlights || '');
      setChallenges(currentReview.challenges || '');
      setGratitude(currentReview.gratitude || '');
      setTomorrowFocus(currentReview.tomorrowFocus || '');
      setMood(currentReview.mood || 3);
    } else {
      setHighlights('');
      setChallenges('');
      setGratitude('');
      setTomorrowFocus('');
      setMood(3);
    }
  }, [currentReview]);

  // Count words in a string
  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
  };

  // Trigger auto-save on field blur
  const handleBlurSave = async (field: keyof Omit<DayReview, '_id' | 'date' | 'wordCount'>, value: any) => {
    await saveReview(selectedDate, {
      [field]: value,
    });
  };

  // Mood selector click
  const handleMoodSelect = async (mValue: number) => {
    setMood(mValue);
    await saveReview(selectedDate, { mood: mValue });
  };

  // Streak counter calculation
  const calculateStreak = () => {
    if (allReviews.length === 0) return 0;
    
    // Build set of review dates
    const reviewDates = new Set(allReviews.map((r) => r.date));
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    let currentCheckDate = new Date();
    let streak = 0;
    
    // Check if we have a review today or yesterday to start the streak
    if (reviewDates.has(todayStr)) {
      currentCheckDate = new Date();
    } else if (reviewDates.has(yesterdayStr)) {
      currentCheckDate = subDays(new Date(), 1);
    } else {
      return 0; // Streak is broken
    }
    
    // Loop backwards counting consecutive dates
    while (true) {
      const dateStr = format(currentCheckDate, 'yyyy-MM-dd');
      if (reviewDates.has(dateStr)) {
        streak++;
        currentCheckDate = subDays(currentCheckDate, 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  const getMoodEmoji = (val: number) => {
    return MOODS.find((m) => m.value === val)?.emoji || '😐';
  };

  if (loading && !currentReview) {
    return <LoadingSpinner message="Locking alignment for journaling arrays..." />;
  }

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 select-none animate-fade-in pb-6">
      {/* REVIEW FORM: Highlights, Challenges, Gratitude, Tomorrow Focus (8 cols) */}
      <div className="xl:col-span-8 bg-panel border border-border rounded-lg p-5 space-y-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <PenLine className="w-5 h-5 text-accent animate-pulse" />
          <h2 className="font-mono text-sm font-bold text-off-white">DAILY_REFLECTIONS</h2>
        </div>

        {/* Mood Selector Row */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-off-white-muted uppercase tracking-wider block">
            How was your day? (Mood Metrics)
          </label>
          <div className="flex flex-wrap gap-2.5">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => handleMoodSelect(m.value)}
                className={`flex-1 min-w-[70px] py-3 rounded border text-center transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                  mood === m.value
                    ? 'bg-accent/15 border-accent text-off-white shadow-lg shadow-accent/10 scale-105'
                    : 'bg-card border-border text-off-white-muted hover:text-off-white hover:border-accent/30'
                }`}
                title={m.label}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Textareas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          {/* Highlights */}
          <div className="space-y-1.5 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                1. Highlights of the Day
              </label>
              <span className="text-[8px] text-off-white-muted bg-card px-1.5 py-0.5 rounded border border-border">
                {getWordCount(highlights)} words
              </span>
            </div>
            <textarea
              placeholder="What went well? Wins, breakthroughs..."
              className="w-full flex-grow min-h-[120px] px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent resize-none leading-relaxed"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              onBlur={() => handleBlurSave('highlights', highlights)}
            />
          </div>

          {/* Challenges */}
          <div className="space-y-1.5 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                2. Challenges Faced
              </label>
              <span className="text-[8px] text-off-white-muted bg-card px-1.5 py-0.5 rounded border border-border">
                {getWordCount(challenges)} words
              </span>
            </div>
            <textarea
              placeholder="What obstacles did you hit? Distractions..."
              className="w-full flex-grow min-h-[120px] px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent resize-none leading-relaxed"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              onBlur={() => handleBlurSave('challenges', challenges)}
            />
          </div>

          {/* Gratitude */}
          <div className="space-y-1.5 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                3. Gratitude (3 things)
              </label>
              <span className="text-[8px] text-off-white-muted bg-card px-1.5 py-0.5 rounded border border-border">
                {getWordCount(gratitude)} words
              </span>
            </div>
            <textarea
              placeholder="1. Coffee&#10;2. TypeScript compilation success&#10;3. Morning run..."
              className="w-full flex-grow min-h-[120px] px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent resize-none leading-relaxed"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              onBlur={() => handleBlurSave('gratitude', gratitude)}
            />
          </div>

          {/* Tomorrow Focus */}
          <div className="space-y-1.5 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                4. Focus for Tomorrow
              </label>
              <span className="text-[8px] text-off-white-muted bg-card px-1.5 py-0.5 rounded border border-border">
                {getWordCount(tomorrowFocus)} words
              </span>
            </div>
            <textarea
              placeholder="What are the absolute priorities for tomorrow?"
              className="w-full flex-grow min-h-[120px] px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent resize-none leading-relaxed"
              value={tomorrowFocus}
              onChange={(e) => setTomorrowFocus(e.target.value)}
              onBlur={() => handleBlurSave('tomorrowFocus', tomorrowFocus)}
            />
          </div>
        </div>

        <div className="border-t border-border pt-3 text-[9px] font-mono text-off-white-muted text-right">
          Changes save automatically when focus changes (on blur).
        </div>
      </div>

      {/* HISTORY SIDEBAR (4 cols) */}
      <div className="xl:col-span-4 space-y-6 flex flex-col">
        {/* Streak Counter */}
        <div className="bg-panel border border-border rounded-lg p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-off-white-muted">Journaling Streak</span>
            <span className="text-xl font-mono font-bold text-off-white">
              {currentStreak} <span className="text-xs text-off-white-muted">consecutive days</span>
            </span>
          </div>
          <div className="p-2.5 rounded bg-accent/15 border border-accent/35 text-accent glow-accent">
            <Zap className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* History List */}
        <div className="bg-panel border border-border rounded-lg p-5 flex-1 flex flex-col max-h-[400px] xl:max-h-none overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
            <BookOpen className="w-4 h-4 text-accent" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Journal History</h3>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {allReviews.length === 0 ? (
              <div className="text-center py-8 text-[11px] font-mono text-off-white-muted">
                No past journals logged.
              </div>
            ) : (
              allReviews.map((rev) => (
                <div
                  key={rev._id}
                  onClick={() => setSelectedDate(rev.date)}
                  className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition-colors ${
                    selectedDate === rev.date
                      ? 'bg-accent/10 border-accent text-off-white glow-accent'
                      : 'bg-card border-border hover:border-accent/40'
                  }`}
                  title="Click to load this day's review and data"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{getMoodEmoji(rev.mood)}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-off-white font-mono">
                        {format(parseISO(rev.date), 'MMM dd, yyyy')}
                      </span>
                      <span className="text-[9px] text-off-white-muted font-mono mt-0.5">
                        {rev.wordCount} words logged
                      </span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono border border-border px-1.5 py-0.5 rounded text-off-white-muted uppercase shrink-0">
                    Load Date
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DailyReview;
