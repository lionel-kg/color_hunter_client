import { useEffect, useRef, useState } from "react";
import { CAMERA_MODELS } from "../data/cameraModels";
import { Icon } from "./Icon";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function CameraAutocomplete({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value ?? ""); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = query.trim().length >= 1
    ? CAMERA_MODELS.filter((m) =>
        m.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  function select(model: string) {
    setQuery(model);
    onChange(model);
    setOpen(false);
  }

  function handleInput(v: string) {
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  function clear() {
    setQuery("");
    onChange("");
    setOpen(false);
  }

  return (
    <div className="camera-autocomplete" ref={ref}>
      <div className="camera-autocomplete__input-wrap">
        <span className="camera-autocomplete__icon"><Icon name="camera" size={15} /></span>
        <input
          className="ch-input camera-autocomplete__input"
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.trim().length >= 1 && setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button className="camera-autocomplete__clear" onClick={clear} type="button">
            <Icon name="x" size={12} />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="camera-autocomplete__dropdown">
          {suggestions.map((m) => (
            <li
              key={m}
              className="camera-autocomplete__item"
              onMouseDown={() => select(m)}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
