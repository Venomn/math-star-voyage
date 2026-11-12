# 星际数学 · 星海航行

[打开游戏](https://venomn.github.io/math-star-voyage/)

Godot 4.4.1 的 3D 数学探索游戏。孩子在知识星球完成挑战，获得能量，驾驶飞船跃迁到新的星系；遇到困难可以向三三提问。

## 已实现

- 4 个恒星系、20 个基础知识主题，真实 3D 行星、轨道、行星环和飞船。
- 确定性答案批改，提示题不计入独立掌握，3 道不同题目独立答对点亮星球。
- 首次通关奖励 3 点能量；首次访问星系消耗 3 点，返航免费。
- 本地学习存档，刷新恢复；轻量知识图谱与 3D 航行读取同一份进度。
- GitHub Pages 前端 + AWS API Gateway/Lambda/DynamoDB + 既有 AgentCore Runtime 在线辅导。

## 操作

拖动旋转、滚轮缩放；点击知识星球的标签，再点击降落挑战。点击驾驶飞船后使用 W/S 前后推进、A/D 转向，方向键也可用。手机提供触屏按钮。

## 云端问答

浏览器自动获得短期访客凭证，无需孩子填写姓名或注册。服务端生成身份和 Runtime 会话；访客只能读取或停止自己的任务。API Gateway 的可信来源 IP 用于限流，客户端传入的身份、原始请求头和 Runtime ID 不作为授权依据。

问题异步提交，页面轮询结果，不受模型调用超过 API Gateway 30 秒上限的影响。重复 requestId 幂等，取消先于提交时写入取消标记，迟到结果不能覆盖取消。后台最多同时持有 3 个 Runtime 槽位，完成后请求停止会话；未确认清理时不释放槽位，定时任务继续回收。

当前试运行额度：全站每天 200 次、每个来源 IP 每天 40 次、每个访客每天 20 次；取消和失败请求也计入已提交次数，避免反复启动绕过额度。访客凭证有效期 24 小时。问题由 AWS 和 AgentCore 配置的模型服务处理，不要发送姓名、联系方式等个人信息。应用日志不记录问题和回答；短期任务回答保存在加密 DynamoDB 中，配置 24 小时 TTL（AWS 删除可能延迟），请求正文在完成时移除。

这是公开访客试玩服务，不等同于实名账户系统；跨设备学习记录同步尚未实现。核心学习进度仍保存在当前浏览器。

## 开发与发布

```sh
npm test
npm run build:godot
npm start
```

构建 Godot 需要本机安装 4.4.1 及 Web 导出模板。构建脚本将引擎压缩为约 9 MB，浏览器解压加载。原生 Godot 编辑器只显示 3D 场景，完整学习界面通过 Web 导出与 HTML 集成。

推送 `main` 后，GitHub Actions 运行学习逻辑测试并发布 `dist/` 到 Pages。

云端源码在 `cloud/`。`cloud/build.mjs` 从前端同一题库生成服务端知识上下文；`cloud/package.py` 打包代码及本机已安装的 boto3；`cloud/deploy.py` 将专用资源交给 CloudFormation 管理。部署时通过环境变量 `DEPLOY_RUNTIME_ARN` 指定既有 Runtime。AWS 凭证仅使用本机 SDK 凭证链或 Lambda 执行角色，不进入前端或仓库。

```sh
node cloud/build.mjs
python3 -m unittest discover -s cloud -p 'test_*.py'
python3 cloud/package.py
# 已登录 AWS 且已设置 DEPLOY_RUNTIME_ARN 后：
python3 cloud/deploy.py
```

`dist/cloud-config.json` 只保存公开 API 地址，不包含凭证。AWS 部署独立于 Pages 工作流，发布前应执行真实的身份隔离、取消和问答验证。

## 范围与素材

本版是基础知识游戏原型，不是完整中考题型或能力认证；证明、作图和复杂综合题仍待补充。无工厂建造、无缝行星地表登陆或多人世界。

三三素材来自用户指定的 [Trio Mate 官网](https://www.triomate.ai/)。Godot 引擎使用 MIT 许可，完整许可见 `dist/GODOT-LICENSE.txt`；角色素材不因此被重新许可。
