export default function SearchLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded-xl" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-muted rounded-full" />
        <div className="h-8 w-24 bg-muted rounded-full" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-xl" />
      ))}
    </div>
  )
}
