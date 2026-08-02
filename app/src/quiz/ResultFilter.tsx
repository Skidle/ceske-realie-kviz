import type { ChangeEvent } from 'react';
import type { ResultFilterValue } from './types';
import type { AppLocale } from '../content/types';

interface ResultFilterProps {
  filteredValue: ResultFilterValue;
  onChange: (value: ResultFilterValue) => void;
  appLocale: AppLocale;
}

/**
 * Matches the category and subcategory controls on the setup screen. Replaces a
 * hand-rolled dropdown — 118 lines of role="menuitem" divs, an outside-click listener and
 * its own Enter handling — that the browser does correctly and consistently.
 */
function ResultFilter({ filteredValue, onChange, appLocale }: ResultFilterProps) {
  const options: Array<[ResultFilterValue, string]> = [
    ['all', appLocale.resultFilterAll],
    ['correct', appLocale.resultFilterCorrect],
    ['incorrect', appLocale.resultFilterIncorrect],
  ];

  return (
    <div className="max-w-xs">
      <label htmlFor="resultFilter" className="block mb-1 text-sm text-zinc-600">
        {appLocale.resultFilterLabel}
      </label>
      <div>
        <select
          id="resultFilter"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-800
            focus:border-flag-500 focus:outline-none focus:ring-1 focus:ring-flag-500"
          value={filteredValue}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => (
            onChange(event.target.value as ResultFilterValue)
          )}
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ResultFilter;
