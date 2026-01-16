import { useState, useEffect } from "react";
import { fetchRealms, type Realm } from "../lib/api";

type Props = {
  onLookup: (realm: string, name: string) => void;
  loading: boolean;
  currentCharacter: { realm: string; name: string } | null;
  onClear: () => void;
};

export function CharacterLookup({ onLookup, loading, currentCharacter, onClear }: Props) {
  const [realm, setRealm] = useState("");
  const [name, setName] = useState("");
  const [realms, setRealms] = useState<Realm[]>([]);
  const [realmsLoading, setRealmsLoading] = useState(true);

  useEffect(() => {
    fetchRealms()
      .then(setRealms)
      .catch(() => setRealms([]))
      .finally(() => setRealmsLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (realm.trim() && name.trim()) onLookup(realm.trim(), name.trim());
  };

  if (currentCharacter) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="badge">{currentCharacter.name}-{currentCharacter.realm}</span>
        <button className="btn btn-ghost" onClick={onClear} style={{ padding: "4px 8px", fontSize: 12 }}>Clear</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {realms.length > 0 ? (
        <select className="input" value={realm} onChange={(e) => setRealm(e.target.value)} disabled={loading} style={{ width: 140 }}>
          <option value="">Select realm</option>
          {realms.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
        </select>
      ) : (
        <input className="input" placeholder={realmsLoading ? "Loading..." : "Realm"} value={realm} onChange={(e) => setRealm(e.target.value)} disabled={loading || realmsLoading} style={{ width: 140 }} />
      )}
      <input className="input" placeholder="Character" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} style={{ width: 100 }} />
      <button className="btn" type="submit" disabled={loading || !realm.trim() || !name.trim()}>{loading ? "..." : "Lookup"}</button>
    </form>
  );
}
