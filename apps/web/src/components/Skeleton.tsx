import "./Skeleton.css";

export function SkeletonBox({ width, height, style }: { width?: string | number; height?: string | number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonText({ width = "100%", height = 14, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return <SkeletonBox width={width} height={height} style={{ borderRadius: 4, ...style }} />;
}

export function SkeletonCircle({ size = 20 }: { size?: number }) {
  return <SkeletonBox width={size} height={size} style={{ borderRadius: "50%" }} />;
}

export function AchievementListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div style={{ padding: "0" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <SkeletonBox width={20} height={20} style={{ borderRadius: 4 }} />
          <SkeletonCircle size={16} />
          <SkeletonText width={`${40 + Math.random() * 30}%`} />
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <SkeletonText width={40} />
            <SkeletonText width={20} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AchievementDrawerSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <SkeletonBox width={56} height={56} style={{ borderRadius: 6 }} />
        <div style={{ flex: 1 }}>
          <SkeletonText width="60%" height={18} />
          <SkeletonText width={80} height={14} style={{ marginTop: 8 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <SkeletonBox width={80} height={32} style={{ borderRadius: 4 }} />
        <SkeletonBox width={80} height={32} style={{ borderRadius: 4 }} />
        <SkeletonBox width={80} height={32} style={{ borderRadius: 4 }} />
      </div>
      <SkeletonText width="100%" height={14} />
      <SkeletonText width="90%" height={14} style={{ marginTop: 8 }} />
      <SkeletonText width="75%" height={14} style={{ marginTop: 8 }} />
      <div style={{ marginTop: 24 }}>
        <SkeletonText width={100} height={12} />
        <div style={{ marginTop: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <SkeletonCircle size={14} />
              <SkeletonText width={`${50 + Math.random() * 30}%`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
