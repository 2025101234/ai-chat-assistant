# QQ 接入指南

本项目通过 NapCat 接入 QQ PC 端，基于 NTQQ 协议实现消息收发。

## NapCat 简介

NapCat 是一个基于 NTQQ 协议的 QQ Bot 框架，支持：
- 消息收发
- 好友/群管理
- 文件传输
- 丰富的消息类型

**GitHub**: https://github.com/NapNeko/NapCatQQ

---

## 配置步骤

### 1. 下载 NapCat

1. 访问 https://github.com/NapNeko/NapCatQQ/releases
2. 下载最新版本的 `NapCatInstaller.exe`

### 2. 安装 NapCat

1. 运行 `NapCatInstaller.exe`
2. 按照提示完成安装
3. 安装完成后，会在桌面生成快捷方式

### 3. 登录 QQ

1. 双击打开 NapCat
2. 使用手机 QQ 扫码登录
3. 等待登录成功

### 4. 配置 HTTP 服务

NapCat 默认开启 HTTP 服务，端口为 `3000`

如果需要修改端口：
1. 打开 NapCat 配置文件（通常在安装目录下的 `config` 文件夹）
2. 修改 `http` 配置项的 `port` 值
3. 重启 NapCat

### 5. 在应用中配置

1. 打开 AI 聊天助手
2. 进入"QQ设置"
3. 填入 NapCat HTTP 端口（默认 3000）
4. 点击"连接QQ"
5. 等待连接成功

---

## 常见问题

### Q: 提示"连接失败"
**A**: 请检查：
1. NapCat 是否已启动
2. QQ 是否已登录
3. 端口是否正确（默认 3000）
4. 防火墙是否阻止了连接

### Q: 提示"登录失败"
**A**: 请尝试：
1. 重新扫码登录
2. 检查手机 QQ 是否可以正常登录
3. 清除 NapCat 缓存后重试

### Q: 无法收到消息
**A**: 请检查：
1. NapCat 是否正常运行
2. QQ 是否在线
3. 是否开启了消息通知

### Q: 发送消息失败
**A**: 请检查：
1. 好友/群是否存在
2. 是否被禁言
3. 是否有发送权限

---

## NapCat 配置说明

### 配置文件位置
- Windows: `%APPDATA%/NapCat/config/`
- Linux: `~/.config/NapCat/config/`

### 主要配置项

```json
{
  "http": {
    "enable": true,
    "host": "0.0.0.0",
    "port": 3000,
    "cors": true,
    "token": ""
  },
  "ws": {
    "enable": false,
    "host": "0.0.0.0",
    "port": 3001
  }
}
```

### 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `http.enable` | 是否启用 HTTP 服务 | true |
| `http.host` | 监听地址 | 0.0.0.0 |
| `http.port` | 监听端口 | 3000 |
| `http.cors` | 是否允许跨域 | true |
| `http.token` | 认证令牌 | 空 |
| `ws.enable` | 是否启用 WebSocket | false |
| `ws.host` | WebSocket 监听地址 | 0.0.0.0 |
| `ws.port` | WebSocket 端口 | 3001 |

---

## 安全建议

1. **设置 Token**: 在生产环境建议设置 `token` 进行认证
2. **限制访问**: 使用防火墙限制只有本机可以访问
3. **定期更新**: 及时更新 NapCat 到最新版本
4. **备份配置**: 定期备份配置文件

---

## 相关链接

- [NapCat GitHub](https://github.com/NapNeko/NapCatQQ)
- [NapCat 文档](https://napneko.github.io/)
- [NTQQ 协议说明](https://github.com/RichardChangCA/NTQQ-Protocol)
