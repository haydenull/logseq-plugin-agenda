# Common custom calendar

::: tip
Common custom calendar is a calendar that collects events based on query and displays them on the calendar.
:::

When we create a custom calendar, the behavior is the same as the default journal calendar, but the search scope is the page specified by the custom calendar ID.

> The query of all calendars is open and modifiable, and you can customize it according to your needs.

So how to create a custom calendar?

Click the add calendar button, and fill in the calendar name, and edit [query](https://logseq.github.io/#/page/Queries).

The plugin will call [logseq.DB.datascriptQuery](https://logseq.github.io/plugins/interfaces/IDBProxy.html#datascriptQuery) or [logseq.DB.q](https://logseq.github.io/plugins/interfaces/IDBProxy.html#q) API with the query you specified. and the result will be displayed in the calendar.

Let me explain what the configuration items are:
1. `script`: As a parameter to datascriptQuery, query all block that meets the requirements.
2. `query type`: The type of query, can be [Simple Query](https://logseq.github.io/#/page/Queries) or [Advanced Query](https://logseq.github.io/#/page/AdvancedQueries).
2. `schedule start`: Take the field specified by `schedule start` from the block of the datascriptQuery query as the event start time.
3. `schedule end`: Take the field specified by `schedule end` from the block of the datascriptQuery query as the event end time.
4. `date formatter`: The date formatter. Use this as [date-fns](https://date-fns.org/v2.28.0/docs/parse) parameter to convert `schedule start` `schedule end` to an available date.
5. `is milestone`: Whether the block is a milestone. If it is, the block will be displayed in the calendar as a milestone.

If you don't konw how to fill `schedule start` `schedule end`, you can open DevTools and click the play button:

![queryDebug](../../screenshots/queryDebug.png)

## Example:

Currently we have a test-agenda note:

where the custom calendar demo has the `start` `end` attribute, we want it to be displayed in the calendar and the common text is not.

![test-agenda](../../screenshots/test-agenda.png)

### Use [Simple Query](https://logseq.github.io/#/page/Queries)

We use the following query script to query the block located in the test-agenda page:

`(and (page "test-agenda") (property end) (property start))`

![customQuerySimple](../../screenshots/customQuerySimple.png)

### Use [Advanced Query](https://logseq.github.io/#/page/advanced%20queries)

If you want to use the advanced query, you can use the following script:

```clojure
[:find (pull ?block [*])
  :where
  [?block :block/properties ?p]
  [(get ?p :start) ?s]
  [(get ?p :end) ?e]
  [?page :block/name ?pname]
  [?block :block/page ?page]
  [(contains? #{"test-agenda"} ?pname)]]
```

The complete configuration is as follows:

![customQuery](../../screenshots/customQuery.png)

The above two methods are equivalent .The following will appear:

![customCalendar](../../screenshots/customQueryCalendar.png)
