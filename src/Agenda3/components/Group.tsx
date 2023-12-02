import { type AgendaTask } from '@/types/task'

const Group = ({ task, type }: { task: AgendaTask; type: 'page' | 'filter' }) => {
  return type === 'page' ? <RenderPage task={task} /> : <RenderFilter task={task} />
}

function RenderPage({ task }: { task: AgendaTask }) {
  return (
    <>
      {task.project.isJournal ? null : (
        <div className="text-gray-400 text-xs flex gap-1 items-center">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.bgColor }} />
          <span>{task.project?.originalName}</span>
        </div>
      )}
    </>
  )
}

function RenderFilter({ task }: { task: AgendaTask }) {
  return (
    <div className="flex gap-2 items-center">
      {task.filters?.map((filter) => (
        <div key={filter.id} className="text-gray-400 text-xs flex gap-1 items-center border px-1 rounded-full">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: filter.color }} />
          <span>{filter.name}</span>
        </div>
      ))}
    </div>
  )
}

export default Group
