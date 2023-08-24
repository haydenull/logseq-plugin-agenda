export const LOGSEQ_PROVIDE_COMMON_STYLE = `
  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .external-link[href^="#agenda://"]::before {
    content: '📅';
    margin: 0 4px;
  }
  .agenda-sidebar-calendar {
    font-size: 14px;
    cursor: default;
    margin-bottom: 14px;
  }
  .agenda-sidebar-calendar__week-day--today {
    color: var(--ls-link-text-color);
    font-weight: 600;
  }
  .agenda-sidebar-calendar__number {
    width: 26px;
    height: 26px;
    border-radius: 100%;
    cursor: pointer;
    position: relative;
  }
  .agenda-sidebar-calendar__number--today {
    color: var(--ls-link-text-color);
    border: 1px solid var(--ls-link-text-color);
    box-sizing: border-box;
  }
  .agenda-sidebar-calendar__number--active {
    border: none;
    opacity: 0.9;
    color: #fff;
  }
  .agenda-sidebar-calendar__number--dot::after {
    content: '';
    display: block;
    width: 4px;
    height: 4px;
    border-radius: 100%;
    background: var(--ls-link-text-color);
    position: absolute;
    left: calc(50% - 2px);
    top: calc(100% + 2px);
  }
  .agenda-sidebar-task__add {
    display: none;
  }
  .agenda-sidebar-task {
    padding: 5px 8px 5px 0;
    border-radius: 4px;
  }
  .agenda-sidebar-task:hover {
    opacity: 1;
    background: var(--ls-tertiary-background-color);
  }
  .agenda-sidebar-task:hover .agenda-sidebar-task__add {
    display: flex;
  }
  .agenda-sidebar-task:hover .agenda-sidebar-task__title {
    color: var(--ls-link-text-color);
  }

  .external-link[href^="#agenda-pomo://"]::before {
    display: none;
  }
  .external-link[href^="#agenda-pomo://"] {
    font-weight: 600;
    border: 1px solid #0F9960;
    background: #defcf0;
    border-radius: 4px;
    padding: 1px 6px;
    color: #222;
    white-space: nowrap;
  }
  .dark .external-link[href^="#agenda-pomo://"] {
    background-color: #1a543b;
    color: #ddd;
  }

  .agenda-toolbar-pompdoro {
    display: block;
    height: 1.5rem;
    width: 62px;
    line-height: 1.5rem;
    font-size: 14px;
    font-weight: 600;
    border-radius: 0.3rem;
    margin: 0 0.125rem;
    color: #cd3838 !important;
    border: 1px solid #cd3838;
    text-align: center;
    position: relative;
  }
  .agenda-toolbar-pompdoro .timer-progress-back {
    width: 0;
    height: 100%;
    background: #f6dbdb;
    position: absolute;
    z-index: -1;
    left: 0;
    top: 0;
    transition: width 0.5s;
  }
  .dark .agenda-toolbar-pompdoro .timer-progress-back {
    background-color: #a69494;
  }
  .agenda-toolbar-pompdoro.break {
    color: #0F9960 !important;
    border-color: #0F9960;
  }
  .agenda-toolbar-pompdoro.break .timer-progress-back {
    background-color: #defcf0;
  }
  .dark .agenda-toolbar-pompdoro.break .timer-progress-back {
    background-color: #1a543b;
  }
  .agenda-toolbar-pompdoro.hide {
    display: none;
  }
`

export const DEFAULT_CALENDAR_STYLE = {
  bgColor: '#b8e986',
  textColor: '#4a4a4a',
  borderColor: '#047857',
}
