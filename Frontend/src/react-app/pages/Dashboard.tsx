import { useMemo, useState } from "react";
import Sidebar from "@/react-app/components/dashboard/Sidebar";
import Topbar from "@/react-app/components/dashboard/Topbar";
import Card from "@/react-app/components/dashboard/Card";
import ProgressBar from "@/react-app/components/dashboard/ProgressBar";
import Donut from "@/react-app/components/dashboard/Donut";
import { upcomingEvents, budget, checklist, activity } from "@/react-app/data/dashboardDummy";
import "@/react-app/styles/elegance-dashboard.css";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const totals = useMemo(() => {
    const allocated = budget.categories.reduce((s, c) => s + c.allocated, 0);
    const spent = budget.categories.reduce((s, c) => s + c.spent, 0);
    const usedPct = Math.round((spent / Math.max(allocated, 1)) * 100);
    const done = checklist.filter((c) => c.done).length;
    const progress = Math.round((done / Math.max(checklist.length, 1)) * 100);
    return { allocated, spent, usedPct, progress };
  }, []);

  return (
    <div className={`elegance-app ${sidebarOpen ? "sidebar-open" : ""}`}>
      <Sidebar open={sidebarOpen} />
      <div className="elegance-main">
        <Topbar onToggleSidebar={() => setSidebarOpen((isOpen) => !isOpen)} />
        <div className="elegance-content">
          <div className="elegance-cards">
            <Card
              title="Upcoming Events"
              kicker={`${upcomingEvents.length} scheduled`}
              action={
                <a
                  href="#"
                  className="elegance-link"
                  onClick={(e) => e.preventDefault()}
                >
                  View all
                </a>
              }
              className="elegance-events"
            >
              <div className="elegance-list">
                {upcomingEvents.map((ev) => (
                  <div className="elegance-event" key={ev.id}>
                    <div className="elegance-event-left">
                      <div className="elegance-event-badge">{ev.title[0]}</div>
                      <div>
                        <div className="elegance-event-title">{ev.title}</div>
                        <div className="elegance-event-meta">
                          {ev.date} • {ev.location}
                        </div>
                      </div>
                    </div>
                    <a
                      href="#"
                      className="elegance-link"
                      onClick={(e) => e.preventDefault()}
                    >
                      Details
                    </a>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Budget Summary"
              kicker="Overview"
              action={<span className="elegance-badge">SaaS Plan</span>}
              className="elegance-budget"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Donut value={totals.usedPct} />
                <div className="elegance-summary-grid" style={{ flex: 1, minWidth: 0 }}>
                  <div className="elegance-summary-card">
                    <div>
                      <div className="elegance-summary-title">Allocated</div>
                      <div className="elegance-summary-value">
                        ₹{totals.allocated.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ color: "var(--muted)" }}>100%</div>
                  </div>
                  <div className="elegance-summary-card">
                    <div>
                      <div className="elegance-summary-title">Spent</div>
                      <div className="elegance-summary-value">
                        ₹{totals.spent.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ color: "var(--muted)" }}>
                      {totals.usedPct}%
                    </div>
                  </div>
                  <div className="elegance-summary-card">
                    <div>
                      <div className="elegance-summary-title">Remaining</div>
                      <div className="elegance-summary-value">
                        ₹
                        {(totals.allocated - totals.spent).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ color: "var(--muted)" }}>
                      {100 - totals.usedPct}%
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Checklist Progress"
              kicker={`${checklist.filter((c) => c.done).length} of ${
                checklist.length
              } done`}
              action={
                <a
                  href="#"
                  className="elegance-link"
                  onClick={(e) => e.preventDefault()}
                >
                  Open
                </a>
              }
              className="elegance-checklist"
            >
              <div className="elegance-stat">
                <div>Overall progress</div>
                <div style={{ fontWeight: 700 }}>{totals.progress}%</div>
              </div>
              <ProgressBar value={totals.progress} />
              <div className="elegance-list" style={{ marginTop: 10 }}>
                {checklist.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="elegance-summary-card"
                    style={{ background: item.done ? "#f4fbf7" : undefined }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: item.done ? "var(--success)" : "#fff",
                        }}
                      />
                      <div>{item.label}</div>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {item.done ? "Done" : "Pending"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Recent Activity"
              kicker="Latest updates"
              className="elegance-activity"
              action={
                <a
                  href="#"
                  className="elegance-link"
                  onClick={(e) => e.preventDefault()}
                >
                  View all
                </a>
              }
            >
              <div className="elegance-activity-list">
                {activity.map((a) => (
                  <div className="elegance-activity-item" key={a.id}>
                    <div className="elegance-activity-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{a.text}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {a.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Summary"
              kicker="At a glance"
              className="elegance-summary"
              action={
                <a
                  href="#"
                  className="elegance-link"
                  onClick={(e) => e.preventDefault()}
                >
                  Export
                </a>
              }
            >
              <div className="elegance-summary-grid">
                <div className="elegance-summary-card">
                  <div>
                    <div className="elegance-summary-title">
                      Vendors Contacted
                    </div>
                    <div className="elegance-summary-value">12</div>
                  </div>
                  <div className="elegance-badge">Active</div>
                </div>
                <div className="elegance-summary-card">
                  <div>
                    <div className="elegance-summary-title">Guests Confirmed</div>
                    <div className="elegance-summary-value">86</div>
                  </div>
                  <div style={{ color: "var(--muted)" }}>+4 this week</div>
                </div>
                <div className="elegance-summary-card">
                  <div>
                    <div className="elegance-summary-title">Checklist Items</div>
                    <div className="elegance-summary-value">
                      {checklist.length}
                    </div>
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    {totals.progress}%
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {sidebarOpen ? (
        <div
          className="elegance-scrim"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
    </div>
  );
}
