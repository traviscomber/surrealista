export function MessagesTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="h-10 border-b bg-muted/30"></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center p-4 border-b last:border-0">
          <div className="h-4 w-4 rounded bg-muted mr-4"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-[180px] bg-muted rounded"></div>
            <div className="h-3 w-[120px] bg-muted rounded"></div>
          </div>
          <div className="h-4 w-[200px] bg-muted rounded mx-4"></div>
          <div className="h-4 w-[100px] bg-muted rounded mx-4"></div>
          <div className="h-4 w-[80px] bg-muted rounded mx-4"></div>
          <div className="h-4 w-[100px] bg-muted rounded mx-4"></div>
          <div className="h-8 w-8 bg-muted rounded-full ml-4"></div>
        </div>
      ))}
    </div>
  )
}
