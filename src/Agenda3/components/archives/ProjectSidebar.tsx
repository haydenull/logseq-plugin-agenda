import { IoAddOutline } from 'react-icons/io5'

import { cn } from '@/util/util'

const ProjectSidebar = ({ className }: { className?: string }) => {
  return (
    <div className={cn('w-[290px] border-r h-full overflow-auto px-2.5 py-1', className)}>
      <div className="mb-4">
        <h1 className="border-b mb-1 pb-1 flex justify-between items-center text-sm text-gray-400">
          Favorite Projects
          <IoAddOutline />
        </h1>
        <div>
          <div className="py-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>project 1
          </div>
          <div className="py-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>project 2
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h1 className="border-b mb-1 pb-1 flex justify-between items-center text-sm text-gray-400">
          Subscriptions
          <IoAddOutline />
        </h1>
        <div>
          <div className="py-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>subscription 1
          </div>
          <div className="py-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>subscription 2
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h1 className="border-b mb-1 pb-1 flex justify-between items-center text-sm text-gray-400">
          Query Calendars
          <IoAddOutline />
        </h1>
        <div>
          <div className="py-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>query 1
          </div>
          <div className="py-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>query 2
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectSidebar
