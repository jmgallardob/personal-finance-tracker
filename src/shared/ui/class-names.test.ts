import { describe, expect, it } from "vitest";

import { cx } from "./class-names";

describe("cx", () => {
  it("joins active class names and ignores empty values", () => {
    expect(cx("block", false, null, undefined, "w-full")).toBe("block w-full");
  });
});
