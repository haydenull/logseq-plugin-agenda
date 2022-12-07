export const LOGSEQ_PROVIDE_COMMON_STYLE = `
  .external-link[href^="#agenda://"]::before {
    content: '📅';
    margin: 0 4px;
  }
  .agenda-sidebar-task__add {
    display: none;
  }
  .agenda-sidebar-task {
    padding: 5px 0;
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
    height: 1.5rem;
    width: 62px;
    line-height: 1.5rem;
    font-size: 14px;
    font-weight: 600;
    border-radius: 0.3rem;
    margin: 0 0.125rem;
    color: #cd3838;
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
    color: #0F9960;
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