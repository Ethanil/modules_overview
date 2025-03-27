document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch("data/modules.json");
  const data = await response.json();

  data.modules.forEach((module) => {
      const moduleCard = document.createElement("div");
      moduleCard.className = "module-card";
      
      let examOptions = "";
      let examDetails = "";

      module.exams.sort((a, b) => new Date(b.written_date) - new Date(a.written_date))
          .forEach((exam, index) => {
              const written_date = new Date(exam.written_date);
              const semester = `${written_date.getMonth() > 5 ? "SS" : "WS"}${written_date.getFullYear()}`;
              
              examOptions += `<option value="${index}">Exam ${semester}</option>`;

              examDetails += `
                  <div class="exam-details" id="exam-${module.id}-${index}" style="display: ${index === 0 ? 'block' : 'none'};">
                      <p><strong>Average grade:</strong> ${exam.average}</p>
                      <button class="show-chart-btn" data-module-id="${module.id}" data-exam-index="${index}">Show Grading Chart</button>
                  </div>
              `;
          });

      moduleCard.innerHTML = `
          <h2 class="module-title">${module.name} (${module.Creditpoints || "?"} CP)</h2>
          <div class="module-details">
              <button class="toggle-description-btn">Show Description</button>
              <div class="description collapsed">
                  <p><strong>Description:</strong> ${module.description || "No description available."}</p>
                  <p><strong>Lecturer(s):</strong> ${module.lecturer}</p>
                  <p><strong>URL:</strong> <a href="${module.url}" target="_blank">Course Link</a></p>
                  <p><strong>Field of Study:</strong> ${module.fields.join(", ")}</p>
                  <p><strong>Term:</strong> ${module.terms.join(", ")}</p>
                  <p><strong>Exam type:</strong> ${module.exam_type || "Not specified"}</p>
                  ${module.bonus ? `<p><strong>Bonus:</strong> ${module.bonus.description} (Max grade improvement: ${module.bonus.maximum_bonus})</p>` : ""}
              </div>
              ${examOptions ? `<div class="exams-section">
                  <select class="exam-dropdown">
                      ${examOptions}
                  </select>
                  ${examDetails}
              </div>`:""}

          </div>
      `;

      document.getElementById("module-container").appendChild(moduleCard);

      // Dropdown event listener
      const examDropdown = moduleCard.querySelector(".exam-dropdown");
      examDropdown?.addEventListener("change", (event) => {
          const selectedIndex = event.target.value;
          module.exams.forEach((_, index) => {
              document.getElementById(`exam-${module.id}-${index}`).style.display = "none";
          });
          document.getElementById(`exam-${module.id}-${selectedIndex}`).style.display = "block";
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
              document.getElementById("modal-chart").setAttribute("data-module-id", moduleId);
              document.getElementById("modal-chart").setAttribute("data-exam-index", examIndex);

              createGradeChart(module, examIndex);
          });
      });

      // Toggle description button
      const toggleButton = moduleCard.querySelector(".toggle-description-btn");
      const description = moduleCard.querySelector(".description");
      toggleButton.addEventListener("click", () => {
          description.classList.toggle("collapsed");
          toggleButton.textContent = description.classList.contains("collapsed") ? "Show Description" : "Hide Description";
      });
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
});

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
          datasets: [{
              data: data,
              backgroundColor: "rgba(54, 162, 235, 0.5)",
          }],
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
