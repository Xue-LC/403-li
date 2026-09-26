/**
 * 工具偏好存储工具
 * key 模式: 'tool-prefs:<toolName>'
 */
const PREFIX = 'tool-prefs:'

export function saveToolPrefs(toolName, data) {
  try {
    localStorage.setItem(PREFIX + toolName, JSON.stringify(data))
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function loadToolPrefs(toolName) {
  try {
    const raw = localStorage.getItem(PREFIX + toolName)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * 标星工具存储
 * 存储格式: ['/tools/password', '/tools/json', ...]
 */
const PINNED_KEY = 'pinned-tools'

export function loadPinnedTools() {
  try {
    const raw = localStorage.getItem(PINNED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePinnedTools(tools) {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(tools))
  } catch {
    // 静默失败
  }
}

export function togglePinned(path) {
  const pinned = loadPinnedTools()
  const idx = pinned.indexOf(path)
  if (idx >= 0) {
    pinned.splice(idx, 1)
  } else {
    pinned.push(path)
  }
  savePinnedTools(pinned)
  return pinned
}

/**
 * 工具使用时间记录
 * 记录最近使用的工具，用于置顶排序
 */
const USAGE_KEY = 'tool-usage'

export function recordUsage(path) {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[path] = Date.now()
    localStorage.setItem(USAGE_KEY, JSON.stringify(map))
  } catch {}
}

export function getLastUsed(path) {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    return map[path] || 0
  } catch {
    return 0
  }
}

/**
 * 获取最近使用的工具路径列表
 * @param {number} max - 最多返回几个
 * @returns {string[]} 工具路径数组，按最近使用时间降序
 */
export function getRecentPaths(max = 6) {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([path]) => path)
  } catch {
    return []
  }
}
