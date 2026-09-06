import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  MultiSelect,
  type MultiSelectOption,
  type MultiSelectProps,
} from "./multi-select";

const baseOptions: MultiSelectOption[] = [
  { id: "food", label: "Alimentación" },
  { id: "home", label: "Hogar" },
  { id: "leisure", label: "Planes de ocio" },
  { id: "subs", label: "Suscripciones", archived: true },
];

function MultiSelectHarness({
  initialValue = ["food", "home", "leisure"],
  onChange,
  options = baseOptions,
  ...props
}: Partial<MultiSelectProps> & {
  initialValue?: string[];
  onChange?: (ids: readonly string[]) => void;
}) {
  const [value, setValue] = useState<string[]>(initialValue);

  return (
    <MultiSelect
      allowClearAll={props.allowClearAll}
      allowSelectAll={props.allowSelectAll}
      archivedBehavior={props.archivedBehavior}
      mode={props.mode}
      options={options}
      title={props.title ?? "Categorías"}
      triggerLabel={props.triggerLabel ?? "Categorías"}
      value={value}
      onChange={(ids) => {
        setValue([...ids]);
        onChange?.(ids);
      }}
    />
  );
}

async function openSelector() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Categorías ·/ }));
  return user;
}

describe("MultiSelect", () => {
  it("opens a searchable panel with a selected/total count at the 320 px width", async () => {
    render(<MultiSelectHarness />);

    const trigger = screen.getByRole("button", { name: "Categorías · 3" });
    expect(trigger.className).toContain("max-w-full");

    await userEvent.setup().click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Categorías" });
    expect(dialog).toHaveAccessibleDescription("3 de 4 seleccionados");
    expect(dialog.className).toContain("max-w-full");
    expect(dialog.className).toContain("bottom-0");
    expect(
      screen.getByRole("searchbox", { name: "Buscar" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-multi-select-list]")?.className,
    ).toContain("overflow-y-auto");
  });

  it("filters a long list from the keyboard and restores focus on close", async () => {
    const longOptions = Array.from({ length: 24 }, (_, index) => ({
      id: `item-${index}`,
      label: `Categoría ${index + 1}`,
    }));
    render(
      <MultiSelectHarness
        initialValue={longOptions.map((option) => option.id)}
        options={longOptions}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Categorías · 24" });
    const user = userEvent.setup();
    await user.click(trigger);

    const search = screen.getByRole("searchbox", { name: "Buscar" });
    await user.type(search, "categoría 12");

    expect(
      screen.getByRole("checkbox", { name: "Categoría 12" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: /^Categoría 1$/ }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzzz");
    expect(
      screen.getByRole("heading", { name: "Sin resultados" }),
    ).toBeVisible();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("commits each toggle immediately", async () => {
    const handleChange = vi.fn();
    render(<MultiSelectHarness onChange={handleChange} />);
    const user = await openSelector();

    await user.click(screen.getByRole("checkbox", { name: "Planes de ocio" }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(["food", "home"]);
    expect(
      screen.getByRole("dialog", { name: "Categorías" }),
    ).toHaveAccessibleDescription("2 de 4 seleccionados");
  });

  it("selects and clears every eligible option while keeping locked archived ones", async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelectHarness
        initialValue={["food", "subs"]}
        onChange={handleChange}
      />,
    );
    const user = await openSelector();

    expect(
      screen.getByRole("checkbox", { name: "Suscripciones (Archivado)" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Seleccionar todas" }));
    expect(handleChange).toHaveBeenLastCalledWith([
      "food",
      "home",
      "leisure",
      "subs",
    ]);

    await user.click(screen.getByRole("button", { name: "Quitar todas" }));
    expect(handleChange).toHaveBeenLastCalledWith(["subs"]);
    expect(
      screen.getByRole("checkbox", { name: "Suscripciones (Archivado)" }),
    ).toBeChecked();
  });

  it("preserves selected ids that are not in the current options", async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelectHarness
        initialValue={["food", "ghost"]}
        onChange={handleChange}
      />,
    );
    const user = await openSelector();

    await user.click(screen.getByRole("button", { name: "Seleccionar todas" }));
    expect(handleChange).toHaveBeenLastCalledWith([
      "food",
      "home",
      "leisure",
      "ghost",
    ]);

    await user.click(screen.getByRole("button", { name: "Quitar todas" }));
    expect(handleChange).toHaveBeenLastCalledWith(["ghost"]);
  });

  it("lets the consumer make archived options selectable", async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelectHarness
        archivedBehavior="selectable"
        initialValue={["food"]}
        onChange={handleChange}
      />,
    );
    const user = await openSelector();

    const archived = screen.getByRole("checkbox", {
      name: "Suscripciones (Archivado)",
    });
    expect(archived).toBeEnabled();
    await user.click(archived);
    expect(handleChange).toHaveBeenLastCalledWith(["food", "subs"]);
  });

  it("applies a draft exactly once and discards it on cancel", async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelectHarness
        mode="apply"
        initialValue={["food"]}
        onChange={handleChange}
      />,
    );

    const user = await openSelector();
    await user.click(screen.getByRole("checkbox", { name: "Hogar" }));
    expect(handleChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Categorías" }),
    ).toHaveAccessibleDescription("2 de 4 seleccionados");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handleChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Categorías · 1" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Categorías · 1" }));
    await user.click(screen.getByRole("checkbox", { name: "Hogar" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(["food", "home"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("discards a pending apply draft when the dialog is dismissed", async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelectHarness
        mode="apply"
        initialValue={["food"]}
        onChange={handleChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Categorías · 1" });
    const user = userEvent.setup();
    await user.click(trigger);
    await user.click(screen.getByRole("checkbox", { name: "Hogar" }));
    await user.keyboard("{Escape}");

    expect(handleChange).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(screen.getByRole("checkbox", { name: "Hogar" })).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Alimentación" }),
    ).toBeChecked();
  });

  it("hides bulk actions when the consumer disables them", async () => {
    render(<MultiSelectHarness allowClearAll={false} allowSelectAll={false} />);
    await openSelector();

    expect(
      screen.queryByRole("button", { name: "Seleccionar todas" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar todas" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cerrar",
      }),
    ).toBeInTheDocument();
  });

  it("does not toggle a disabled option from the keyboard", async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelectHarness
        initialValue={["food"]}
        options={[
          { id: "food", label: "Alimentación" },
          { id: "locked", label: "Bloqueada", disabled: true },
        ]}
        onChange={handleChange}
      />,
    );
    const user = await openSelector();

    const locked = screen.getByRole("checkbox", { name: "Bloqueada" });
    locked.focus();
    await user.keyboard(" ");

    expect(locked).toBeDisabled();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
