import ListCard from "./ListCard"
import type { List } from "../../stores/listStore"

type ListGridProps = {
  lists: List[]
  onCreate?: () => void
  selectable?: boolean
  selectedIds?: string[]
  onToggleSelect?: (listId: string) => void
}

export default function ListGrid({
  lists,
  onCreate,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
}: ListGridProps) {
  if (!lists.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="text-base text-white/70">No lists found</p>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-400/70 hover:bg-amber-400/20"
          >
            Create List
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(1,minmax(0,1fr))] sm:[grid-template-columns:repeat(2,minmax(0,1fr))] md:[grid-template-columns:repeat(3,minmax(0,1fr))] xl:[grid-template-columns:repeat(4,minmax(0,1fr))]">
      {lists.map((list) => (
        <ListCard
          key={list.id}
          list={list}
          selectable={selectable}
          selected={selectedIds.includes(list.id)}
          onSelectToggle={onToggleSelect}
        />
      ))}
    </div>
  )
}
