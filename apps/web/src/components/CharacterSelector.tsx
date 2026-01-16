import { useEffect, useState } from "react";
import { fetchMyCharacters, type WowCharacter } from "../lib/api";

type Props = {
  onSelect: (realm: string, name: string) => void;
  onMerge: (characters: { realm: string; name: string }[]) => void;
  onClose: () => void;
  initialSelection?: { realm: string; name: string }[];
};

const MAX_LEVEL = 80; // Current WoW max level

export function CharacterSelector({ onSelect, onMerge, onClose, initialSelection = [] }: Props) {
  const [characters, setCharacters] = useState<WowCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection.map((c) => `${c.realm}/${c.name.toLowerCase()}`)));
  const [mode, setMode] = useState<"single" | "merge">(initialSelection.length > 0 ? "merge" : "single");
  const [maxLevelOnly, setMaxLevelOnly] = useState(false);

  useEffect(() => {
    fetchMyCharacters()
      .then(setCharacters)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredCharacters = maxLevelOnly ? characters.filter((c) => c.level >= MAX_LEVEL) : characters;
  const maxLevelChars = characters.filter((c) => c.level >= MAX_LEVEL);

  const toggleSelection = (c: WowCharacter) => {
    const next = new Set(selected);
    if (next.has(c.id)) next.delete(c.id);
    else next.add(c.id);
    setSelected(next);
  };

  const selectAllMaxLevel = () => {
    setSelected(new Set(maxLevelChars.map((c) => c.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const handleMerge = () => {
    const chars = characters.filter((c) => selected.has(c.id)).map((c) => ({ realm: c.realm, name: c.name }));
    if (chars.length > 0) {
      onMerge(chars);
      onClose();
    }
  };

  const handleMergeAll = () => {
    const chars = maxLevelChars.map((c) => ({ realm: c.realm, name: c.name }));
    if (chars.length > 0) {
      onMerge(chars);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Select Character</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 18 }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className={`btn ${mode === "single" ? "btn-primary" : ""}`} onClick={() => setMode("single")}>Single</button>
          <button className={`btn ${mode === "merge" ? "btn-primary" : ""}`} onClick={() => setMode("merge")}>Merge</button>
          {maxLevelChars.length > 1 && (
            <button className="btn btn-success" onClick={handleMergeAll} style={{ marginLeft: "auto" }}>
              Merge All ({maxLevelChars.length})
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={maxLevelOnly} onChange={(e) => setMaxLevelOnly(e.target.checked)} />
            Max level only ({MAX_LEVEL}+)
          </label>
          {mode === "merge" && (
            <>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "2px 8px" }} onClick={selectAllMaxLevel}>Select all max</button>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "2px 8px" }} onClick={clearSelection}>Clear</button>
            </>
          )}
        </div>

        {loading && <p className="text-muted">Loading characters...</p>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && characters.length === 0 && <p className="text-muted">No characters found</p>}

        <div style={{ maxHeight: 300, overflow: "auto" }}>
          {filteredCharacters.map((c) => (
            <button
              key={c.id}
              onClick={() => mode === "single" ? (onSelect(c.realm, c.name), onClose()) : toggleSelection(c)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                borderBottom: "1px solid var(--border)",
                background: mode === "merge" && selected.has(c.id) ? "var(--panel-2)" : "transparent",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <span>{c.name} - {c.realm} (Level {c.level})</span>
              {mode === "merge" && selected.has(c.id) && <span className="text-success">✓</span>}
            </button>
          ))}
        </div>

        {mode === "merge" && (
          <button className="btn btn-success" onClick={handleMerge} disabled={selected.size === 0} style={{ width: "100%", marginTop: 16 }}>
            Merge {selected.size} Characters
          </button>
        )}
      </div>
    </div>
  );
}
