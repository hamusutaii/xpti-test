# Google Sheets + Apps Script 统计接入

这套前端已经内置了埋点发送逻辑，当前缺的只是一个接收端和一个你自己能打开的统计后台。

## 你会得到什么

- 开始答题人数
- 完成答题人数
- 完成率
- 主类型分布
- 每题四个选项的最终选择分布
- 复制结果、生成结果图、下载结果图次数

## 第一步：创建统计表

1. 新建一个 Google Sheet。
2. 打开后进入 `扩展程序 -> Apps Script`。
3. 删除默认 `Code.gs` 内容。
4. 把项目里的 [analytics-apps-script.gs](/D:/vibecodingtraining/weixinxp/analytics-apps-script.gs) 全部复制进去。
5. 保存。

## 第二步：初始化表结构

1. 在 Apps Script 顶部函数下拉框里选择 `setupSheets`。
2. 点击运行。
3. 第一次会要求授权，按提示完成。
4. 回到 Google Sheet，会看到这些工作表：
   - `Overview`
   - `ArchetypeStats`
   - `QuestionStats`
   - `Events`
   - `Completions`

## 第三步：部署成 Web App

1. 在 Apps Script 右上角点击 `部署 -> 新建部署`。
2. 类型选择 `Web 应用`。
3. `执行身份` 选 `我自己`。
4. `谁可以访问` 选 `任何人`。
5. 部署后复制 `Web 应用 URL`。

这个 URL 就是前端要填的 `collectEndpoint`。

## 第四步：把地址填回前端

打开 [data.js](/D:/vibecodingtraining/weixinxp/data.js)，把 `analyticsConfig` 改成这样：

```javascript
const analyticsConfig = {
  enabled: true,
  siteId: "xpti-test",
  transport: "apps-script",
  collectEndpoint: "你的 Web 应用 URL",
  dashboardUrl: "你的 Google Sheet 地址",
  adminQuery: "admin=1"
};
```

说明：

- `collectEndpoint`：Apps Script 的 Web App 地址
- `dashboardUrl`：Google Sheet 地址
- `transport: "apps-script"`：这是为了适配浏览器到 Apps Script 的跨域发送方式

## 第五步：怎么看后台

配置好以后，用这个地址打开你的网站：

[https://hamusutaii.github.io/xpti-test/?admin=1](https://hamusutaii.github.io/xpti-test/?admin=1)

右上角会出现 `统计后台` 链接，点击就会跳到你的 Google Sheet。

## 统计表怎么看

### `Overview`

- 开始答题人数
- 完成答题人数
- 完成率
- 复制结果次数
- 生成结果图次数
- 下载结果图次数

### `ArchetypeStats`

- 每个主类型的完成人数
- 每个主类型占总完成数的比例

### `QuestionStats`

- 每道题 A/B/C/D 的人数
- 每个选项占总完成数的比例

### `Events`

- 原始事件流
- 适合排查埋点有没有发送成功

### `Completions`

- 每个完成答题会保存一行
- 包含主类型、匹配类型、八维分数、20 道题最终答案

## 后续维护

如果你改了题目数量：

1. 先同步改前端题目数。
2. 再把 [analytics-apps-script.gs](/D:/vibecodingtraining/weixinxp/analytics-apps-script.gs) 里的 `QUESTION_COUNT` 改掉。
3. 重新在 Apps Script 中运行一次 `setupSheets` 和 `rebuildDashboard`。

## 一个重要说明

这套统计默认记录的是：

- 会话 ID
- 事件类型
- 结果类型
- 分数和选项

它不会自动识别真实姓名、微信号、手机号之类的身份信息。  
如果你以后要做“谁做了题”的实名统计，那就不再是纯匿名分析了，需要额外设计登录或填写表单的流程。
