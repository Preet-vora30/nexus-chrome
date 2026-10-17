import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SearchEngine } from '@/types';

export interface SearchEngineSelectProps {
  engine: SearchEngine;
  engines: SearchEngine[];
  onChange: (engine: SearchEngine) => void;
  className?: string;
}

/**
 * Dropdown to select the default search engine.
 */
export function SearchEngineSelect({
  engine,
  engines,
  onChange,
  className,
}: SearchEngineSelectProps) {
  return (
    <div
      className={cn('inline-block relative', className)}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(engines[0])}
        className="flex items-center gap-2 pl-3 pr-10 text-sm"
      >
        <span aria-hidden="true">{engine.icon}</span>
        <span>{engine.name}</span>
        <ChevronDown className="h-3.5 w-3.5 ml-auto" aria-hidden="true" />
      </Button>
    </div>
  );
}
