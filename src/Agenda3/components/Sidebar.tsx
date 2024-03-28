import { useAtom } from 'jotai'
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import { type App, appAtom } from '@/Agenda3/models/app'
import { cn } from '@/util/util'

import Backlog from './Backlog'
import ObjectiveBoard from './objectiveBoard/ObjectiveBoard'
import TimeBox from './timebox/TimeBox'

const Sidebar = () => {
  const [app, setApp] = useAtom(appAtom)

  return (
    <div className={cn('group/sidebar relative transition-all', app.rightSidebarFolded ? 'w-0' : 'w-[290px]')}>
      <SidebarContent sidebarType={app.sidebarType} />
      {/* folded option bar */}
      <div className="absolute -left-[16px] top-0 z-10 flex h-full w-[16px] items-center opacity-0 transition-opacity group-hover/sidebar:opacity-100">
        <div
          className="flex h-[50px] w-full cursor-pointer items-center rounded-bl rounded-tl border-b border-l border-t bg-[#f0f0f0] text-gray-400 hover:bg-gray-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          onClick={() => setApp((_app) => ({ ..._app, rightSidebarFolded: !_app.rightSidebarFolded }))}
        >
          {app.rightSidebarFolded ? <AiOutlineLeft /> : <AiOutlineRight />}
        </div>
      </div>
    </div>
  )
}

function SidebarContent({ sidebarType }: { sidebarType: App['sidebarType'] }) {
  switch (sidebarType) {
    case 'backlog':
      return <Backlog />
    case 'timebox':
      return <TimeBox onChangeType={() => {}} />
    case 'objective':
      return <ObjectiveBoard />
    default:
      return null
  }
}

export default Sidebar
