import { useEffect, useState } from "react";
import { fetchMyCharacters, type WowCharacter } from "../lib/api";

type Props = {
  onSelect: (realm: string, name: string) => void;
  onMerge: (characters: { realm: string; name: string }[]) => void;
  onClose: () => void;
  initialSelection?: { realm: string; name: string }[];
};

export function CharacterSelector({ onSelect, onMerge, onClose, initialSelection = [] }: Props) {
  const [characters, setCharacters] = useState<WowCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection.map((c) => `${c.realm}/${c.name.toLowerCase()}`)));
  const [mode, setMode] = useState<"single" | "merge">(initialSelection.length > 0 ? "merge" : "single");

  useEffect(() => {
    fetchMyCharacters()
      .then(setCharacters)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelection = (c: WowCharacter) => {
    const key = c.id;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const handleMerge = () => {
    const chars = characters.filter((c) => selected.has(c.id)).map((c) => ({ realm: c.realm, name: c.name }));
    if (chars.length > 0) {
      onMerge(chars);
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: "8px", padding: "16px", width: "400px", maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ margin: 0 }}>Select Character</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
          <button onClick={() => setMode("single")} style={{ padding: "6px 12px", background: mode === "single" ? "#0074e0" : "#eee", color: mode === "single" ? "white" : "black", border: "none", borderRadius: "4px" }}>Single</button>
          <button onClick={() => setMode("merge")} style={{ padding: "6px 12px", background: mode === "merge" ? "#0074e0" : "#eee", color: mode === "merge" ? "white" : "black", border: "none", borderRadius: "4px" }}>Merge</button>
        </div>
        {loading && <p>Loading characters...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && characters.length === 0 && <p>No characters found</p>}
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => mode === "single" ? (onSelect(c.realm, c.name), onClose()) : toggleSelection(c)}
            style={{ display: "flex", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", borderBottom: "1px solid #eee", background: mode === "merge" && selected.has(c.id) ? "#e3f2fd" : "white", cursor: "pointer" }}
          >
            <span>{c.name} - {c.realm} (Level {c.level})</span>
            {mode === "merge" && selected.has(c.id) && <span>✓</span>}
          </button>
        ))}
        {mode === "merge" && (
          <button onClick={handleMerge} disabled={selected.size === 0} style={{ marginTop: "12px", width: "100%", padding: "10px", background: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Merge {selected.size} Characters
          </button>
        )}
      </div>
    </div>
  );
}
