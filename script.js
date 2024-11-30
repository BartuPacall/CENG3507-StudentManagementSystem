// defines the grading scales for courses
const gradingScales = {
  sevenpointscale: { A: 93, B: 85, C: 77, D: 69 },
  tenpointscale: { A: 90, B: 80, C: 70, D: 60 },
};

// load saved data from LocalStorage or initialize with default empty values if none exist
let students = JSON.parse(localStorage.getItem("students")) || []; // students stores the list of all students.
let courses = JSON.parse(localStorage.getItem("courses")) || []; // courses contains the list of all courses
let courseGradingScales =
  JSON.parse(localStorage.getItem("courseGradingScales")) || {}; // courseGradingScales maps each course to its grading scale.

// function to calculate the final letter grade based on midterm and final scores
function calculateGrade(midtermScore, finalScore, scale) {
  const score = midtermScore * 0.4 + finalScore * 0.6;
  return score >= scale.A
    ? "A"
    : score >= scale.B
    ? "B"
    : score >= scale.C
    ? "C"
    : score >= scale.D
    ? "D"
    : "F";
}

document.addEventListener("DOMContentLoaded", () => {
  // render initial data
  renderCourses();
  renderTable();

  // tab switching
  const tabs = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");

      // remove active class from all tabs and tab contents
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((tc) => tc.classList.remove("active"));

      // add active class to clicked tab and corresponding content
      tab.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });
});

// existing event listeners for forms
document.getElementById("course-form").addEventListener("submit", addCourse);
document.getElementById("student-form").addEventListener("submit", addStudent);
// dynamically refreshes the course list
function renderCourses() {
  const courseList = document.getElementById("course-list");
  const courseSelect = document.getElementById("courseSelect");
  const courseFilter = document.getElementById("courseFilter");

  // clear existing content in the list and dropdowns
  courseList.innerHTML = "";
  courseSelect.innerHTML = `<option value="" disabled selected>Choose a course</option>`;
  courseFilter.innerHTML = `<option value="">All courses</option>`;

  courses.forEach((course, index) => {
    // create a list item for each course with its grading scale
    const li = document.createElement("li");
    li.textContent = `${course} (${
      courseGradingScales[course] === "sevenpointscale"
        ? "7 Point scale"
        : "10 Point scale"
    } System)`;

    // add a delete button for removing the course
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Sil";
    deleteBtn.setAttribute("data-course", course);
    deleteBtn.addEventListener("click", deleteCourse);
    li.appendChild(deleteBtn).style.margin = "10px";

    courseList.appendChild(li); // append the list item to the course list

    // create and append an option for course selection in forms
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    courseSelect.appendChild(option);

    // create and append an option for filtering students by course
    const filterOption = document.createElement("option");
    filterOption.value = course;
    filterOption.textContent = course;
    courseFilter.appendChild(filterOption);
  });
}

function updateStatistics() {
  const stats = calculateStatisticsByCourse(); // calculate statistics passed, failed, and average score
  // update the DOM elements with the calculated statistics
  document.getElementById("passedCount").textContent = stats.passedCount;
  document.getElementById("failedCount").textContent = stats.failedCount;
  document.getElementById("meanScore").textContent = stats.meanScore;
}

// update student table
function renderTable() {
  const tableBody = document.querySelector("#student-table tbody");
  const searchInput = document
    .getElementById("nameSearch")
    .value.toLowerCase()
    .trim(); // user input
  const courseFilter = document.getElementById("courseFilter").value;

  tableBody.innerHTML = "";

  // filter students based on search input and course filter
  const filteredStudents = students.filter((student) => {
    const studentData =
      `${student.firstName} ${student.lastName} ${student.number} ${student.course}${student.midtermScore}${student.final}`.toLowerCase();
    const nameMatch = studentData.includes(searchInput); // Arama metnini kontrol et
    const courseMatch = courseFilter === "" || student.course === courseFilter; // Kurs filtresini kontrol et

    return nameMatch && courseMatch;
  });

  // add filtered students to the table
  filteredStudents.forEach((student, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.firstName}</td>
      <td>${student.lastName}</td>
      <td>${student.number}</td>
      <td>${student.course}</td>
      <td>${student.midtermScore}</td>
      <td>${student.finalScore}</td>
      <td>${student.letterGrade}</td>
      <td><button class="edit-btn" data-original-index="${students.indexOf(
        student
      )}">Update</button></td>
      <td><button class="delete-btn" data-index="${index}">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });

  // listeners for edit and delete actions
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", openEditModal);
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", deleteStudent);
  });

  updateStatistics(); // for refresh statistics
}

