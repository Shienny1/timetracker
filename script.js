
const form = document.getElementById("logForm");
const summaryList = document.getElementById("summaryList");
let logs = JSON.parse(localStorage.getItem("timeLogs")) || [];
let currentDate = new Date();
let editingIndex = -1;

function updateSummary() {
  const summary = {};

  logs.forEach(log => {
    const totalMinutes = parseInt(log.duration);
    summary[log.category] = (summary[log.category] || 0) + totalMinutes;
  });

  summaryList.innerHTML = "";
  for (let cat in summary) {
    const li = document.createElement("li");
    const hours = Math.floor(summary[cat] / 60);
    const minutes = summary[cat] % 60;
    li.textContent = `${cat}: ${hours}h ${minutes}m`;
    summaryList.appendChild(li);
  }
}

// Set default date to today
document.getElementById("date").value = new Date().toISOString().split('T')[0];

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const category = document.getElementById("category").value;
  const notes = document.getElementById("notes").value;
  const hours = parseInt(document.getElementById("hours").value) || 0;
  const minutes = parseInt(document.getElementById("minutes").value) || 0;
  const duration = hours * 60 + minutes; // Store as total minutes
  const date = document.getElementById("date").value;

  logs.push({ category, notes, duration, date });
  localStorage.setItem("timeLogs", JSON.stringify(logs));
  updateSummary();
  updateCalendar();
  showWeeklyCharts();
  showWeekComparison();

  form.reset();
  document.getElementById("date").value = new Date().toISOString().split('T')[0];
});

// Initialize app

// Initialize existing logs with today's date if missing
logs = logs.map(log => ({
  ...log,
  date: log.date || new Date().toISOString().split('T')[0]
}));
localStorage.setItem("timeLogs", JSON.stringify(logs));

updateSummary();
updateCalendar();
showWeeklyCharts();
showWeekComparison();

function updateCalendar() {
  const calendar = document.getElementById("calendar");
  const monthSpan = document.getElementById("currentMonth");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthSpan.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  calendar.innerHTML = "";

  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    const headerDiv = document.createElement("div");
    headerDiv.className = "calendar-header";
    headerDiv.textContent = day;
    calendar.appendChild(headerDiv);
  });

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-day";
    calendar.appendChild(emptyDiv);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    // Get logs for this day
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayLogs = logs.filter(log => log.date === dateStr);

    dayLogs.forEach((log, index) => {
      const timeBlock = document.createElement("div");
      timeBlock.className = `time-block ${log.category.toLowerCase().replace(/\s+/g, '-')}`;
      const hours = Math.floor(log.duration / 60);
      const minutes = log.duration % 60;
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      timeBlock.textContent = `${log.category}: ${timeStr}`;
      timeBlock.title = log.notes || log.category;
      timeBlock.onclick = (e) => {
        e.stopPropagation();
        openEditModal(logs.findIndex(l => l === log));
      };
      dayDiv.appendChild(timeBlock);
    });

    // Add click handler to add new entry for this date
    dayDiv.onclick = () => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      document.getElementById("date").value = dateStr;
      document.getElementById("logForm").scrollIntoView({ behavior: 'smooth' });
    };

    calendar.appendChild(dayDiv);
  }
}

function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  updateCalendar();
}

function openEditModal(index) {
  editingIndex = index;
  const log = logs[index];

  document.getElementById("editIndex").value = index;
  document.getElementById("editCategory").value = log.category;
  document.getElementById("editNotes").value = log.notes || "";
  
  const hours = Math.floor(log.duration / 60);
  const minutes = log.duration % 60;
  document.getElementById("editHours").value = hours;
  document.getElementById("editMinutes").value = minutes;
  document.getElementById("editDate").value = log.date;

  document.getElementById("editModal").style.display = "block";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  editingIndex = -1;
}

function deleteEntry() {
  if (editingIndex >= 0 && confirm("Are you sure you want to delete this entry?")) {
    logs.splice(editingIndex, 1);
    localStorage.setItem("timeLogs", JSON.stringify(logs));
    updateSummary();
    updateCalendar();
    closeEditModal();
  }
}

