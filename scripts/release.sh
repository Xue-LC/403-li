#!/bin/bash
# release.sh — 同步 beta 主线到正式版仓库（github.com/Xue-LC/403-li）
# 自动剔除开发文档，正式版仓库只保留干净的站点代码
# 用法：
#   scripts/release.sh          # 常规同步（生成一个同步提交推到 release/main）
#   scripts/release.sh --force  # 首次初始化：孤儿提交 + force push 替换旧历史
set -euo pipefail
cd "$(dirname "$0")/.."

# 只保留在私有 beta 仓的开发文档
EXCLUDE=(AGENTS.md TOOL_QUEUE.md TOOL_TEMPLATE.md .tool-ideas.json)

FORCE="${1:-}"

export GIT_INDEX_FILE=$(mktemp)
trap 'rm -f "$GIT_INDEX_FILE"' EXIT

git read-tree main
for f in "${EXCLUDE[@]}"; do
  git update-index --force-remove "$f" 2>/dev/null || true
done
TREE=$(git write-tree)

MSG="sync: $(git log -1 --format=%s main)"
if [[ "$FORCE" == "--force" ]]; then
  # 孤儿提交，彻底替换正式版仓库的旧历史
  COMMIT=$(git commit-tree "$TREE" -m "$MSG")
  git push --force release "$COMMIT:main"
else
  COMMIT=$(git commit-tree "$TREE" -p release/main -m "$MSG")
  git push release "$COMMIT:main"
fi
echo "release 同步完成: $COMMIT"
