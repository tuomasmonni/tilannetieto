'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/db/supabase-browser';
import RoadmapItemCard, { type RoadmapItem } from '@/components/roadmap/RoadmapItemCard';
import NewItemModal from '@/components/roadmap/NewItemModal';
import Link from 'next/link';

const STATUSES = [
  { v: 'all', l: 'Kaikki' },
  { v: 'proposed', l: 'Ehdotettu' },
  { v: 'planned', l: 'Suunnitteilla' },
  { v: 'in_progress', l: 'Työn alla' },
  { v: 'completed', l: 'Valmis' },
];

const SORTS = [
  { v: 'votes', l: 'Eniten ääniä' },
  { v: 'newest', l: 'Uusimmat' },
  { v: 'oldest', l: 'Vanhimmat' },
];

export default function RoadmapPage() {
  const { user, profile, signOut } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [votes, setVotes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('votes');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const fetchData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;

    const [itemsRes, votesRes] = await Promise.all([
      supabase.from('roadmap_items').select('*, profiles:author_id(display_name)').order('vote_count', { ascending: false }),
      supabase.from('roadmap_votes').select('item_id').eq('user_id', user.id),
    ]);

    if (itemsRes.data) {
      const mapped = itemsRes.data.map((item: Record<string, unknown>) => {
        const profileData = item.profiles as Record<string, unknown> | null;
        return {
          ...item,
          author_name: profileData?.display_name as string | undefined,
        } as unknown as RoadmapItem;
      });
      setItems(mapped);
    }
    if (votesRes.data) {
      setVotes(new Set(votesRes.data.map((v: { item_id: string }) => v.item_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVoteToggle = async (itemId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;

    const hasVoted = votes.has(itemId);

    // Optimistic update
    setVotes(prev => {
      const next = new Set(prev);
      if (hasVoted) next.delete(itemId); else next.add(itemId);
      return next;
    });
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, vote_count: i.vote_count + (hasVoted ? -1 : 1) } : i));

    try {
      if (hasVoted) {
        await supabase.from('roadmap_votes').delete().eq('user_id', user.id).eq('item_id', itemId);
      } else {
        await supabase.from('roadmap_votes').insert({ user_id: user.id, item_id: itemId });
      }
    } catch {
      // Revert on error
      setVotes(prev => {
        const next = new Set(prev);
        if (hasVoted) next.add(itemId); else next.delete(itemId);
        return next;
      });
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, vote_count: i.vote_count + (hasVoted ? 1 : -1) } : i));
    }
  };

  const handleCreateItem = async (data: { title: string; description: string; category: string }) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;

    const { error } = await supabase.from('roadmap_items').insert({
      title: data.title,
      description: data.description,
      category: data.category,
      author_id: user.id,
      is_official: false,
    });

    if (error) throw error;
    await fetchData();
  };

  const handleEditItem = async (item: RoadmapItem) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isAdmin) return;

    const statusOrder = ['proposed', 'planned', 'in_progress', 'completed', 'rejected'];
    const currentIdx = statusOrder.indexOf(item.status);
    const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];

    await supabase.from('roadmap_items').update({ status: nextStatus }).eq('id', item.id);
    await fetchData();
  };

  const handleDeleteItem = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isAdmin) return;

    if (!confirm('Poistetaanko tämä ehdotus pysyvästi?')) return;
    await supabase.from('roadmap_items').delete().eq('id', id);
    await fetchData();
  };

  const filtered = items.filter(i => filter === 'all' || i.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'votes') return b.vote_count - a.vote_count;
    if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Karttaan
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {(profile?.display_name || user?.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-sm text-zinc-300 hidden sm:block">{profile?.display_name || user?.email}</span>
            </div>
            <button onClick={signOut} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Ulos</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Roadmap</span>
            {isAdmin && <span className="text-xs font-normal text-blue-400 bg-blue-600/20 px-2 py-0.5 rounded-full border border-blue-500/30">Admin</span>}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Äänestä tulevista ominaisuuksista ja ehdota omia ideoita.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {STATUSES.map(s => (
            <button
              key={s.v}
              onClick={() => setFilter(s.v)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filter === s.v
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>

        {/* Sort + New */}
        <div className="flex items-center justify-between mb-4">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            + Ehdota uutta
          </button>
        </div>

        {/* Items */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Ladataan...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">Ei ehdotuksia tässä kategoriassa.</p>
            <button onClick={() => setModalOpen(true)} className="mt-2 text-sm text-blue-400 hover:text-blue-300">Ehdota ensimmäinen!</button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(item => (
              <RoadmapItemCard
                key={item.id}
                item={item}
                hasVoted={votes.has(item.id)}
                onVoteToggle={handleVoteToggle}
                isAdmin={isAdmin}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}

        {/* Count */}
        <div className="mt-6 text-center text-xs text-zinc-600">
          {sorted.length} ehdotusta {filter !== 'all' ? `(${STATUSES.find(s => s.v === filter)?.l})` : ''}
        </div>
      </main>

      <NewItemModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreateItem} />
    </div>
  );
}
