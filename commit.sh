#!/bin/bash

# 确保在当前 git 仓库中执行
if [ ! -d .git ]; then
  echo "请在 git 仓库的根目录中运行此脚本。"
  exit 1
fi

# 获取所有的提交记录
commits=$(git rev-list --all)

# 遍历每个提交记录
for commit in $commits; do
  # 获取提交的时间戳
  commit_date=$(git show -s --format=%ci $commit)

  # 获取小时部分
  commit_hour=$(date -u -j -f "%Y-%m-%d %H:%M:%S %z" "$commit_date" +%H 2>/dev/null || date -d "$commit_date" +%H 2>/dev/null)

  if [ -z "$commit_hour" ]; then
    echo "无法解析提交时间: $commit_date"
    continue
  fi

  # 如果提交时间在 19:00 之前
  if [ $commit_hour -lt 19 ]; then
    # 修改时间为当天的 20:00
    new_date=$(date -u -j -f "%Y-%m-%d %H:%M:%S %z" "$commit_date" +"%Y-%m-%d 20:00:00 %z" 2>/dev/null || date -d "$commit_date" +"%Y-%m-%d 20:00:00 %z" 2>/dev/null)

    if [ -z "$new_date" ]; then
      echo "无法生成新的提交时间: $commit_date"
      continue
    fi

    # 设置新的提交时间
    GIT_COMMITTER_DATE="$new_date" git commit --amend --no-edit --date="$new_date"
  fi
done

echo "提交记录的时间已经更新完成。"

# 提示用户进行推送
echo "请记得强制推送到远程仓库以覆盖提交记录："
echo "git push --force"
