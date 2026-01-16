import type { AchievementSummary } from "../lib/api";

type Props = {
  achievements: AchievementSummary[];
  completedIds?: Set<number>;
  completedAt?: Record<number, number>;
  characterName?: string;
};

export function ExportButtons({ achievements, completedIds, completedAt, characterName }: Props) {
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleExport = () => {
    if (!completedIds || completedIds.size === 0) {
      alert("No completed achievements to export");
      return;
    }

    const completed = achievements.filter((a) => completedIds.has(a.id));
    const rows = [["Name", "Points", "Completed Date", "Category ID"]];
    
    for (const a of completed) {
      const date = completedAt?.[a.id] ? new Date(completedAt[a.id]).toISOString().split("T")[0] : "";
      rows.push([a.name, String(a.points || 0), date, String(a.categoryId)]);
    }

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `achievements-${characterName || "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button className="btn btn-ghost" onClick={handleShare} title="Copy link">📋</button>
      <button className="btn btn-ghost" onClick={handleExport} title="Export CSV">📥</button>
    </div>
  );
}
