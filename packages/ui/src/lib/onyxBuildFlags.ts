/**
 * Onyx 个人构建的 UI 净化开关，见 ONYX.md「五、官方能力剥离」与 ONYX-CHANGES.md。
 * 全部改动以这些常量为锚点：上游合并冲突时保留上游结构，重新确认常量引用即可。
 */

/** 隐藏欢迎页的 OAuth 登录按钮（Z.ai / BigModel），默认进入 API key 配置模式。 */
export const ONYX_HIDE_OAUTH_LOGIN = true;

/** 隐藏模型设置中的账号类预置供应商分组（智谱 BigModel / Z.AI 编程套餐 / Start Plan 等），只保留自定义供应商。 */
export const ONYX_HIDE_ACCOUNT_PROVIDERS = true;
