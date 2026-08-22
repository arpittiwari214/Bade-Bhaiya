import { useId } from 'react';

export function CheckboxGroup({
  legend,
  hint,
  options,
  selected,
  onChange,
}: {
  legend: string;
  hint?: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const hintId = useId();

  return (
    <fieldset aria-describedby={hint ? hintId : undefined}>
      <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {legend}
      </legend>

      {hint && (
        <p id={hintId} className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, option.value]
                    : selected.filter((item) => item !== option.value),
                )
              }
              className="size-4 rounded accent-brand-700"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
