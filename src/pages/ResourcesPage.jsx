import React, { useState, useMemo } from 'react';
import { curatedResources } from '../data/curatedResources';
import {
  BookOpen,
  Search,
  ExternalLink,
  Filter,
  Sparkles,
  Layers,
  GraduationCap,
  X,
  Code2,
  Atom,
  Binary,
  Brain,
  Calculator,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Programming',
  'Mathematics',
  'Science',
  'AI & Machine Learning',
  'Computer Science',
];

const LEVELS = ['All', 'Beginner', 'Intermediate'];

const CATEGORY_ICONS = {
  'Programming': Code2,
  'Mathematics': Calculator,
  'Science': Atom,
  'AI & Machine Learning': Brain,
  'Computer Science': Binary,
};

function ResourceCard({ resource }) {
  const CatIcon = CATEGORY_ICONS[resource.category] || BookOpen;

  return (
    <article className="p-6 rounded-2xl bg-dark-900/60 border border-white/5 hover:border-primary-500/30 hover:bg-dark-800/70 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl backdrop-blur-sm relative">
      <div>
        {/* Top Badges & Icon */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category Tag */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-500/10 border border-primary-500/20 text-primary-300">
              <CatIcon className="w-3 h-3" />
              {resource.category}
            </span>

            {/* Level Tag */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                resource.level === 'Beginner'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}
            >
              {resource.level}
            </span>

            {/* Type Tag */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 border border-white/10 text-slate-400">
              {resource.type}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-primary-300 transition-colors leading-snug">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
          {resource.description}
        </p>
      </div>

      {/* Footer: Source + Open Link */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 truncate">
          {resource.source}
        </span>

        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-primary-500/20 border border-white/10 hover:border-primary-500/30 text-slate-200 hover:text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
          aria-label={`Open ${resource.title} in a new tab`}
        >
          <span>Open</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return curatedResources.filter((r) => {
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q);

      const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
      const matchesLevel = activeLevel === 'All' || r.level === activeLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [search, activeCategory, activeLevel]);

  const hasActiveFilters = search.trim() || activeCategory !== 'All' || activeLevel !== 'All';

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('All');
    setActiveLevel('All');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curated Knowledge Library</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Study Resources
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          High-yield reference materials, free interactive courses, and official documentation curated to complement your AI Tutor sessions.
        </p>
      </section>

      {/* 2. Search & Filter Control Bar */}
      <section className="p-5 rounded-2xl bg-dark-900/60 border border-white/5 backdrop-blur-sm space-y-4 shadow-sm">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Search resources"
            placeholder="Search by topic, keyword, or publisher (e.g. Python, MIT, Algorithms)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-dark-950/70 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                    : 'bg-dark-950/60 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Level:
            </span>
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeLevel === lvl
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-dark-950/60 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-300">{filtered.length}</strong> of {curatedResources.length} curated resources
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* 3. Resources Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 px-4 text-center border border-dashed border-white/10 rounded-3xl bg-dark-900/40">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No resources match your filters</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters to view more material.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-xl transition-all cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

    </div>
  );
}
