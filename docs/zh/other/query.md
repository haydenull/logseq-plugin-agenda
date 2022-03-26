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

## 从默认 journal 日历中排除指定页面

默认 journal 日历会在所有笔记中查询符合条件的任务, 但是可以通过配置 query script 排除指定页面.

假如我们希望 journal 日历不显示 `your project` 页面的任务.

只需要将以下代码添加到 query 1 2 4 的 script 中：
```clojure
  [?page :block/name ?pname]
  [?block :block/page ?page]
  (not [(contains? #{"your project"} ?pname)])
```

例如 query 1 原本的 script 为：
```clojure
[:find (pull ?block [*])
  :where
  [?block :block/marker ?marker]
  [(missing? $ ?block :block/deadline)]
  (not [(missing? $ ?block :block/scheduled)])
  [(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
```

修改后的 script 为：
```clojure{6-8}
[:find (pull ?block [*])
  :where
  [?block :block/marker ?marker]
  [(missing? $ ?block :block/deadline)]
  (not [(missing? $ ?block :block/scheduled)])
  [?page :block/name ?pname]
  [?block :block/page ?page]
  (not [(contains? #{"your project"} ?pname)])
  [(contains? #{"TODO" "DOING" "NOW" "LATER" "WAITING" "DONE"} ?marker)]]
```