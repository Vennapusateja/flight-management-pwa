'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';
import { searchAirports, type Airport } from '@/data/airports';

interface AirportComboboxProps {
  label:       string;
  placeholder?: string;
  value:       string;           // IATA code controlled by React Hook Form
  onChange:    (code: string) => void;
  error?:      string | undefined;
  required?:   boolean;
  id?:         string;
}

// ============================================================
// AirportCombobox
//
// Accessible combobox for selecting airports by city/code.
// - Filters airports from a static dataset as user types
// - Keyboard navigable (↑ ↓ Enter Escape)
// - Fills the form field with the 3-letter IATA code on selection
// - Displays full "City (CODE)" as the visible label in the input
// - Follows WAI-ARIA combobox pattern
// ============================================================
export function AirportCombobox({
  label,
  placeholder = 'City or code',
  value,
  onChange,
  error,
  required,
  id: externalId,
}: AirportComboboxProps) {
  const generatedId = useId();
  const inputId  = externalId ?? generatedId;
  const listboxId = `${inputId}-listbox`;

  // Display text shown in the input — can be city name or IATA code
  const [inputText, setInputText]       = useState('');
  const [suggestions, setSuggestions]   = useState<Airport[]>([]);
  const [activeIndex, setActiveIndex]   = useState(-1);
  const [isOpen, setIsOpen]             = useState(false);
  const [isSelected, setIsSelected]     = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!value) {
      setInputText('');
      setIsSelected(false);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
        // If user blurred without selecting, revert to code display or clear
        if (!isSelected && value) {
          setInputText(value);
        } else if (!isSelected) {
          setInputText('');
          onChange('');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSelected, value, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    setIsSelected(false);
    onChange(''); // Clear form value until selection is made

    if (text.length >= 1) {
      const results = searchAirports(text);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [onChange]);

  const selectAirport = useCallback((airport: Airport) => {
    setInputText(`${airport.city} (${airport.code})`);
    onChange(airport.code);
    setIsSelected(true);
    setIsOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          selectAirport(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [isOpen, suggestions, activeIndex, selectAirport]);

  const handleFocus = useCallback(() => {
    // Re-open suggestions if there's existing text and it's not a confirmed selection
    if (!isSelected && inputText.length >= 1) {
      const results = searchAirports(inputText);
      if (results.length > 0) {
        setSuggestions(results);
        setIsOpen(true);
      }
    }
  }, [isSelected, inputText]);

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-400" aria-hidden="true">*</span>}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
          {/* Airplane icon */}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-invalid={!!error}
          aria-required={required}
          autoComplete="off"
          spellCheck={false}
          type="text"
          placeholder={placeholder}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className={cn(
            'w-full rounded-lg border bg-slate-900 text-slate-100 pl-10 pr-8 py-2.5 text-sm',
            'placeholder:text-slate-600 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 hover:border-slate-600'
          )}
        />

        {/* Clear button */}
        {inputText && (
          <button
            type="button"
            onClick={() => {
              setInputText('');
              setIsSelected(false);
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-2 flex items-center px-1 text-slate-600 hover:text-slate-400 transition-colors"
            aria-label="Clear airport"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown — inside the relative wrapper so top-full anchors to the input */}
        {isOpen && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className={cn(
              'absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl',
              'border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/50',
              'py-1 focus:outline-none'
            )}
          >
            {suggestions.map((airport, index) => (
              <li
                key={airport.code}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectAirport(airport);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors',
                  index === activeIndex
                    ? 'bg-indigo-600/20 text-slate-50'
                    : 'text-slate-300 hover:bg-slate-800/60'
                )}
              >
                <span className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-bold tracking-wider',
                  index === activeIndex
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-indigo-400'
                )}>
                  {airport.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-none">{airport.city}</p>
                  <p className="mt-1 truncate text-xs text-slate-500 leading-none">{airport.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>{/* end relative */}

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
