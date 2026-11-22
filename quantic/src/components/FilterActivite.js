"use client";

export default function FilterActivite({ data, value, onChange }) {
  function generateOptions() {
    var activites = [];
    for (var i = 0; i < data.length; i++) {
      var type = data[i].type;
      if (type && activites.indexOf(type) === -1) {
        activites.push(type);
      }
    }
    activites.sort();

    var options = [];
    for (var j = 0; j < activites.length; j++) {
      options.push(
        <option key={activites[j]} value={activites[j]}>
          {activites[j]}
        </option>
      );
    }
    return options;
  }

  return (
    <div className="bored-select-container">
      <label className="bored-select-label">
        <span className="label-icon">🎯</span>
        <span>Activité :</span>
      </label>
      <div className="bored-select-wrapper">
        <select className="bored-select" value={value} onChange={onChange}>
          <option value="">Toutes les activités ({data.length})</option>
          {generateOptions()}
        </select>
        <span className="bored-select-arrow">▼</span>
      </div>
    </div>
  );
}
