import { useAtom } from 'jotai'
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import { type App, appAtom } from '@/Agenda3/models/app'
import { cn } from '@/util/util'

import Backlog from './Backlog'
import ObjectiveBoard from './ObjectiveBoard'
import TimeBox from './timebox/TimeBox'

const Sidebar = () => {
  const [app, setApp] = useAtom(appAtom)

  return (
    <div className={cn('transition-all group/sidebar relative', app.rightSidebarFolded ? 'w-0' : 'w-[290px]')}>
      <SidebarContent sidebarType={app.sidebarType} />
      {/* folded option bar */}
      <div className="w-[16px] h-full absolute -left-[16px] top-0 flex items-center z-10 opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
        <div
          className="bg-[#f0f0f0] h-[50px] w-full rounded-tl rounded-bl flex items-center text-gray-400 hover:bg-gray-200 cursor-pointer border-l border-t border-b"
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
