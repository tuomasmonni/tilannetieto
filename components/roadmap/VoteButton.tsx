'use client';
interface P { voteCount: number; hasVoted: boolean; onToggle: () => void; disabled?: boolean; }
export default function VoteButton({ voteCount, hasVoted, onToggle, disabled }: P) {
  return (<button onClick={onToggle} disabled={disabled} className={`flex flex-col items-center justify-center w-14 h-16 rounded-lg border transition-colors flex-shrink-0 ${hasVoted ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><svg className={`w-4 h-4 ${hasVoted ? 'text-blue-400' : ''}`} fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg><span className="text-sm font-bold">{voteCount}</span></button>);
}
