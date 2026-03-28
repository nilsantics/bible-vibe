export default function ProgressLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-muted rounded" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>

      {/* XP bar */}
      <div className="h-20 bg-muted rounded-xl" />

      {/* Badges */}
      <div className="h-6 w-28 bg-muted rounded" />
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>

      {/* Book list */}
      <div className="h-6 w-36 bg-muted rounded" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-8 bg-muted rounded" />
      ))}
    </div>
  )
}
