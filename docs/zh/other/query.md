# Query 示例

## 使用日期替代 scheduled

[issue19](https://github.com/haydenull/logseq-plugin-agenda/issues/19)

笔记如下:

![](../../../screenshots/otherQuery1.png)

配置如下:

Query Script:
```clojure
[:find (pull
  ?block
  [:block/uuid
    :block/parent
    :db/id
    :block/left
    :block/collapsed?
    :block/format
    :block/_refs
    :block/path-refs
    :block/tags
    :block/content
    :block/marker
    :block/priority
    :block/properties
    :block/pre-block?
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/created-at
    :block/updated-at
    :block/file
    :block/heading-level
    {:block/page
      [:db/id :block/name :block/original-name :block/journal-day :block/journal?]}
    {:block/refs
      [:block/journal-day]}])
  :where
  [?block :block/marker ?marker]
  [?rp :block/journal? true]
  [?block :block/refs ?rp]
  [(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
```

Schedule Start:
`refs[0].journal-day`

Date Formatter:
`yyyyMMdd`

![](../../../screenshots//otherQuery2.png)

日历:
![](../../../screenshots//otherQuery3.png)