import {
  createLocalSessionId,
  isValidLocalSessionId,
  saveLocalSession,
} from "./local-session";

describe("local session validation", () => {
  it("creates Web Crypto IDs with the required shape", () => {
    const cryptoSource = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
        new Uint8Array((array as Uint8Array).buffer).fill(255);
        return array;
      },
    };
    expect(createLocalSessionId(cryptoSource)).toBe(
      "sim_ffffffffffffffffffffffffffffffff",
    );
  });

  it.each([
    "sim_0123456789abcdef0123456789abcdef",
    "sim_ffffffffffffffffffffffffffffffff",
  ])("accepts valid ID %s", (id) =>
    expect(isValidLocalSessionId(id)).toBe(true),
  );
  it.each([
    "",
    "sim_short",
    "SIM_0123456789abcdef0123456789abcdef",
    "sim_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    "0123456789abcdef0123456789abcdef",
  ])("rejects invalid ID %s", (id) =>
    expect(isValidLocalSessionId(id)).toBe(false),
  );

  it("validates before saving a tab-local record", () => {
    const setItem = vi.fn();
    expect(() => saveLocalSession("bad-id", "scenario", { setItem })).toThrow(
      "Invalid local session ID",
    );
    expect(setItem).not.toHaveBeenCalled();
  });
});
