# Todoist

Todoist tasks can be synchonised into with Logseq graph using the following options.

## API Token

::: warning
This API key gives complete access to your Todoist account. Use at your own risk.
:::

Your API token can be fetch from your Todoist account using the [integrations](https://todoist.com/app/settings/integrations) configuration page.

Please copy your API key from here into the settings page.

## Sync


Two-way sync is availble once you have configured your API key as stated above.

The sync options are as follows:

| Option                     | Details                                                                                         |
| :------------------------- | :---------------------------------------------------------------------------------------------- |
| All Todoist Projects       | This will source all your Todoist tasks. Use this option if you want all your Todoist tasks to be synced with your Logseq graph.                                      |
| A Specific Todoist Project | Limit the scope of the sync to only include tasks in the project you have selected. Selecting this option will necessitate setting the project you wish to sync with. |
| A Specific Todoist Filter  | Limit the scope of the tasks that will be synced to only those tasks contained within a filter.                                                                       |

## Todoist filter

::: tip
Only available if you have set your sync option to `A Specific Todoist Filter`.
:::

This filter will be a search statement using the same syntax used in [Todoist Filters](https://todoist.com/help/articles/introduction-to-filters).

For example, using GTD and a work parent project, you may have the following filter.

```
##Work & @next
```

## Todoist Project

::: tip
Only available if you have set your sync option to `All Todoist Projects`.
:::

Any new tasks created within Logseq will be added to this Todoist project.

## Todoist project for new logseq events

::: tip
Only available if you have set your sync option to `A Specific Todoist Project`.
:::

Very similar to the [Todoist Project](#todoist-project) above. This is used to select the project we wish to sync with.

## Todoist label for new logseq events

The label you wish to have assigned to any new tasks created within Logseq.

## Logseq block position

The page to sync your events with.