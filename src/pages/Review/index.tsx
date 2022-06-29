import classNames from 'classnames'
import s from './index.module.less'
import SearchForm, { IReviewSearchForm } from './components/SearchForm'

const index = () => {
  // const [internalSchedules] = useAtom(fullCalendarSchedulesAtom)
  // const [subscriptionSchedules] = useAtom(subscriptionSchedulesAtom)
  // const [customCalendarSchedules, setCustomCalendarSchedules] = useState<any[]>([])

  const onSearch = (values: IReviewSearchForm) => {
    console.log('[faiz:] === values', values)
  }

  // useEffect(() => {
  //   getCustomCalendarSchedules()
  //     .then(res => {
  //       setCustomCalendarSchedules(res)
  //     })
  // }, [])

  return (
    <div className="page-container flex">
      <div className={classNames('flex flex-1 flex-col overflow-hidden p-8')}>
        <h1 className="title-text">Review</h1>
        <div className="bg-quaternary flex flex-col flex-1 rounded-2xl box-border p-6">
          <SearchForm onSearch={onSearch} />
          {/* <CalendarCom schedules={[...subscriptionSchedules, ...internalSchedules, ...customCalendarSchedules]} isProjectCalendar={false} /> */}
        </div>
      </div>
    </div>
  )
}

export default index
