// Show today's date in the header 
const dateEl = document.getElementById("date");
const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
});
dateEl.textContent = formattedDate;

//Loads tasks from storage or starts fresh is none exist
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Basic To-Do List functionality
const input = document.querySelector(".todo input");
const taskList = document.getElementById("task-list");
const filterSelect = document.getElementById("filter-select"); // Optional filter dropdown
const categorySelect = document.getElementById("category-select");

function updateStats(){
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const today = new Date().toISOString().split('T')[0];

    const completedToday = tasks.filter(task => 
        task.completed && task.completedDate === today
    ).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    document.getElementById('completed-today').textContent = completedToday;
    document.getElementById('completion-rate').textContent = totalTasks > 0
    ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%';
}

input.addEventListener("keypress", function (e){
    if(e.key === "Enter" && input.value.trim() !== ""){
        // Add to tasks array
        tasks.push({
            text: input.value.trim(),
            completed: false,
            category: categorySelect.value
        });

        // Save and re-render
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();

        // Clear input
        input.value = "";
    }
});

// Format Category Function
function formatCategory(value) {
    switch(value) {
        case "urgent-important": return "🔥 Urgent & Important";
        case "urgent-not-important": return "⚡ Urgent, Not Important";
        case "not-urgent-important": return "🌱 Not Urgent, Important";
        case "not-urgent-not-important": return "🌈 Chill (Not Urgent/Important)";
        default: return "";
    }
}


// Function to render tasks
function renderTasks(filter = "all") {
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        if(filter === "completed" && !task.completed) return;
        if(filter === "active" && task.completed) return;

        const taskItem = document.createElement("li");
        taskItem.classList.add("task");

        // Add Switch for color class
        switch(task.category){
            case 'urgent-important':
                taskItem.classList.add('urgent-important');
                break;
            case 'urgent-not-important':
                taskItem.classList.add('urgent-not-important');
                break;
            case 'not-urgent-important':
                taskItem.classList.add('not-urgent-important');
                break;
            case 'not-urgent-not-important':
                taskItem.classList.add('not-urgent-not-important');
                break;
        }

        // Enables drag icon
        const dragHandle = document.createElement("span");
        dragHandle.classList.add("drag-handle");
        dragHandle.textContent = "⋮⋮";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("task-checkbox");
        checkbox.checked = task.completed;

        const taskText = document.createElement("span");
        taskText.textContent = task.text;
        taskText.classList.add("task-text");
        if(task.completed) taskText.classList.add("completed");

        const categoryTag = document.createElement("span");
        categoryTag.classList.add("category-tag");
        categoryTag.textContent = formatCategory(task.category);

        const taskContent = document.createElement("div");
        taskContent.classList.add("task-content");

        taskContent.appendChild(taskText);
/*
        if(task.dueDate){
            const dueEl = document.createElement("span");
            dueEl.textContent = `Due: ${new Date(task.dueDate).toLocaleDateString()}`;
            dueEl.classList.add("due-date");
            taskItem.appendChild(dueEl);
        }
*/
        
        // Toggle task completion
        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;

            // Save today's date when task is marked complete
            if(task.completed){
                task.completedDate = new Date().toISOString().split('T')[0];
            } else {
                delete task.completedDate;
            }

            // Saves and updates local storage
            localStorage.setItem("tasks", JSON.stringify(tasks));
            renderTasks(filterSelect.value);
            updateStats(); // Tracks progress in real-time

            // Confetti when task is completed
            function celebrateBurst(){
                const defaults = {
                    origin: {y: 0.6}
                };

                function fire(particleRatio, opts){
                    confetti(Object.assign({}, defaults, opts, {
                        particleCount: Math.floor(200 * particleRatio)
                    }));
                }

                fire(0.25, {
                    spread: 26,
                    startVelocity: 55,
                });
                fire(0.2, {
                    spread: 60,
                });
                fire(0.35, {
                    spread: 100,
                    decay: 0.91,
                    scaler: 0.8
                });
                fire(0.1, {
                    spread: 120,
                    startVelocity: 25,
                    decay: 0.92,
                    scaler: 1.2
                });
                fire(0.1, {
                    spread: 120,
                    startVelocity: 45,
                });
            }
            if(task.completed){
                celebrateBurst();
            }
        });

        // Double-click to edit
        taskText.addEventListener("dblclick", () => {
            const inputEdit = document.createElement("input");
            inputEdit.type = "text";
            inputEdit.value = task.text;
            inputEdit.classList.add("edit-input");

            // Replace the span with input
            taskItem.replaceChild(inputEdit, taskText);
            inputEdit.focus();

            inputEdit.addEventListener("blur", () => {
                // Update in localStorage if needed
                tasks[index].text = inputEdit.value;
                localStorage.setItem("tasks", JSON.stringify(tasks));
                renderTasks(filterSelect.value);
            });

            inputEdit.addEventListener("keydown", (e) => {
                if(e.key === "Enter") inputEdit.blur();
            });
     });
          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "🗑️";
          deleteBtn.classList.add("delete-btn");
           // Add click event to delete task
         deleteBtn.addEventListener("click", () => {
            tasks.splice(index, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks(filterSelect.value);
        });

          // Assemble the task item
          taskItem.appendChild(dragHandle);
          taskItem.appendChild(checkbox);
          taskItem.appendChild(taskText);
          taskItem.appendChild(categoryTag);
          taskItem.appendChild(taskContent);
          taskItem.appendChild(deleteBtn);
          taskList.appendChild(taskItem);

           // Trigger fade-in
        setTimeout(() => {
            taskItem.classList.add("show");
        }, 10);
    });  
};

// Enable SortableJS (for drag and drop feature)
new Sortable(taskList, {
    animation: 150,
    handle: ".drag-handle",
    ghostClass: "placeholder",    // placeholder for where item is dropping
    chosenClass: "dragging",      // the dragged item
    onEnd: function(evt){
        const currentFilter = filterSelect.value;

        if(currentFilter === "completed") return; // No dragging allowed here

        // Get the filtered list of tasks
        let filteredTasks = tasks.filter(task => {
            if(currentFilter === "active") return !task.completed;
            return true; // 'all'
        });
        
        // Remove and re-insert in filtered view
        const movedItem = filteredTasks.splice(evt.oldIndex, 1)[0];
        filteredTasks.splice(evt.newIndex, 0, movedItem);

        //Rebuild the full tasks array based on new filtered order
        let newTasks = [];
        let filteredIndex = 0;
        for(let task of tasks){
            if((currentFilter === "active" && !task.completed) || currentFilter === "all"){
                newTasks.push(filteredTasks[filteredIndex]);
                filteredIndex++;
            } else {
                newTasks.push(task);
            }
        }

        tasks = newTasks;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks(currentFilter);

     // Animation for dropped item
     const listItems = taskList.querySelectorAll(".task");
     const droppedEl = listItems[evt.newIndex];
     if(droppedEl){
        droppedEl.classList.add("dropped");
        setTimeout(() => droppedEl.classList.remove("dropped"), 400);
     }   
    }
});

// Filter Logic
if(filterSelect){
    filterSelect.addEventListener("change", (e) => {
        renderTasks(e.target.value);
    });
}

// Initial Render
renderTasks();
updateStats(); // Keep dashboard in sync on initial load


