import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { searchCreators, type Creator } from '@/services/creatorSearch';

export function CreatorSearchSelect({ onSelect }: { onSelect: (creator: Creator) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Creator[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query) return setResults([]);
      try {
        setResults(await searchCreators(query));
      } catch {
        setResults([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-2">
      <Input placeholder="Search creators…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {results.map((creator) => (
          <button key={creator.id} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => onSelect(creator)}>
            {creator.name}
          </button>
        ))}
      </div>
    </div>
  );
}
