export const LOGSEQ_PROVIDE_COMMON_STYLE = `
  .external-link[href^="#agenda://"]::before {
    content: '📅';
    margin: 0 4px;
  }
  .agenda-sidebar-task__add {
    display: none;
  }
  .agenda-sidebar-task:hover {
    opacity: 1;
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
    fonweight: bold;
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
    background: #f6dbdb;
    text-align: center;
  }
  .agenda-toolbar-pompdoro.break {
    color: #0F9960;
    border-color: #0F9960;
    background: #defcf0;
  }
`

export const DEFAULT_CALENDAR_STYLE = {
  bgColor: '#b8e986',
  textColor: '#4a4a4a',
  borderColor: '#047857',
}