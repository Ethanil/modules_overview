
let moduleWithHTML = [];
let allModules = null;
let currentSort = "newest";
let activeFilters = {
  fields: new Set(),
  terms: new Set(),
  Creditpoints: new Set(),
};
document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch("data/modules.json");
  const data = await response.json();

  data.modules.forEach((module) => {
    const moduleCard = document.createElement("div");
    moduleCard.className = "module-card";

    let examOptions = "";
    let examDetails = "";

    module.exams
      .sort((a, b) => new Date(b.written_date) - new Date(a.written_date))
      .forEach((exam, index) => {
        const written_date = new Date(exam.written_date);
        const results_received = new Date(exam.result_release);
        const daysForCorrection =
          (results_received - written_date) / (1000 * 60 * 60 * 24);
        const semester = `${
          written_date.getMonth() > 5 ? "SS" : "WS"
        }${written_date.getFullYear()}`;

        examOptions += `<option value="${index}">Exam ${semester}</option>`;

        examDetails += `
<div class="exam-details" id="exam-${module.id}-${index}" style="display: ${
          index === 0 ? "block" : "none"
        };">
<p><strong>Average grade:</strong> ${exam.average}</p>
<p><strong>Exam written on</strong> ${written_date.toLocaleDateString()}</p>
<p><strong>Grades received on</strong> ${results_received.toLocaleDateString()} (after ${daysForCorrection} days)</p>
</div>
`;
      });

    moduleCard.innerHTML = `
<h2 class="module-title">${module.name} (${module.Creditpoints || "?"} CP)</h2>
<div class="module-details">
<!-- Control Section -->
<div class="controls-container">
<button class="toggle-description-btn">Show Description</button>
${examOptions ? `<select class="exam-dropdown">${examOptions}</select>` : ""}
${
  examOptions
    ? `<button class="show-chart-btn" data-module-id="${module.id}" data-exam-index="0">Show Grading Chart</button>`
    : ""
}
</div>

<!-- Description Section -->
<div class="description collapsed">
<p><strong>Description:</strong> ${
      module.description || "No description available."
    }</p>
<p><strong>Lecturer(s):</strong> ${module.lecturer}</p>
<p><strong>URL:</strong> <a href="${
      module.url
    }" target="_blank">Course Link</a></p>
<p><strong>Field of Study:</strong> ${module.fields.join(", ")}</p>
<p><strong>Term:</strong> ${module.terms.join(", ")}</p>
<p><strong>Exam Type:</strong> 
  ${module.exam_type ? `
      <br /> <strong>Form:</strong> ${module.exam_type.form}  
      <br /> <strong>Grading:</strong> ${module.exam_type.grading}
  ` : 
    "Not specified"
  }
</p>
${
  module.bonus
    ? `<p><strong>Bonus:</strong> ${module.bonus.description} (Max grade improvement: ${module.bonus.maximum_bonus})</p>`
    : ""
}
</div>

<!-- Exam Section -->
${
  examOptions
    ? `<div class="exams-section">
${examDetails}
</div>`
    : ""
}
</div>
`;

    document.getElementById("module-container").appendChild(moduleCard);

    // Dropdown event listener
    const examDropdown = moduleCard.querySelector(".exam-dropdown");
    examDropdown?.addEventListener("change", (event) => {
      const selectedIndex = event.target.value;
      module.exams.forEach((_, index) => {
        document.getElementById(`exam-${module.id}-${index}`).style.display =
          "none";
      });
      document.getElementById(
        `exam-${module.id}-${selectedIndex}`
      ).style.display = "block";
    });

    // Show chart modal
    const showChartButtons = moduleCard.querySelectorAll(".show-chart-btn");
    showChartButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const moduleId = event.target.getAttribute("data-module-id");
        const examIndex = event.target.getAttribute("data-exam-index");

        // Open the modal
        document.getElementById("chartModal").style.display = "flex";

        // Set canvas ID and render chart
        document
          .getElementById("modal-chart")
          .setAttribute("data-module-id", moduleId);
        document
          .getElementById("modal-chart")
          .setAttribute("data-exam-index", examIndex);

        createGradeChart(module, examIndex);
      });
    });

    // Toggle description button
    const toggleButton = moduleCard.querySelector(".toggle-description-btn");
    const description = moduleCard.querySelector(".description");
    toggleButton.addEventListener("click", () => {
      description.classList.toggle("collapsed");
      toggleButton.textContent = description.classList.contains("collapsed")
        ? "Show Description"
        : "Hide Description";
    });
    moduleWithHTML.push([module, moduleCard]);
  });

  // Close modal event
  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("chartModal").style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === document.getElementById("chartModal")) {
      document.getElementById("chartModal").style.display = "none";
    }
  });

  allModules = data.modules;

  // Generate filter checkboxes
  generateCheckboxes("fieldFilters", "fields", "fields");
  generateCheckboxes("termFilters", "terms", "terms");
  generateCheckboxes("cpFilters", "Creditpoints", "Creditpoints");

  // Event listeners
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderModules();
  });

  document.querySelectorAll(".filter-section").forEach((container) => {
    container.addEventListener("change", (e) => {
      if (e.target.tagName === "INPUT") {
        const category = e.target.dataset.filterCategory;
        const value = e.target.value;
        if (e.target.checked) {
          activeFilters[category].add(value);
        } else {
          activeFilters[category].delete(value);
        }
        renderModules();
      }
    });
  });

  // Initial render
