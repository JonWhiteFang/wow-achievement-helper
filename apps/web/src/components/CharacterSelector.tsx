import { useEffect, useState } from "react";
import { fetchMyCharacters, type WowCharacter } from "../lib/api";

type Props = {
  onSelect: (realm: string, name: string) => void;
  onClose: () => void;
};

export function CharacterSelector({ onSelect, onClose }: Props) {
  const [characters, setCharacters] = useState<WowCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyCharacters()
      .then(setCharacters)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: "8px", padding: "16px", width: "400px", maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>Select Character</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
        </div>
        {loading && <p>Loading characters...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && characters.length === 0 && <p>No characters found</p>}
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => { onSelect(c.realm, c.name); onClose(); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", borderBottom: "1px solid #eee", background: "white", cursor: "pointer" }}
          >
            {c.name} - {c.realm} (Level {c.level})
          </button>
        ))}
      </div>
    </div>
  );
}
