import { render, fireEvent, waitForElementToBeRemoved, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import TaskListApp from '../TaskListApp'

describe('Sidebar App', () => {
  const containerId = 'agenda-task-list-my-test-slot'

  // beforeEach(() => {
  //   vi.mock('logseq', () => {
  //     return {
  //       DB: {
  //         datascriptQuery: () => Promise.resolve([]),
  //         onChanged: (callback) => void 0,
  //         getCurrentPage: () => Promise.resolve({}),
  //       },
  //     }
  //   })
  // })

  test('should render', async () => {
    const sidebarApp = render(<TaskListApp containerId={containerId} />)
    // expect(sidebarApp).toMatchSnapshot()
    expect(sidebarApp).toBeTruthy()
  })

  // test('should show overdue tasks in today', async () => {
  //   render(<TaskListApp containerId={containerId} />)
  //   // wait data loaded
  //   // screen.debug()
  //   await waitForElementToBeRemoved(() => screen.getByText('No tasks found, enjoy your day'), { timeout: 1000 })
  //   expect(screen.getByText('overdue task')).toBeInTheDocument()
  // })
})