//   renderModules();

  // Modal close events
  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("chartModal").style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === document.getElementById("chartModal")) {
      document.getElementById("chartModal").style.display = "none";
    }
  });
});

function generateCheckboxes(containerId, dataKey, filterCategory) {
  const container = document.getElementById(containerId);
  const values = new Set();

  allModules.forEach((module) => {
    if (Array.isArray(module[dataKey])) {
        module[dataKey].forEach((value) => values.add(value));
    } else {
        values.add(module[dataKey] ? module[dataKey] : "unknown");
    }
  });

  Array.from(values)
    .sort()
    .forEach((value) => {
      const label = document.createElement("label");
      label.className = "filter-checkbox";
      label.innerHTML = `
<input type="checkbox" value="${value}" 
data-filter-category="${filterCategory}">
${value}
`;
      container.appendChild(label);
    });
}

function renderModules() {
  // Filter modules
  const filteredModules = moduleWithHTML.filter(([module, _]) => {
    if (
      activeFilters.fields.size > 0 &&
      !module.fields.some((f) => activeFilters.fields.has(f))
    )
      return false;
    if (
      activeFilters.terms.size > 0 &&
      !module.terms.some((t) => activeFilters.terms.has(t))
    )
      return false;
      if (
        activeFilters.Creditpoints.size > 0 &&
        !activeFilters.Creditpoints.has(module.Creditpoints?module.Creditpoints : "unknown")
      ) {
        return false;
      }
    return true;
  });

  // Sort modules
  const sortedModules = [...filteredModules].sort(([a, _], [b, __]) => {
    const calculateOverallAverage = (module) => {
      let totalGradeSum = 0;
      let totalCount = 0;
  
      module.exams.forEach((exam) => {
        Object.entries(exam.grades).forEach(([grade, count]) => {
          const numericGrade = parseFloat(grade);
          totalGradeSum += numericGrade * count;
          totalCount += count;
        });
      });
  
      return totalCount > 0 ? totalGradeSum / totalCount : 0;
    };
    const aHasExams = a.exams.length > 0;
    const bHasExams = b.exams.length > 0;
    const aGrade = calculateOverallAverage(a);
    const bGrade = calculateOverallAverage(b);
    switch (currentSort) {
      case "gradeAsc":
        if (!aHasExams && bHasExams) return 1;
        if (!bHasExams && aHasExams) return -1;
        return aGrade - bGrade;
      case "gradeDesc":
        if (!aHasExams && bHasExams) return 1;
        if (!bHasExams && aHasExams) return -1;
        return bGrade - aGrade;
      case "nameAsc":
        return a.name.localeCompare(b.name);
      case "nameDesc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  // Render modules
  const container = document.getElementById("module-container");
  container.innerHTML = "";
  sortedModules.forEach(([_, card]) => {
    container.appendChild(card);
  });
}

const chartInstances = {};
function createGradeChart(module, index) {
  const canvasId = "modal-chart";
  const ctx = document.getElementById(canvasId);

  // Destroy previous chart
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const labels = Object.keys(module.exams[index].grades);
  const data = Object.values(module.exams[index].grades);

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  chartInstances[canvasId] = chart;
}
