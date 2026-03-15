"use client";

import { useMemo } from "react";
import { Category } from "@/lib/types";

type CategoryCascadeSelectProps = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
};

function findPath(nodes: Category[], targetId: string, trail: Category[] = []): Category[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === targetId) return nextTrail;
    const childPath = findPath(node.children || [], targetId, nextTrail);
    if (childPath) return childPath;
  }
  return null;
}

function findNodeById(nodes: Category[], targetId: string): Category | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    const child = findNodeById(node.children || [], targetId);
    if (child) return child;
  }
  return null;
}

export default function CategoryCascadeSelect({
  categories,
  value,
  onChange,
}: CategoryCascadeSelectProps) {
  const selections = useMemo(() => {
    if (!value) return [];
    const path = findPath(categories, value);
    return path ? path.map((item) => item.id) : [];
  }, [categories, value]);

  const optionLevels = useMemo(() => {
    const levels: Category[][] = [categories];
    let currentNodes = categories;
    for (const selectedId of selections) {
      const selected = currentNodes.find((item) => item.id === selectedId);
      if (!selected || !selected.children?.length) break;
      levels.push(selected.children);
      currentNodes = selected.children;
    }
    return levels;
  }, [categories, selections]);

  const onSelectLevel = (levelIndex: number, selectedId: string) => {
    const next = selections.slice(0, levelIndex);
    if (selectedId) next.push(selectedId);
    onChange(selectedId || next[next.length - 1] || "");
  };

  return (
    <div className="space-y-3">
      {optionLevels.map((options, levelIndex) => {
        const currentValue = selections[levelIndex] || "";
        const label =
          levelIndex === 0 ? "Main Category" : levelIndex === 1 ? "Subcategory" : `Subcategory Level ${levelIndex}`;

        return (
          <label key={`level-${levelIndex}`} className="block">
            <span className="mb-1 block text-sm text-zinc-700">{label}</span>
            <select
              value={currentValue}
              onChange={(event) => onSelectLevel(levelIndex, event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.14)]"
            >
              <option value="">
                {levelIndex === 0 ? "Select main category" : "Select subcategory"}
              </option>
              {options.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name.en}
                </option>
              ))}
            </select>
          </label>
        );
      })}

      {selections.length > 0 ? (
        <p className="text-xs text-zinc-500">
          Selected: {findNodeById(categories, selections[selections.length - 1])?.name.en || ""}
        </p>
      ) : null}
    </div>
  );
}
