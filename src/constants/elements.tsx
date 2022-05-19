import { MdOutlineDashboard, MdLineStyle, MdOutlineClearAll } from 'react-icons/md'
import { BiTask } from 'react-icons/bi'
import { IoCalendarOutline, IoSettings, IoJournalOutline } from 'react-icons/io5'
import { RiBarChartHorizontalFill, RiMenu4Line, RiMenu2Line, RiTornadoLine } from 'react-icons/ri'
import { BsClipboardData } from 'react-icons/bs'
import { FaChartArea } from 'react-icons/fa'
import { AiOutlineAlignLeft, AiOutlineAlignRight, AiOutlineAlignCenter } from 'react-icons/ai'

import Dashboard from '@/pages/Dashboard'
import Tasks from '@/pages/Tasks'
import Calendar from '@/pages/Calendar'
import Gantt from '@/pages/Gantt'
import Timeline from '@/pages/Timeline'
import Board from '@/pages/Board'
import Stats from '@/pages/Stats'
import Settings from '@/pages/Settings'
import Journal from '@/pages/Journal'

export const MENUS = [
  { label: 'Dashboard', value: 'dashboard', icon: <MdOutlineDashboard />, path: '/dashboard', element: <Dashboard /> },
  // { label: 'Tasks', value: 'tasks', icon: <BiTask />, path: '/tasks', element: <Tasks /> },
  { label: 'Calendar', value: 'calendar', icon: <IoCalendarOutline />, path: '/calendar', element: <Calendar /> },
  { label: 'Gantt', value: 'gantt', icon: <AiOutlineAlignLeft />, path: '/gantt', element: <Gantt /> },
  { label: 'Timeline', value: 'timeline', icon: <RiMenu4Line />, path: '/timeline', element: <Timeline /> },
  // { label: 'Board', value: 'board', icon: <BsClipboardData />, path: '/board', element: <Board /> },
  // { label: 'Journal', value: 'journal', icon: <IoJournalOutline />, path: '/journal', element: <Journal /> },
  // { label: 'Stats', value: 'stats', icon: <FaChartArea />, path: '/stats', element: <Stats /> },
  { label: 'Settings', value: 'settings', icon: <IoSettings />, path: '/settings', element: <Settings /> },
]