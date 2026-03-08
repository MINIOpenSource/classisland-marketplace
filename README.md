# ClassIsland 插件市场 (Marketplace)

一个用于 ClassIsland 插件的网页端插件市场预览与下载平台。基于 Next.js 开发，为发现和下载 ClassIsland 插件提供现代化、响应式的用户界面。

> 项目生成由：
>
> - Gemini 3.1 Pro
> - Gemini 3 Flash
> - Claude Opus 4.6
> - ChatGPT 5.3 Codex
>
> 以及 Google Antigravity 与 Codex CLI 驱动。

## 核心特性

- **卡片式布局**：动态流式布局，提供响应式、美观的插件浏览体验。
- **Fluent UI 设计**：深度集成微软 Fluent UI 设计系统，实现与 Windows 环境原生且一致的视觉效果，包含大量如亚克力高斯模糊、悬浮动画等视觉特效。
- **动态插件数据**：实时从 GitHub 的 ClassIsland PluginIndex 仓库拉取最新插件清单和数据模型。
- **跨平台交付**：智能识别用户操作系统，根据是否原生支持 `.cipx` 格式提供“安装”或“下载”等不同交互。
- **Markdown 预览**：集成 `@uiw/react-markdown-preview`，直接富文本渲染插件详细说明。
- **本地化与多语言**：支持多种语言，并在底栏提供构建信息总览（点击时间可切换绝对时间/相对时间）。

## 技术栈

- Next.js (React)
- Fluent UI React Components
- TypeScript
- Tailwind CSS

## 部署与服务器配置

如果你使用 Vercel 或 Cloudflare Pages 部署，平台会自动处理 Next.js 静态导出的路由问题。如果你在自己的服务器（如 Nginx、OpenResty）上使用 `out` 静态导出目录进行部署，除 `/` 外的所有页面（如 `/about`）会报 `403` 或 `404` 错误，因为服务器默认不会为 `/about` 路由寻找 `/about.html`。

此时，**你需要配置伪静态（URL Rewrite）**。对于 Nginx / OpenResty，建议在对应站点的配置文件中添加以下规则。这不仅能处理无后缀名的 HTML 路由，还能确保不带后缀名的 SVG 动态图像能够以正确的 MIME 类型被浏览器识别：

```nginx
location / {
    # 尝试匹配 $uri, $uri.html 以及 $uri/
    # 对于 Next.js 静态导出的 /about 路由，它会查找 /about.html
    try_files $uri $uri.html $uri/ /index.html;
}

# 针对 SVG 动态卡片路由的特殊处理
location /svg/plugin/ {
    # 强制指定 MIME 类型，防止不带后缀名的文件被识别为二进制流
    default_type image/svg+xml;
    # 尝试匹配无后缀文件，同时支持带 .svg 后缀访问的伪静态重写（可选）
    rewrite ^/svg/plugin/(.*)\.svg$ /svg/plugin/$1 break;
    try_files $uri $uri.html =404;
}
```

## 开始使用

1. 克隆此仓库。
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
4. 打开 [http://localhost:3000](http://localhost:3000) 即可预览。
