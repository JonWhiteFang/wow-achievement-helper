import { useState } from "react";

type Props = {
  onLookup: (realm: string, name: string) => void;
  loading: boolean;
  currentCharacter: { realm: string; name: string } | null;
  onClear: () => void;
};

export function CharacterLookup({ onLookup, loading, currentCharacter, onClear }: Props) {
  const [realm, setRealm] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (realm.trim() && name.trim()) {
      onLookup(realm.trim(), name.trim());
    }
  };

  if (currentCharacter) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "14px" }}>
          {currentCharacter.name}-{currentCharacter.realm}
        </span>
        <button onClick={onClear} style={{ padding: "4px 8px", fontSize: "12px" }}>
          Clear
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <input
        type="text"
        placeholder="Realm"
        value={realm}
        onChange={(e) => setRealm(e.target.value)}
        style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", width: "120px" }}
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Character"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", width: "120px" }}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !realm.trim() || !name.trim()} style={{ padding: "6px 12px" }}>
        {loading ? "..." : "Lookup"}
      </button>
    </form>
  );
}
