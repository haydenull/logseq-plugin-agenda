import s from '../index.module.less'
import Task from './Task'
import { useAtom } from 'jotai'
import { todayTasksAtom } from '@/model/events'
import { categorizeSubscriptions, categorizeTasks } from '@/util/schedule'
import { todaySubscriptionSchedulesAtom } from '@/model/schedule'
import Subscription from './Subscription'

const TaskLines: React.FC<{}> = () => {
  const [todaySubscriptions] = useAtom(todaySubscriptionSchedulesAtom)
  const { allDaySubscriptions, timeSubscriptions } = categorizeSubscriptions(todaySubscriptions)
  const [todayTasks] = useAtom(todayTasksAtom)
  const { overdueTasks, allDayTasks, timeTasks } = categorizeTasks(todayTasks)

  return (
    <div className={s.taskLine}>
      {
        overdueTasks.length > 0 && (
          <div className={s.module}>
            <span>Overdue</span>
            {
              overdueTasks.map(task => (
                <Task key={task.id} task={task} type="overdue" />
              ))
            }
          </div>
        )
      }
      {
        (allDayTasks.length > 0 || allDaySubscriptions.length > 0) && (
          <div className={s.module}>
            <span>All Day</span>
            {
              allDaySubscriptions.map(subscription => (
                <Subscription key={subscription.id} subscription={subscription} type="allDay" />
              ))
            }
            {
              allDayTasks.map(task => (
                <Task key={task.id} task={task} type="allDay" />
              ))
            }
          </div>
        )
      }
      {
        (timeTasks.length > 0 || timeSubscriptions.length > 0) && (
          <div className={s.module}>
            <span>Time</span>
            {
              timeSubscriptions.map(subscription => (
                <Subscription key={subscription.id} subscription={subscription} type="time" showTimeDot />
              ))
            }
            {
              timeTasks.map(task => (
                <Task key={task.id} task={task} type="time" showTimeDot />
              ))
            }
          </div>
        )
      }
    </div>
  )
}

export default TaskLines
