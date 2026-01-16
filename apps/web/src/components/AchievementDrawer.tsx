import { useEffect, useState } from "react";
import { fetchAchievement, fetchHelp, type Achievement, type HelpPayload } from "../lib/api";
import { getNote, saveNote } from "../lib/pins";

type Props = {
  achievementId: number | null;
  onClose: () => void;
  completedIds?: Set<number>;
  onSelectAchievement?: (id: number) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
};

type Tab = "details" | "strategy" | "community";

function AchievementIcon({ src, size = 56 }: { src?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, borderRadius: 6, background: "var(--panel-2)", flexShrink: 0 };
  
  if (!src || failed) {
    return <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: size * 0.5 }}>⭐</div>;
  }
  return <img src={src} alt="" style={{ ...style, objectFit: "cover" }} onError={() => setFailed(true)} />;
}

export function AchievementDrawer({ achievementId, onClose, completedIds, onSelectAchievement, isPinned, onTogglePin }: Props) {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [help, setHelp] = useState<HelpPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("details");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!achievementId) {
      setAchievement(null);
      setHelp(null);
      setNote("");
      return;
    }
    setLoading(true);
    setError(null);
    setTab("details");
    setNote(getNote(achievementId));
    fetchAchievement(achievementId)
      .then(setAchievement)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [achievementId]);

  useEffect(() => {
    if ((tab === "strategy" || tab === "community") && achievementId && help?.achievementId !== achievementId) {
      setHelpLoading(true);
      fetchHelp(achievementId)
        .then(setHelp)
        .catch(() => setHelp({ achievementId, strategy: [], comments: [], sources: [] }))
        .finally(() => setHelpLoading(false));
    }
  }, [tab, achievementId]);

  if (!achievementId) return null;

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {loading && <p className="text-muted">Loading...</p>}
          {error && <p className="text-danger">{error}</p>}
          {achievement && (
            <>
              <AchievementIcon src={achievement.icon} size={56} />
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: "var(--text)" }}>{achievement.name}</h2>
                <p style={{ margin: "4px 0 0", color: "var(--accent)" }}>{achievement.points} points</p>
              </div>
            </>
          )}
        </div>
        {onTogglePin && <button className="btn btn-ghost" onClick={onTogglePin} title={isPinned ? "Unpin" : "Pin"} style={{ padding: "4px 8px" }}>{isPinned ? "📌" : "📍"}</button>}
        <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 18, padding: "4px 8px" }}>×</button>
      </div>

      {achievement && (
        <>
          <div className="tabs">
            {(["details", "strategy", "community"] as Tab[]).map((t) => (
              <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {tab === "details" && (
              <>
                <p style={{ color: "var(--text)", margin: "0 0 12px" }}>{achievement.description}</p>
                {achievement.isAccountWide && <p className="badge badge-success" style={{ marginBottom: 12 }}>Account-wide</p>}
                {achievement.childAchievements && achievement.childAchievements.length > 0 && (
                  <>
                    <h4 style={{ margin: "0 0 8px", color: "var(--muted)" }}>Sub-achievements</h4>
                    <div style={{ marginBottom: 16 }}>
                      {achievement.childAchievements.map((child) => {
                        const isCompleted = completedIds?.has(child.id);
                        return (
                          <button
                            key={child.id}
                            onClick={() => onSelectAchievement?.(child.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              width: "100%",
                              padding: "6px 0",
                              border: "none",
                              background: "transparent",
                              color: "var(--text)",
                              cursor: onSelectAchievement ? "pointer" : "default",
                              textAlign: "left",
                            }}
                          >
                            <span style={{ color: isCompleted ? "var(--success)" : "var(--muted)", fontSize: 14 }}>
                              {isCompleted ? "✓" : "○"}
                            </span>
                            <span>{child.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                {achievement.criteria.length > 0 && (
                  <>
                    <h4 style={{ margin: "0 0 8px", color: "var(--muted)" }}>Criteria</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text)" }}>
                      {achievement.criteria.map((c) => <li key={c.id}>{c.description}</li>)}
                    </ul>
                  </>
                )}
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ margin: "0 0 8px", color: "var(--muted)" }}>Notes</h4>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => achievementId && saveNote(achievementId, note)}
                    placeholder="Add personal notes..."
                    className="input"
                    style={{ width: "100%", minHeight: 60, resize: "vertical" }}
                  />
                </div>
              </>
            )}

            {tab === "strategy" && (
              <>
                {helpLoading && <p className="text-muted">Loading strategy...</p>}
                {!helpLoading && help?.strategy.length === 0 && <p className="text-muted">No strategy guides available.</p>}
                {help?.strategy.map((s, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <h4 style={{ margin: "0 0 8px", color: "var(--text)" }}>{s.title}</h4>
                    <ol style={{ margin: 0, paddingLeft: 20, color: "var(--muted)" }}>
                      {s.steps.map((step, j) => <li key={j}>{step}</li>)}
                    </ol>
                  </div>
                ))}
                {help?.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 12 }}>
                    View on {s.name} →
                  </a>
                ))}
              </>
            )}

            {tab === "community" && (
              <>
                {helpLoading && <p className="text-muted">Loading comments...</p>}
                {!helpLoading && help?.comments.length === 0 && <p className="text-muted">No community comments available.</p>}
                {help?.comments.map((c, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: 10, background: "var(--panel-2)", borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                      {c.author} {c.score !== null && <span>• {c.score > 0 ? "+" : ""}{c.score}</span>}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", color: "var(--text)", fontSize: 13 }}>{c.text}</div>
                  </div>
                ))}
                {help?.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 12 }}>
                    View on {s.name} →
                  </a>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
