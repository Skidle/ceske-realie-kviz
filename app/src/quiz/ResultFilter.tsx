import type { ChangeEvent } from 'react';
import type { ResultFilterValue } from './types';
import type { AppLocale } from '../content/types';

interface ResultFilterProps {
  filteredValue: ResultFilterValue;
  onChange: (value: ResultFilterValue) => void;
  appLocale: AppLocale;
}

/**
 * A plain <select>, matching the category and subcategory controls on the setup screen.
 *
 * It replaces a hand-rolled dropdown: a div of role="menuitem" children with its own
 * outside-click listener and its own Enter handling. The browser does all of that
 * correctly, and the version it replaces could not be reached by keyboard at all.
 */
function ResultFilter({ filteredValue, onChange, appLocale }: ResultFilterProps) {
  const options: Array<[ResultFilterValue, string]> = [
    ['all', appLocale.resultFilterAll],
    ['correct', appLocale.resultFilterCorrect],
    ['incorrect', appLocale.resultFilterIncorrect],
  ];

  return (
    <div className="quiz-result-filter">
      <label htmlFor="resultFilter">{appLocale.resultFilterLabel}</label>
      <div className="custom-select-container">
        <select
          id="resultFilter"
          className="custom-select"
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
