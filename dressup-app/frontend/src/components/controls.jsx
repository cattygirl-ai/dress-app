import { useState } from "react";

export default function Controls({ groups, ownedItems = {}, onPurchase = () => {} }) {
  const [activeTab, setActiveTab] = useState(groups[0]?.title || "Body");

  const activeGroup = groups.find((g) => g.title === activeTab) || groups[0];

  return (
    <aside className="closet-panel">
      <div className="closet-card">
        <div className="closet-header">
          <p className="eyebrow">Dress room</p>
          <h2>Closet</h2>
        </div>

        <div className="closet-tabs">
          {groups.map((g) => (
            <button
              key={g.title}
              type="button"
              className={`closet-tab ${g.title === activeTab ? "active" : ""}`}
              aria-pressed={g.title === activeTab}
              onClick={() => setActiveTab(g.title)}
            >
              {g.title}
            </button>
          ))}
        </div>

        <section className="closet-section">
          <h3>{activeGroup.title}</h3>
          {activeGroup.sections.map((section) => (
            <div className="closet-subsection" key={section.title}>
              <div className="subsection-header">
                <span>{section.title}</span>
                <span className="subsection-hint">Choose one</span>
              </div>
              <div className="closet-items">
                {section.options.map((item) => {
                  // If `ownedItems` does not have this section key, assume we're in pre-START mode
                  // and all options should be available. When inside the started modal, App passes
                  // `ownedItems` with explicit arrays and locking applies.
                  const ownedForSection = Array.isArray(ownedItems[section.title]) ? ownedItems[section.title] : null;
                  const isOwned = ownedForSection === null ? true : ownedForSection.includes(item.id);
                  return (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={`closet-item ${item.id === section.selected ? "selected" : ""}`}
                        aria-pressed={item.id === section.selected}
                        onClick={() => {
                          if (isOwned) section.onSelect(item.id);
                          else onPurchase(section.title, item.id);
                        }}
                        disabled={false}
                      >
                        {item.asset ? <img src={item.asset} alt={item.label} /> : <span className="missing-asset" />}
                        <span>{item.label}</span>
                      </button>
                      {!isOwned && (
                        <div className="lock-overlay">🔒 200</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </aside>
  );
}
