document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("data/modules.json");
    const data = await response.json();
  
    data.modules.forEach((module) => {
      const moduleCard = document.createElement("div");
      moduleCard.className = "module-card";
      let exams = "";
      let examNavigation = "";
  
      // Create exam details and navigation buttons
      module.exams.forEach((exam, index) => {
        const written_date = new Date(exam.written_date);
        const results_received = new Date(exam.result_release);
        const daysForCorrection =
          (results_received - written_date) / (1000 * 60 * 60 * 24);
  
        exams += `
            <div class="exam-details" id="exam-${module.id}-${index}">
              <p><strong>Written on:</strong> ${written_date.toLocaleDateString()}</p>
              <p><strong>Results received on:</strong> ${results_received.toLocaleDateString()} 
                 <span>(Days for correction: ${daysForCorrection})</span>
              </p>
              <p><strong>Average grade:</strong> ${calculateAverageGrade(
                exam
              )}</p>
              <div class="chart-container">
                  <canvas id="chart-${module.id}-${index}"></canvas>
              </div>
            </div>
          `;
  
        // Create navigation buttons
        const semester = `${
          written_date.getMonth() > 5 && written_date.getMonth() <= 11
            ? "SS"
            : "WS"
        }${written_date.getFullYear()}`;
        examNavigation += `
            <button class="nav-button" data-exam-index="${index}">Exam ${semester}</button>
          `;
      });
  
      moduleCard.innerHTML = `
            <h2 class="module-title">${module.name}</h2>
            <div class="module-details">
              <button class="toggle-description-btn">Show Description</button>
              <div class="description collapsed">
                <p><strong>Description:</strong> ${
                  module.description || "No description available."
                }</p>
                <p><strong>Lecturer(s):</strong> ${module.lecturer}</p>
                <p><strong>URL:</strong> <a href="${module.url}" target="_blank">Course Link</a></p>
                <p><strong>Field of Study:</strong> ${module.fields.join(
                  ", "
                )}</p>
                <p><strong>Term:</strong> ${module.terms.join(", ")}</p>
                <p><strong>Exam type:</strong> ${
                  module.exam_type || "Not specified"
                }</p>
                ${
                  module.bonus
                    ? `<p><strong>Bonus:</strong> ${module.bonus.description} (Max grade improvement: ${module.bonus.maximum_bonus})</p>`
                    : ""
                }
              </div>
              <div class="exams-section">
                ${exams}
                <div class="exam-navigation">
                  ${examNavigation}
                </div>
              </div>
            </div>
          `;
  
      document.getElementById("module-container").appendChild(moduleCard);
  
      module.exams.forEach((exam, index) => {
        if (index !== 0) {
          document.getElementById(`exam-${module.id}-${index}`).style.display =
            "none";
        } else {
          document.getElementById(`exam-${module.id}-${index}`).style.display =
            "block";
        }
      });
  
      module.exams.forEach((exam, index) => {
        createGradeChart(module, index);
      });
  
      const toggleButton = moduleCard.querySelector(".toggle-description-btn");
      const description = moduleCard.querySelector(".description");
      toggleButton.addEventListener("click", () => {
        description.classList.toggle("collapsed");
        toggleButton.textContent = description.classList.contains("collapsed")
          ? "Show Description"
          : "Hide Description";
      });
  
      const navButtons = moduleCard.querySelectorAll(".nav-button");
      navButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const selectedIndex = button.getAttribute("data-exam-index");
  
          module.exams.forEach((exam, index) => {
            document.getElementById(`exam-${module.id}-${index}`).style.display =
              "none";
          });
  
          document.getElementById(
            `exam-${module.id}-${selectedIndex}`
          ).style.display = "block";
  
          createGradeChart(module, selectedIndex);
        });
      });
    });
  });

function calculateAverageGrade(exam) {
  const { totalStudents, totalGradePoints } = Object.entries(
    exam.grades
  ).reduce(
    (acc, [gradeStr, count]) => {
      const grade = parseFloat(gradeStr);
      if (!Number.isNaN(grade) && Number.isInteger(count) && count > 0) {
        acc.totalStudents += count;
        acc.totalGradePoints += grade * count;
      }
      return acc;
    },
    { totalStudents: 0, totalGradePoints: 0 }
  );

  return totalStudents > 0
    ? Math.round((totalGradePoints / totalStudents) * 1000) / 1000
    : null;
}
const chartInstances = {};
function createGradeChart(module, index) {
  const canvasId = `chart-${module.id}-${index}`;
  const ctx = document.getElementById(canvasId);

  // Destroy the previous chart if it exists
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
        legend: {
          display: false, 
        },
      },
    },
  });

  // Store the new chart instance
  chartInstances[canvasId] = chart;
}
