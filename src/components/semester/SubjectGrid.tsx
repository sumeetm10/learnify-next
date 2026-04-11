"use client";

import type { SubjectWithChapters } from "@/types";

interface Props {
  subjects: SubjectWithChapters[];
  onSelect: (subject: SubjectWithChapters) => void;
}

export function SubjectGrid({ subjects, onSelect }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject, i) => (
        <button
          key={subject.id}
          onClick={() => onSelect(subject)}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left group"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <span className="text-4xl block mb-3 group-hover:animate-bounce">{subject.icon}</span>
          <h3 className="font-semibold text-lg mb-1">{subject.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subject.description}</p>
          <p className="text-xs text-[#427da6] mt-3 font-medium">
            {subject.chapters.length} chapters →
          </p>
        </button>
      ))}
    </div>
  );
}
