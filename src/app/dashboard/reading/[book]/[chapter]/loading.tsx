export default function ReadingLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
      {/* Chapter header */}
      <div className="mb-10 text-center space-y-2">
        <div className="h-8 w-32 bg-muted rounded mx-auto" />
        <div className="h-4 w-20 bg-muted rounded mx-auto" />
      </div>

      {/* Verse skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded"
            style={{ width: `${70 + Math.sin(i * 1.7) * 25}%` }}
          />
        ))}
      </div>
    </div>
  )
}
