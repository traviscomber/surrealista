export function MessageDetailSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-6 w-[250px] bg-muted rounded"></div>
            <div className="h-4 w-[180px] bg-muted rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded"></div>
            <div className="h-6 w-20 bg-muted rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="h-5 w-[200px] bg-muted rounded"></div>
          <div className="h-5 w-[200px] bg-muted rounded"></div>
        </div>

        <div className="h-px w-full bg-muted my-4"></div>

        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-3/4 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  )
}