// adds a new course to the system if course name unique
function addCourse(event) {
  event.preventDefault(); // prevent the form from refreshing the page
  const courseName = document.getElementById("courseName").value.trim();
  const gradingScale = document.querySelector(
    'input[name="gradingScale"]:checked'
  ).value;

  if (courseName && !courses.includes(courseName)) {
    courses.push(courseName);

    // Save the course's grading scale
    courseGradingScales[courseName] = gradingScale;

    // Save updated data to LocalStorage
    localStorage.setItem("courses", JSON.stringify(courses));
    localStorage.setItem(
      "courseGradingScales",
      JSON.stringify(courseGradingScales)
    );

    renderCourses();
    document.getElementById("course-form").reset(); // reset the form fields
  } else {
    alert("This course name already exists!"); // if the course name already exists, an error message is displayed
  }
}

function deleteCourse(event) {
  const courseName = event.target.getAttribute("data-course");

  // check if any students are enrolled in the course
  const hasStudents = students.some((student) => student.course === courseName);
  if (hasStudents) {
    alert(
      "There are students enrolled in this course! Please remove the students first."
    );
    return;
  } // exit the function without deleting the course

  // remove the course
  courses = courses.filter((course) => course !== courseName);
  delete courseGradingScales[courseName];

  // update LocalStorage with the modified courses and grading scales
  localStorage.setItem("courses", JSON.stringify(courses));
  localStorage.setItem(
    "courseGradingScales",
    JSON.stringify(courseGradingScales)
  );

  // refresh the course
  renderCourses();
}

// adds a new student to the system
function addStudent(event) {
  event.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const number = document.getElementById("number").value.trim();
  const course = document.getElementById("courseSelect").value;
  const midtermScore = parseFloat(
    document.getElementById("midtermScore").value
  );
  const finalScore = parseFloat(document.getElementById("finalScore").value);

  // check if the student is already enrolled in the selected course
  const studentExists = students.some(
    (student) => student.number === number && student.course === course
  );

  if (studentExists) {
    alert("This student is already enrolled in this course!"); // show error if student is already enrolled
    return;
  }

  // check if all required fields are filled
  if (firstName && lastName && number && course && midtermScore && finalScore) {
    const gradingScale = gradingScales[courseGradingScales[course]];

    const letterGrade = calculateGrade(midtermScore, finalScore, gradingScale);

    students.push({
      firstName,
      lastName,
      number,
      course,
      midtermScore,
      finalScore,
      letterGrade,
    });

    // save the updated student list to LocalStorage
    localStorage.setItem("students", JSON.stringify(students));
    renderTable();
    document.getElementById("student-form").reset(); // reset the form fields
  } else {
    alert("Please fill in all the fields!"); // show alert if any fields are missing
  }
  // update the student dropdown list
  populateStudentDropdown();
}

// updates the statistics for the selected course or all students
function updateStatistics() {
  const selectedCourse = document.getElementById("courseFilter").value;

  // filter students by the selected course or show all if no course is selected
  const filteredStudents =
    selectedCourse === ""
      ? students
      : students.filter((student) => student.course === selectedCourse);

  let passedCount = 0;
  let failedCount = 0;
  let totalScore = 0;

  // calculate the statistics for each filtered student
  filteredStudents.forEach((student) => {
    const weightedScore = student.midtermScore * 0.4 + student.finalScore * 0.6;
    totalScore += weightedScore;

    // count passed and failed students
    if (student.letterGrade !== "F") {
      passedCount++;
    } else {
      failedCount++;
    }
  });

  // calculate the mean score and format to 2 decimal places
  const meanScore =
    filteredStudents.length > 0
      ? (totalScore / filteredStudents.length).toFixed(2)
      : 0;

  // update the statistics on the DOM
  document.getElementById("passedCount").textContent = passedCount;
  document.getElementById("failedCount").textContent = failedCount;
  document.getElementById("meanScore").textContent = meanScore;
}

// deletes a student from the system
function deleteStudent(event) {
  const index = event.target.getAttribute("data-index"); // get button's index
  students.splice(index, 1); // remove the student from the students array
  localStorage.setItem("students", JSON.stringify(students)); // update LocalStorage with the new student list
  renderTable(); // refresh student table
  populateStudentDropdown(); // rebuild dropdownlist

  // if the deleted student was selected, reset the GPA display
  const selectedStudentId = document.getElementById("studentDropdown").value;
  if (!students.some((student) => student.number === selectedStudentId)) {
    document.getElementById("selectedGPA").textContent = "-"; // reset GPA if the selected student is deleted
  }
}

