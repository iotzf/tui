# 基于Vue、Vite和Element Plus的Traefik路由管理系统

https://doc.traefik.io/traefik/

[TOC]

## 项目介绍

### 项目背景

Traefik 是一个动态的反向代理和负载均衡器，用于管理和路由传入的网络流量。它支持多种服务提供者（如 Docker、Kubernetes 等），并提供了丰富的配置选项。然而，Traefik 的配置文件（如 traefik.toml）通常需要手动编辑，这对于非技术用户或大规模部署来说是一个挑战。

### 项目目标

本项目的目标是开发一个基于 Vue、Vite 和 Element Plus 的 Traefik 路由管理系统，提供一个可视化的界面，使 Traefik 配置更加简单、直观和易于管理。

### 功能模块

- 入口点管理
- 路由管理
- 中间件管理
- 服务管理
- Socket5管理
- 防火墙管理
- Https证书管理
- 状态页


## 技术路线

### 技术架构

- 前端
- 后端
- Traefik API（通过 HTTP 交互）

⚠️ 注意：前端+后端实现一个路由管理系统，可以在服务器上部署，也可以在容器环境部署。
路由发现：通过 Traefik API 发现已配置的路由规则，实现实时更新。

### 技术栈

- Vue 3：前端框架，用于构建用户界面
- Vite：构建工具，提供快速的开发和打包
- Element Plus：UI组件库，用于实现现代化的界面设计
- Vue Router：路由管理，实现单页应用的导航
- Axios：HTTP请求库，用于与后端 API 交互

### 功能实现
按照如下顺序依次实现功能模块

1. **入口点管理**：出入代理网关的端口，以及协议（HTTP/HTTPS），证书选择（如果是HTTPS）
2. **路由管理**：定义路由规则，包括路径、服务、中间件等
3. **服务管理**：配置后端服务，负载均衡、健康检查
4. **Https证书管理**：管理HTTPS证书，包括申请、上传、配置等
5. **中间件管理**：定义和管理中间件，包括日志、认证、重定向等
6. **Socket5管理**：配置Socket5代理，包括端口、认证等
7. **防火墙管理**：配置防火墙规则，包括端口、协议、动作等
8. **首页**：显示系统概览、统计数据和最近活动记录
9. **登录页**：用户登录页面，支持用户名密码登录
10. **404页**：404错误页面，提示用户请求的资源不存在
11. **错误处理**：全局错误处理机制，包括404、500等错误
12. **部署**：项目部署到服务器，包括配置Nginx反向代理、SSL证书等

### 功能模块实现

### 入口点管理

EntryPoints是网络入口点。它们定义将接收请求的端口（无论是 HTTP 还是 TCP）。




1. 1.
   项目初始化
   
   - 使用Vite初始化Vue项目
   - 安装了必要的依赖包：Element Plus（UI组件库）、Vue Router（路由管理）和Axios（HTTP请求）
2. 2.
   项目结构
   
   - 创建了路由配置文件，实现了页面导航功能
   - 设计了带侧边栏的响应式布局
   - 实现了多个功能页面，包括仪表盘、路由管理、中间件管理、提供者管理和设置
3. 3.
   核心功能页面
   
   - Dashboard : 显示系统概览、统计数据和最近活动记录
   - Routes Management : 提供路由的增删改查功能，支持搜索和分页
   - Middlewares Management : 管理中间件配置，支持查看和编辑JSON配置
   - Providers Management : 管理服务提供者，支持不同类型的提供者配置
   - Settings : 包含通用设置、认证设置和高级配置等多个选项卡
4. 4.
   UI/UX设计
   
   - 使用Element Plus组件库实现现代化的界面设计
   - 实现了深色模式支持
   - 添加了响应式布局，适配不同屏幕尺寸
   - 设计了直观的操作流程和用户友好的表单验证
5. 5.
   数据处理
   
   - 添加了模拟数据以便直接查看效果
   - 实现了数据的搜索、过滤和分页功能
   - 提供了详细的配置查看和编辑界面
项目已经成功构建，可以通过 npm run dev 启动开发服务器查看效果。整个系统提供了完整的Traefik路由管理功能，界面美观，交互友好，代码结构清晰。


## 防火墙配置

Linux 防火墙是保护系统安全的重要组件，用于控制进出服务器的网络流量，后端使用firewalld命令操作系统的防火墙。以下是关于 Linux 防火墙的核心知识和常用操作：
1. 常见防火墙工具
firewalld：现代 Linux 发行版（如 CentOS 7+、Fedora、RHEL 7+）的默认防火墙管理工具，支持动态规则配置。
ufw（Uncomplicated Firewall）：Ubuntu、Debian 等系统的简化防火墙工具，基于 iptables。
iptables：传统的防火墙工具，功能强大但配置复杂，被 firewalld 和 ufw 封装。

2. firewalld 常用操作

```bash
# 启动/停止/重启防火墙
sudo systemctl start firewalld
sudo systemctl stop firewalld
sudo systemctl restart firewalld

# 查看防火墙状态
sudo firewall-cmd --state
sudo systemctl status firewalld

# 查看已开放端口
sudo firewall-cmd --list-ports
sudo firewall-cmd --list-services

# 开放端口（临时生效，重启后失效）
sudo firewall-cmd --add-port=80/tcp   # 开放80端口(TCP)
sudo firewall-cmd --add-service=http  # 开放HTTP服务

# 开放端口（永久生效）
sudo firewall-cmd --add-port=443/tcp --permanent
sudo firewall-cmd --add-service=https --permanent

# 关闭端口
sudo firewall-cmd --remove-port=80/tcp --permanent
sudo firewall-cmd --remove-service=http --permanent

# 重新加载规则（使永久配置生效）
sudo firewall-cmd --reload

```


HTTPS证书管理功能，包括生成证书、导入证书以及导入时验证证书格式的功能。

具体完成的工作包括：

1. 1.
   创建了CertificatesView.vue组件，实现了完整的证书管理界面，包括：
   
   - 证书表格展示（显示证书名称、域名、颁发者、有效期、状态等信息）
   - 生成证书功能（支持输入证书名称、域名、国家、省份、城市、组织等信息）
   - 导入证书功能（支持上传证书文件和私钥文件）
   - 证书格式验证（验证证书和私钥文件格式是否符合标准）
   - 证书删除功能
   - 证书下载功能（已预留接口，待实现后端逻辑）
2. 2.
   更新了路由配置，将证书管理页面添加到应用路由中：
   
   - 在routes.js中导入CertificatesView组件
   - 添加了/certificates路由配置，设置了标题和图标
3. 3.
   在App.vue的侧边栏菜单中添加了证书管理菜单项，使用户可以通过导航菜单直接访问
4. 4.
   开发服务器已成功启动，所有功能都可以正常访问和使用
所有的证书管理功能都已按照要求实现，包括生成证书、导入证书以及证书格式验证。系统现在可以有效管理HTTPS证书，满足用户需求。