import { describe, expect, it } from "vitest";

import type { Tag, TagInput } from "./tag";
import {
  MAX_TAG_NAME_LENGTH,
  areTagsEquivalent,
  createTag,
  isTagActive,
} from "./tag";

const VALID_INPUT: TagInput = {
  id: "V1StGXR8_Z5jdHi6B-myT",
  name: "vacaciones",
  archivedAt: null,
};

function created(input: Partial<TagInput> = {}): Tag {
  const result = createTag({ ...VALID_INPUT, ...input });

  if (!result.ok) {
    throw new Error(
      `Expected a valid tag, got ${JSON.stringify(result.errors)}`,
    );
  }

  return result.value;
}

function errorsOf(input: Partial<TagInput>) {
  const result = createTag({ ...VALID_INPUT, ...input });

  return result.ok ? [] : result.errors;
}

describe("createTag", () => {
  it("builds an active tag with its normalized name", () => {
    expect(created()).toEqual({
      id: VALID_INPUT.id,
      name: "vacaciones",
      normalizedName: "vacaciones",
      archivedAt: null,
    });
  });

  it("keeps the written form and collapses the internal spaces", () => {
    const tag = created({ name: "  con   amigos " });

    expect(tag.name).toBe("con amigos");
    expect(tag.normalizedName).toBe("con amigos");
  });

  it("keeps accents and case in the written form", () => {
    const tag = created({ name: "Navidád" });

    expect(tag.name).toBe("Navidád");
    expect(tag.normalizedName).toBe("navidád");
  });

  it("archives a tag with a technical millisecond timestamp", () => {
    const tag = created({ archivedAt: 1757145600000 });

    expect(isTagActive(tag)).toBe(false);
    expect(isTagActive(created())).toBe(true);
  });

  it.each(["a", "A".repeat(MAX_TAG_NAME_LENGTH)])(
    "accepts the name %p at the length boundary",
    (name) => {
      expect(created({ name }).name).toBe(name);
    },
  );

  it("rejects a name one character beyond the accepted maximum", () => {
    expect(errorsOf({ name: "A".repeat(MAX_TAG_NAME_LENGTH + 1) })).toEqual([
      { field: "name", code: "tooLong" },
    ]);
  });

  it.each(["", "   "])("rejects the empty name %p", (name) => {
    expect(errorsOf({ name })).toEqual([{ field: "name", code: "required" }]);
  });

  it.each([
    ["viaje\u001F", "a control character at the end"],
    ["\u001Fviaje", "a control character at the start"],
    ["via\u0000je", "a control character in the middle"],
    ["\tviaje", "a leading tab"],
    ["viaje\t", "a trailing tab"],
    ["via\tje", "an internal tab"],
    ["\nviaje", "a leading line break"],
    ["viaje\n", "a trailing line break"],
    ["via\rje", "an internal carriage return"],
  ])("rejects the name %p because of %s", (name) => {
    expect(errorsOf({ name })).toEqual([
      { field: "name", code: "invalidCharacter" },
    ]);
  });

  it("still normalizes the printable whitespace of an accepted name", () => {
    expect(created({ name: "  con   amigos  " }).name).toBe("con amigos");
  });

  it.each(["", "with space", "acentúa"])(
    "rejects the invalid identifier %p",
    (id) => {
      expect(errorsOf({ id })).toEqual([
        { field: "id", code: "invalidIdentifier" },
      ]);
    },
  );

  it.each([-1, 0.5])("rejects the archiving mark %p", (archivedAt) => {
    expect(errorsOf({ archivedAt })).toEqual([
      { field: "archivedAt", code: "invalidTimestamp" },
    ]);
  });

  it("reports every rejected field at once", () => {
    expect(errorsOf({ id: "", name: "", archivedAt: -1 })).toEqual([
      { field: "id", code: "invalidIdentifier" },
      { field: "name", code: "required" },
      { field: "archivedAt", code: "invalidTimestamp" },
    ]);
  });
});

describe("areTagsEquivalent", () => {
  it("collides on names that only differ in case or spacing", () => {
    expect(
      areTagsEquivalent(
        created({ name: "Madrid" }),
        created({ name: "madrid" }),
      ),
    ).toBe(true);
    expect(
      areTagsEquivalent(
        created({ name: "con  amigos" }),
        created({ name: "Con amigos" }),
      ),
    ).toBe(true);
  });

  it("does not collide when the accent differs", () => {
    expect(
      areTagsEquivalent(created({ name: "cafe" }), created({ name: "café" })),
    ).toBe(false);
  });

  it("does not collide on different names", () => {
    expect(
      areTagsEquivalent(
        created({ name: "trabajo" }),
        created({ name: "ocio" }),
      ),
    ).toBe(false);
  });
});