// populates the student dropdown with unique students and each student is added only once, based on their unique student id
function populateStudentDropdown() {
  const studentDropdown = document.getElementById("studentDropdown");
  studentDropdown.innerHTML = `<option value="" disabled selected>Choose student</option>`;

  const uniqueStudentIds = new Set();

  // iterate through the students and add each student to the dropdown
  students.forEach((student) => {
    if (!uniqueStudentIds.has(student.number)) {
      uniqueStudentIds.add(student.number);

      const option = document.createElement("option");
      option.value = student.number;
      option.textContent = `${student.firstName} ${student.lastName}`;
      studentDropdown.appendChild(option);
    }
  });
}

// Calculate and show gpa and if no student is selected, it shows a dash ("-") to indicate no gpa
function displayStudentGPA() {
  const selectedStudentId = document.getElementById("studentDropdown").value;

  if (selectedStudentId) {
    // filter the selected student's courses
    const studentCourses = students.filter(
      (student) => student.number === selectedStudentId
    );

    if (studentCourses.length === 0) {
      document.getElementById("selectedGPA").textContent = "-"; // if no courses, show "-"
      return;
    }

    let totalWeightedScore = 0;
    let totalCourses = 0;

    studentCourses.forEach((student) => {
      const weightedScore =
        student.midtermScore * 0.4 + student.finalScore * 0.6;
      totalWeightedScore += weightedScore;
      totalCourses++;
    });

    const averageScore = totalWeightedScore / totalCourses;
    const gpa = (averageScore / 100) * 4;

    document.getElementById("selectedGPA").textContent = gpa.toFixed(2); // show gpa rounded to 2 decimal places
  } else {
    document.getElementById("selectedGPA").textContent = "-";
  }
}

function openEditModal(event) {
  const index = event.target.getAttribute("data-original-index");
  const student = students[index];

  // prefilled the edit modal inputs
  document.getElementById("editFirstName").value = student.firstName;
  document.getElementById("editLastName").value = student.lastName;
  document.getElementById("editNumber").value = student.number;
  document.getElementById("editMidtermScore").value = student.midtermScore;
  document.getElementById("editFinalScore").value = student.finalScore;

  const modal = document.getElementById("edit-modal");
  const closeButton = document.querySelector(".close");

  // add a close button listener to hide the modal
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.style.display = "block";

  const form = document.getElementById("edit-student-form");
  form.onsubmit = function (e) {
    e.preventDefault();
    updateStudent(index);
  };
}

// updates the selected student's details and recalculates their grade.
function updateStudent(index) {
  const firstName = document.getElementById("editFirstName").value.trim();
  const lastName = document.getElementById("editLastName").value.trim();
  const number = document.getElementById("editNumber").value.trim();
  const midtermScore = parseFloat(
    document.getElementById("editMidtermScore").value
  );
  const finalScore = parseFloat(
    document.getElementById("editFinalScore").value
  );

  const currentNumber = students[index].number;

  // check for uniqueness if the student number has been changed
  if (currentNumber !== number) {
    const duplicate = students.some(
      (student, idx) => student.number === number && idx !== index
    );
    if (duplicate) {
      alert("This student id is already being used by another student!"); // show error if duplicate ID found
      return;
    }

    // update student number in all courses
    students.forEach((student) => {
      if (student.number === currentNumber) {
        student.number = number;
      }
    });
  }

  // ensure all fields are filled and scores are valid
  if (firstName && lastName && number && midtermScore >= 0 && finalScore >= 0) {
    students.forEach((student) => {
      if (student.number === number) {
        student.firstName = firstName;
        student.lastName = lastName;
      }
    });

    students[index].midtermScore = midtermScore;
    students[index].finalScore = finalScore;

    // recalculate the letter grade based on updated scores
    const gradingScale =
      gradingScales[courseGradingScales[students[index].course]];
    students[index].letterGrade = calculateGrade(
      midtermScore,
      finalScore,
      gradingScale
    );

    localStorage.setItem("students", JSON.stringify(students));
    renderTable();
    populateStudentDropdown();
    displayStudentGPA();

    document.getElementById("edit-modal").style.display = "none"; // close the edit modal
    alert("Student successfully updated!");
  } else {
    alert("Please fill in all the fields!");
  }
}

// executes initial setup and adds event listeners after the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  populateStudentDropdown();
  renderCourses();
  renderTable();

  document
    .getElementById("studentDropdown")
    .addEventListener("change", displayStudentGPA);

  document.getElementById("nameSearch").addEventListener("input", renderTable);
  document
    .getElementById("courseFilter")
    .addEventListener("change", renderTable);
});
