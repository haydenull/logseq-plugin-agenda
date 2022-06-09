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
`

export const DEFAULT_CALENDAR_STYLE = {
  bgColor: '#b8e986',
  textColor: '#4a4a4a',
  borderColor: '#047857',
}