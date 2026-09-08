import { afterEach, describe, expect, it, vi } from "vitest";

describe("GoHighLevel appointment retrieval", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("selects a readable calendar and requests bounded event timestamps", async () => {
    process.env.ghlapi = "test-private-token";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ calendars: [{ id: "calendar-1" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [{ id: "appointment-1" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getAppointments } = await import("./ghlClient");

    const result = await getAppointments({ startDate: "2026-09-01T00:00:00.000Z", endDate: "2026-09-02T00:00:00.000Z" });

    expect(result.appointments).toEqual([{ id: "appointment-1" }]);
    expect(String(fetchMock.mock.calls[1][0])).toContain("calendarId=calendar-1");
    expect(String(fetchMock.mock.calls[1][0])).toContain("startTime=1788220800000");
    expect(String(fetchMock.mock.calls[1][0])).toContain("endTime=1788307200000");
  });
});
