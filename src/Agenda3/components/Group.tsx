import { type AgendaEntity } from '@/types/entity'

const Group = ({ task, type }: { task: AgendaEntity; type: 'page' | 'filter' }) => {
  return type === 'page' ? <RenderPage task={task} /> : <RenderFilter task={task} />
}

function RenderPage({ task }: { task: AgendaEntity }) {
  return (
    <>
      {task.project.isJournal ? null : (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.project.bgColor }} />
          <span>{task.project?.originalName}</span>
        </div>
      )}
    </>
  )
}

function RenderFilter({ task }: { task: AgendaEntity }) {
  return (
    <div className="flex items-center gap-2">
      {task.filters?.map((filter) => (
        <div key={filter.id} className="flex items-center gap-1 rounded-full border px-1 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: filter.color }} />
          <span>{filter.name}</span>
        </div>
      ))}
    </div>
  )
}

export default Group
