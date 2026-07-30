"use client";

import {
  DIFFICULTIES,
  SCENARIO_CATEGORIES,
  type Difficulty,
  type PublicScenarioDefinition,
} from "@sentinelops/shared";
import {
  Clock3,
  RotateCcw,
  Search,
  Server,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

type DurationFilter = "all" | "short" | "medium" | "long";
type SortKey = "difficulty" | "title" | "duration";

const difficultyRank: Record<Difficulty, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

export function ScenarioCatalog({
  scenarios,
  serviceTypes,
}: {
  scenarios: readonly PublicScenarioDefinition[];
  serviceTypes: readonly string[];
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [serviceType, setServiceType] = useState("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [sort, setSort] = useState<SortKey>("difficulty");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return scenarios
      .filter((scenario) => {
        const searchable = [
          scenario.title,
          scenario.description,
          scenario.environmentType,
          ...scenario.learningObjectives,
        ]
          .join(" ")
          .toLocaleLowerCase();
        const durationMatches =
          duration === "all" ||
          (duration === "short" && scenario.estimatedDurationMinutes <= 30) ||
          (duration === "medium" &&
            scenario.estimatedDurationMinutes > 30 &&
            scenario.estimatedDurationMinutes <= 45) ||
          (duration === "long" && scenario.estimatedDurationMinutes > 45);
        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (difficulty === "all" || scenario.difficulty === difficulty) &&
          (category === "all" ||
            scenario.categories.includes(category as never)) &&
          (serviceType === "all" ||
            scenario.services.some(
              (service) => service.type === serviceType,
            )) &&
          durationMatches
        );
      })
      .toSorted((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : sort === "duration"
            ? a.estimatedDurationMinutes - b.estimatedDurationMinutes
            : difficultyRank[a.difficulty] - difficultyRank[b.difficulty] ||
              a.title.localeCompare(b.title),
      );
  }, [category, difficulty, duration, query, scenarios, serviceType, sort]);

  const reset = () => {
    setQuery("");
    setDifficulty("all");
    setCategory("all");
    setServiceType("all");
    setDuration("all");
    setSort("difficulty");
  };
  const hasFilters =
    query !== "" ||
    difficulty !== "all" ||
    category !== "all" ||
    serviceType !== "all" ||
    duration !== "all";

  return (
    <section
      className="catalog-browser container"
      aria-labelledby="scenario-results-title"
    >
      <div className="filter-panel">
        <div className="search-field">
          <label htmlFor={searchId}>Search scenarios</label>
          <div>
            <Search size={17} aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, environment, or objective"
            />
          </div>
        </div>
        <div className="filter-grid" role="group" aria-label="Scenario filters">
          <FilterSelect
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={DIFFICULTIES}
          />
          <FilterSelect
            label="Incident category"
            value={category}
            onChange={setCategory}
            options={SCENARIO_CATEGORIES}
          />
          <FilterSelect
            label="Service type"
            value={serviceType}
            onChange={setServiceType}
            options={serviceTypes}
          />
          <FilterSelect
            label="Estimated duration"
            value={duration}
            onChange={(value) => setDuration(value as DurationFilter)}
            options={["short", "medium", "long"]}
            labels={{
              short: "30 min or less",
              medium: "31–45 min",
              long: "More than 45 min",
            }}
          />
          <FilterSelect
            label="Sort by"
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
            options={["difficulty", "title", "duration"]}
            labels={{
              difficulty: "Difficulty",
              title: "Title",
              duration: "Duration",
            }}
            hideAll
          />
        </div>
        <button
          className="reset-button"
          type="button"
          onClick={reset}
          disabled={!hasFilters}
        >
          <RotateCcw size={14} /> Reset filters
        </button>
      </div>
      <div className="results-heading">
        <div>
          <SlidersHorizontal size={16} />
          <h2 id="scenario-results-title">Scenario results</h2>
        </div>
        <p aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "scenario" : "scenarios"}
        </p>
      </div>
      {filtered.length ? (
        <div className="scenario-grid">
          {filtered.map((scenario) => (
            <ScenarioCard scenario={scenario} key={scenario.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={26} />
          <h3>No scenarios match those filters.</h3>
          <p>Try a broader search or reset the catalog.</p>
          <button className="button secondary" type="button" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels = {},
  hideAll = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  labels?: Record<string, string>;
  hideAll?: boolean;
}) {
  const id = useId();
  return (
    <label className="filter-select" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {!hideAll && <option value="all">All</option>}
        {options.map((option) => (
          <option value={option} key={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ScenarioCard({ scenario }: { scenario: PublicScenarioDefinition }) {
  return (
    <article className="scenario-card">
      <div className="scenario-card-top">
        <span className="simulated-badge">
          <span /> SIMULATED
        </span>
        <span className={`status-label ${scenario.implementationStatus}`}>
          {scenario.implementationStatus}
        </span>
      </div>
      <div className="category-list" aria-label="Incident categories">
        {scenario.categories.map((category) => (
          <span key={category}>{category}</span>
        ))}
      </div>
      <h3>{scenario.title}</h3>
      <p>{scenario.description}</p>
      <dl className="scenario-meta">
        <div>
          <dt>
            <Clock3 size={14} /> Difficulty & time
          </dt>
          <dd>
            {scenario.difficulty} · {scenario.estimatedDurationMinutes} min
          </dd>
        </div>
        <div>
          <dt>
            <Server size={14} /> Affected services
          </dt>
          <dd>{scenario.services.length} services</dd>
        </div>
      </dl>
      <div className="objectives">
        <strong>PRIMARY LEARNING OBJECTIVES</strong>
        <ul>
          {scenario.learningObjectives.slice(0, 2).map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </div>
      <Link
        className="button secondary card-action"
        href={`/scenarios/${scenario.slug}`}
      >
        View Briefing
      </Link>
    </article>
  );
}