// Edit form submission
document.getElementById("editForm").addEventListener("submit", function(e) {
  e.preventDefault();

  if (editingIndex >= 0) {
    const hours = parseInt(document.getElementById("editHours").value) || 0;
    const minutes = parseInt(document.getElementById("editMinutes").value) || 0;
    const duration = hours * 60 + minutes;

    logs[editingIndex] = {
      category: document.getElementById("editCategory").value,
      notes: document.getElementById("editNotes").value,
      duration: duration,
      date: document.getElementById("editDate").value
    };

    localStorage.setItem("timeLogs", JSON.stringify(logs));
    updateSummary();
    updateCalendar();
    closeEditModal();
  }
});

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    closeEditModal();
  }
};

function getDateRange(startDate, endDate) {
  return logs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= startDate && logDate <= endDate;
  });
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function showWeeklyAnalytics() {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekLogs = getDateRange(weekStart, weekEnd);
  const summary = {};

  weekLogs.forEach(log => {
    summary[log.category] = (summary[log.category] || 0) + parseInt(log.duration);
  });

  const resultsDiv = document.getElementById("weeklyResults");
  resultsDiv.innerHTML = "<h4>This Week's Hours by Category:</h4>";

  for (let cat in summary) {
    const hours = Math.floor(summary[cat] / 60);
    const minutes = summary[cat] % 60;
    const div = document.createElement("div");
    div.className = "analytics-result";
    div.textContent = `${cat}: ${hours}h ${minutes}m`;
    resultsDiv.appendChild(div);
  }

  if (Object.keys(summary).length === 0) {
    resultsDiv.innerHTML += "<p>No entries found for this week.</p>";
  }
}

function showWeekComparison() {
  const today = new Date();
  const weeks = [];
  
  // Get last 3 weeks
  for (let i = 0; i < 3; i++) {
    const weekStart = getWeekStart(today);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekLogs = getDateRange(weekStart, weekEnd);
    const weekSummary = {};
    
    weekLogs.forEach(log => {
      weekSummary[log.category] = (weekSummary[log.category] || 0) + parseInt(log.duration);
    });
    
    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      summary: weekSummary,
      label: i === 0 ? "This Week" : i === 1 ? "Last Week" : "2 Weeks Ago"
    });
  }

  const resultsDiv = document.getElementById("weekComparisonResults");
  resultsDiv.innerHTML = "<h4>Last 3 Weeks Comparison:</h4>";
  
  const weekComparisonDiv = document.createElement("div");
  weekComparisonDiv.className = "week-comparison";
  
  weeks.forEach(week => {
    const weekDiv = document.createElement("div");
    weekDiv.className = "week-summary";
    
    let content = `<h5>${week.label}</h5>`;
    content += `<small>${week.start.toLocaleDateString()} - ${week.end.toLocaleDateString()}</small><br>`;
    
    if (Object.keys(week.summary).length === 0) {
      content += "<em>No entries this week</em>";
    } else {
      Object.entries(week.summary).forEach(([cat, minutes]) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        content += `${cat}: ${hours}h ${mins}m<br>`;
      });
    }
    
    weekDiv.innerHTML = content;
    weekComparisonDiv.appendChild(weekDiv);
  });
  
  resultsDiv.appendChild(weekComparisonDiv);
}

function showMonthComparison() {
  const weekResults = document.getElementById("weekComparisonResults");
  const monthResults = document.getElementById("monthComparisonResults");
  
  if (monthResults.style.display === "none") {
    weekResults.style.display = "none";
    monthResults.style.display = "block";
    
    const today = new Date();
    const months = [];
    
    // Get last 3 months
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthLogs = getDateRange(monthStart, monthEnd);
      const monthSummary = {};
      
      monthLogs.forEach(log => {
        monthSummary[log.category] = (monthSummary[log.category] || 0) + parseInt(log.duration);
      });
      
      months.push({
        start: new Date(monthStart),
        end: new Date(monthEnd),
        summary: monthSummary,
        label: i === 0 ? "This Month" : i === 1 ? "Last Month" : "2 Months Ago"
      });
    }

    monthResults.innerHTML = "<h4>Last 3 Months Comparison:</h4>";
    
    const monthComparisonDiv = document.createElement("div");
    monthComparisonDiv.className = "week-comparison";
    
    months.forEach(month => {
      const monthDiv = document.createElement("div");
      monthDiv.className = "week-summary";
      
      let content = `<h5>${month.label}</h5>`;
      content += `<small>${month.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</small><br>`;
      
      if (Object.keys(month.summary).length === 0) {
        content += "<em>No entries this month</em>";
      } else {
        Object.entries(month.summary).forEach(([cat, minutes]) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          content += `${cat}: ${hours}h ${mins}m<br>`;
        });
      }
      
      monthDiv.innerHTML = content;
      monthComparisonDiv.appendChild(monthDiv);
    });
    
    monthResults.appendChild(monthComparisonDiv);
  } else {
    weekResults.style.display = "block";
    monthResults.style.display = "none";
  }
}

