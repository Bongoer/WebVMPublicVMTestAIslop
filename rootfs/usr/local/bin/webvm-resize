#!/bin/sh

export DISPLAY="${DISPLAY:-:0}"

while true
do
  output="$(xrandr --query 2>/dev/null | awk '/ connected/{print $1; exit}')"

  if [ -n "$output" ]
  then
    xrandr --output "$output" --auto >/dev/null 2>&1 || true
  fi

  sleep 2
done
