import { MdOutlineDashboard, MdLineStyle } from 'react-icons/md'
import { BiTask } from 'react-icons/bi'
import { IoCalendarOutline, IoSettings } from 'react-icons/io5'
import { RiBarChartHorizontalFill } from 'react-icons/ri'
import { BsClipboardData } from 'react-icons/bs'
import { FaChartArea } from 'react-icons/fa'

import Dashboard from '@/pages/Dashboard'
import Tasks from '@/pages/Tasks'
import Calendar from '@/pages/Calendar'
import Gantt from '@/pages/Gantt'
import Timeline from '@/pages/Timeline'
import Board from '@/pages/Board'
import Stats from '@/pages/Stats'
import Settings from '@/pages/Settings'

export const MENUS = [
  { label: 'Dashboard', value: 'dashboard', icon: <MdOutlineDashboard />, path: '/dashboard', element: <Dashboard /> },
  { label: 'Tasks', value: 'tasks', icon: <BiTask />, path: '/tasks', element: <Tasks /> },
  { label: 'Calendar', value: 'calendar', icon: <IoCalendarOutline />, path: '/calendar', element: <Calendar /> },
  { label: 'Gantt', value: 'gantt', icon: <RiBarChartHorizontalFill />, path: '/gantt', element: <Gantt /> },
  { label: 'Timeline', value: 'timeline', icon: <MdLineStyle />, path: '/timeline', element: <Timeline /> },
  { label: 'Board', value: 'board', icon: <BsClipboardData />, path: '/board', element: <Board /> },
  { label: 'Stats', value: 'stats', icon: <FaChartArea />, path: '/stats', element: <Stats /> },
  { label: 'Settings', value: 'settings', icon: <IoSettings />, path: '/settings', element: <Settings /> },
]