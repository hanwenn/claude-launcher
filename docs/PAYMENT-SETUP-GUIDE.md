# 支付开通指南（5分钟完成）

## 推荐：LemonSqueezy（无需营业执照，全球收款）

### 步骤 1：注册（2分钟）
1. 打开 https://app.lemonsqueezy.com/register
2. 用 Google 或邮箱注册
3. 填写 Store Name: "LaunchPad AI"

### 步骤 2：创建产品（2分钟）
1. 左侧菜单 → Products → New Product
2. 填写：
   - Name: `Claude Launcher Pro`
   - Description: `Unlock 8 terminal panes, 5 themes, command palette, and priority support. One-time purchase.`
   - Price: `$19` (One-time)
   - Category: Software
3. 点击 Publish

### 步骤 3：获取购买链接
1. 进入刚创建的产品页
2. 复制 "Share" 链接，格式类似：`https://launchpad-ai.lemonsqueezy.com/buy/xxx`
3. 这就是支付链接

### 步骤 4：替换项目中的占位链接
在以下两个文件中搜索 `lemonsqueezy.com/checkout` 并替换为你的真实链接：

1. `docs/index.html` — 落地页的 "Get Pro" 按钮
2. `src/components/UpgradePrompt.tsx` — 应用内的 "Buy Now" 按钮

然后：
```bash
cd D:\GuanZheAssistant
npx vite build
git add -A && git commit -m "feat: add payment link" && git push
```

### 步骤 5：配置 Webhook（可选，用于自动发放 License Key）
1. Settings → Webhooks → Add Endpoint
2. URL: 你的服务器地址（后续配置）
3. 暂时可以手动发放 License Key

### 手动发放 License Key
当收到付款通知后，生成一个 `CL-XXXX-XXXX-XXXX` 格式的 key 发给用户。
用户在应用内的 Upgrade 弹窗中输入即可激活。

---

## 备选：Gumroad

1. 注册 https://gumroad.com
2. 创建产品，价格 $19
3. 获取链接替换同上

## 备选：Buy Me a Coffee（最简单，但不适合软件销售）

仅作为捐赠渠道补充，不作为主要收入来源。
