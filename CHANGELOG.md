# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-27

### Added

- **Admin Provider Management Page** (`/admin/providers`): Full CRUD for LLM provider configs
  - Add/edit/delete providers with encrypted API key storage
  - Provider listing with status badges and search
- **User Provider Config Page** (`/settings/providers`): View connected LLM providers
- **Admin Users Management Page** (`/admin/users`): User list with pagination/filter/search
  - User detail modal with subscription info and usage stats
  - Status toggle (activate/deactivate users)
  - Plan badge color coding (free/basic/pro/enterprise)
- **Subscription Display** on Settings page: Plan badge, usage progress bar, upgrade CTA
- **API Layer**: getAdminUsers, getAdminUser, toggleUserStatus, getUserUsage, getUserSubscription

### Changed

- AppLayout sidebar: Added `/admin/users` and `/admin/providers` navigation links

## [0.1.1] - 2026-06-26

### Changed
- register() 请求支持邮箱可选
- request() 错误处理优化：自动解析 FastAPI 422，展示可读消息而非 JSON 原文

## [0.1.0] - 2026-06-26

