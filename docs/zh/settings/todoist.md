# Todoist

拉取 Todoist 数据到 logseq, 并使他们之间保持同步.

## API Token

::: warning
这个 API 密钥可以完全访问你的 Todoist 账户。不要泄漏。
:::

可以从 [integrations](https://todoist.com/app/settings/integrations) 页面获取 API Token.

## Sync

同步哪些数据

| 类型                       | 详情                                       |
| :------------------------- | :----------------------------------------- |
| All Todoist Projects       | 同步所有 Todoist 的任务到 logseq           |
| A Specific Todoist Project | 只同步你选中的 Todoist 项目的任务到 logseq |
| A Specific Todoist Filter  | 只同步符合过滤器的 Todoist 任务到 logseq   |

## Todoist filter

::: tip
当 Sync 设置为 `A Specific Todoist Filter` 时可用.
:::

填入一个搜索语句, 使用 [Todoist Filters](https://todoist.com/help/articles/introduction-to-filters) 语法.

For example, using GTD and a work parent project, you may have the following filter.

```
##Work & @next
```

## Todoist Project

::: tip
当 Sync 设置为 `All Todoist Projects` 时可用.
:::

在 logseq 中创建任务并 `Upload to todoist` 时, 会将此任务上传到 Todoist 下这个选项所指定的项目中.

## Todoist project for new logseq events

::: tip
当 Sync 设置为 `A Specific Todoist Project` 时可用.
:::

与 [Todoist Project](#todoist-project) 类似.

该选项指定了哪个 Todoist 项目下的任务需要同步, 以及当在 logseq 中创建任务并上传时, 需要上传到 Todoist 哪个项目里.

## Todoist label for new logseq events

在 logseq 中新建的任务, 上传到 Todoist 时, 设置为什么标签

## Logseq block position

拉取 Todoist 任务后, 存放到 logseq 指定的 page 中.