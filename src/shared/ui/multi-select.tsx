"use client";

import { useMemo, useState } from "react";

import { Button } from "./button";
import { DialogShell } from "./dialog";
import { EmptyState, emptyStateCopy } from "./empty-state";
import { Input } from "./input";

export const multiSelectCopy = {
  apply: "Aplicar",
  archived: "Archivado",
  cancel: "Cancelar",
  clearAll: "Quitar todas",
  search: "Buscar",
  searchPlaceholder: "Buscar…",
  selectAll: "Seleccionar todas",
} as const;

export type MultiSelectMode = "immediate" | "apply";
export type ArchivedOptionBehavior = "disabled" | "selectable";

export interface MultiSelectOption<Id extends string = string> {
  archived?: boolean;
  disabled?: boolean;
  id: Id;
  label: string;
}

export interface MultiSelectProps<Id extends string = string> {
  allowClearAll?: boolean;
  allowSelectAll?: boolean;
  archivedBehavior?: ArchivedOptionBehavior;
  mode?: MultiSelectMode;
  onChange: (selectedIds: readonly Id[]) => void;
  options: readonly MultiSelectOption<Id>[];
  title: string;
  triggerLabel: string;
  value: readonly Id[];
}

function isOptionSelectable<Id extends string>(
  option: MultiSelectOption<Id>,
  archivedBehavior: ArchivedOptionBehavior,
): boolean {
  if (option.disabled) {
    return false;
  }

  return !(option.archived && archivedBehavior === "disabled");
}

function uniqueIds<Id extends string>(ids: readonly Id[]): Id[] {
  return [...new Set(ids)];
}

export function MultiSelect<Id extends string>({
  allowClearAll = true,
  allowSelectAll = true,
  archivedBehavior = "disabled",
  mode = "immediate",
  onChange,
  options,
  title,
  triggerLabel,
  value,
}: MultiSelectProps<Id>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Id[]>(() => uniqueIds(value));

  function openPanel() {
    setQuery("");
    setDraft(uniqueIds(value));
    setOpen(true);
  }

  function closePanel() {
    setQuery("");
    setOpen(false);
  }

  const optionsById = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLocaleLowerCase("es").includes(normalizedQuery),
    );
  }, [options, query]);

  function commit(nextIds: readonly Id[]) {
    const next = uniqueIds(nextIds);
    setDraft(next);
    if (mode === "immediate") {
      onChange(next);
    }
  }

  function toggle(id: Id) {
    const option = optionsById.get(id);
    if (!option || !isOptionSelectable(option, archivedBehavior)) {
      return;
    }

    commit(
      draft.includes(id)
        ? draft.filter((selectedId) => selectedId !== id)
        : [...draft, id],
    );
  }

  function selectAllEligible() {
    const unknownLocked = draft.filter((id) => !optionsById.has(id));
    const fromOptions = options
      .filter(
        (option) =>
          isOptionSelectable(option, archivedBehavior) ||
          draft.includes(option.id),
      )
      .map((option) => option.id);
    commit([...fromOptions, ...unknownLocked]);
  }

  function clearEligible() {
    commit(
      draft.filter((id) => {
        const option = optionsById.get(id);
        return !option || !isOptionSelectable(option, archivedBehavior);
      }),
    );
  }

  function handleApply() {
    onChange(uniqueIds(draft));
    closePanel();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      openPanel();
      return;
    }

    closePanel();
  }

  const selectedCount = draft.length;
  const totalCount = options.length;
  const description = `${selectedCount} de ${totalCount} seleccionados`;

  return (
    <div className="w-full max-w-full">
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="max-w-full"
        variant="secondary"
        onClick={openPanel}
      >
        {`${triggerLabel} · ${value.length}`}
      </Button>
      <DialogShell
        description={description}
        footer={
          mode === "apply" ? (
            <>
              <Button variant="secondary" onClick={closePanel}>
                {multiSelectCopy.cancel}
              </Button>
              <Button onClick={handleApply}>{multiSelectCopy.apply}</Button>
            </>
          ) : undefined
        }
        open={open}
        showCloseButton={mode === "immediate"}
        title={title}
        onOpenChange={handleOpenChange}
      >
        <div className="flex w-full max-w-full flex-col gap-3">
          <Input
            aria-label={multiSelectCopy.search}
            placeholder={multiSelectCopy.searchPlaceholder}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <p className="text-body-sm text-text-muted">{description}</p>
          {allowSelectAll || allowClearAll ? (
            <div className="flex w-full max-w-full flex-col gap-2 sm:flex-row">
              {allowSelectAll ? (
                <Button variant="secondary" onClick={selectAllEligible}>
                  {multiSelectCopy.selectAll}
                </Button>
              ) : null}
              {allowClearAll ? (
                <Button variant="secondary" onClick={clearEligible}>
                  {multiSelectCopy.clearAll}
                </Button>
              ) : null}
            </div>
          ) : null}
          {visibleOptions.length === 0 ? (
            <EmptyState
              description={emptyStateCopy.noResults.description}
              title={emptyStateCopy.noResults.title}
            />
          ) : (
            <fieldset className="min-w-0">
              <legend className="sr-only">{title}</legend>
              <ul
                data-multi-select-list=""
                className="max-h-[min(50vh,20rem)] overflow-y-auto"
              >
                {visibleOptions.map((option) => {
                  const selectable = isOptionSelectable(
                    option,
                    archivedBehavior,
                  );
                  const optionName = option.archived
                    ? `${option.label} (${multiSelectCopy.archived})`
                    : option.label;

                  return (
                    <li key={option.id}>
                      <label className="flex min-h-11 w-full max-w-full items-center gap-3 py-1">
                        <input
                          checked={draft.includes(option.id)}
                          disabled={!selectable}
                          type="checkbox"
                          onChange={() => {
                            toggle(option.id);
                          }}
                        />
                        <span className="text-body text-text">
                          {optionName}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}
        </div>
      </DialogShell>
    </div>
  );
}