function exportCSV(filterCategory = null) {
  const header = ["Category", "Notes", "Hours", "Minutes", "Date"];
  const rows = logs
    .filter(log => !filterCategory || log.category === filterCategory)
    .map(log => {
      const hours = Math.floor(log.duration / 60);
      const minutes = log.duration % 60;
      return [log.category, log.notes || "", hours, minutes, log.date];
    });

  const csvContent = [header, ...rows]
    .map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filterCategory ? "paying_work.csv" : "all_logs.csv");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportLogs() {
  const category = document.getElementById("exportCategory").value;
  const period = document.getElementById("exportPeriod").value;
  
  let filteredLogs = logs;
  
  // Filter by category
  if (category) {
    filteredLogs = filteredLogs.filter(log => log.category === category);
  }
  
  // Filter by period
  if (period === "quarter") {
    const today = new Date();
    const currentQuarter = Math.floor(today.getMonth() / 3);
    const quarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
    const quarterEnd = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);
    filteredLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= quarterStart && logDate <= quarterEnd;
    });
  }

  const header = ["Category", "Notes", "Hours", "Minutes", "Date"];
  const rows = filteredLogs.map(log => {
    const hours = Math.floor(log.duration / 60);
    const minutes = log.duration % 60;
    return [log.category, log.notes || "", hours, minutes, log.date];
  });

  const csvContent = [header, ...rows]
    .map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const categoryName = category ? category.toLowerCase().replace(/\s+/g, '_') : 'all';
  const periodName = period === "quarter" ? "quarter" : "all_time";
  link.setAttribute("href", url);
  link.setAttribute("download", `${categoryName}_${periodName}.csv`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function drawPieChart(data) {
  const canvas = document.getElementById("pieChart");
  const ctx = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 100;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#E91E63", "#00BCD4", "#795548", "#607D8B"];
  
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    ctx.fillStyle = "#ccc";
    ctx.fillText("No data for this week", centerX - 60, centerY);
    return;
  }

  let currentAngle = 0;
  const categories = Object.keys(data);
  
  categories.forEach((category, index) => {
    const sliceAngle = (data[category] / total) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    
    // Add labels
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
    const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
    
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    const hours = Math.floor(data[category] / 60);
    const minutes = data[category] % 60;
    ctx.fillText(`${category}: ${hours}h ${minutes}m`, labelX, labelY);
    
    currentAngle += sliceAngle;
  });
}

function drawBarChart(data) {
  const canvas = document.getElementById("barChart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxHours = Math.max(...Object.values(data)) / 60;
  const barWidth = (width - 2 * padding) / 7;

  // Draw axes
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  // Draw bars and labels
  days.forEach((day, index) => {
    const barHeight = data[day] ? (data[day] / 60 / maxHours) * (height - 2 * padding) : 0;
    const x = padding + index * barWidth + barWidth * 0.1;
    const y = height - padding - barHeight;

    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(x, y, barWidth * 0.8, barHeight);

    // Day labels
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(day, x + barWidth * 0.4, height - padding + 20);

    // Hour labels on bars
    if (data[day]) {
      const hours = Math.floor(data[day] / 60);
      ctx.fillText(`${hours}h`, x + barWidth * 0.4, y - 5);
    }
  });

  // Y-axis labels
  ctx.textAlign = "right";
  for (let i = 0; i <= maxHours; i += Math.max(1, Math.floor(maxHours / 5))) {
    const y = height - padding - (i / maxHours) * (height - 2 * padding);
    ctx.fillText(`${i}h`, padding - 10, y);
  }
}

function showWeeklyCharts() {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekLogs = getDateRange(weekStart, weekEnd);
  
  // Data for pie chart (by category)
  const categoryData = {};
  weekLogs.forEach(log => {
    categoryData[log.category] = (categoryData[log.category] || 0) + parseInt(log.duration);
  });

  // Data for bar chart (by day)
  const dayData = {};
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  weekLogs.forEach(log => {
    const logDate = new Date(log.date);
    const dayName = days[logDate.getDay()];
    dayData[dayName] = (dayData[dayName] || 0) + parseInt(log.duration);
  });

  drawPieChart(categoryData);
  drawBarChart(dayData);
}
