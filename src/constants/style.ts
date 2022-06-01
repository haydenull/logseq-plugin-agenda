export const LOGSEQ_PROVIDE_COMMON_STYLE = `
  .external-link[href^="#agenda://"]::before {
    content: '📅';
    margin: 0 4px;
  }
  .agenda-sidebar-task__add {
    display: none;
  }
  .agenda-sidebar-task:hover .agenda-sidebar-task__add {
    display: flex;
  }
`