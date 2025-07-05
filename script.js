// Show today's date in the header 
const dateEl = document.getElementById("date");
const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
});
dateEl.textContent = formattedDate;

const lastMedalShown = localStorage.getItem("medalShownToday");
const todayStr = today.toISOString().split("T")[0];
if(lastMedalShown !== todayStr){
    localStorage.removeItem("medalShownToday");
}

// Loads tasks from storage or starts fresh if none exist
const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Helper function for optimization
function saveTasks(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Fix legacy tasks that are missing completedDate
tasks.forEach(task => {
    if(typeof task.completed !== 'boolean') task.completed = false;
    if(task.completed && !task.completedDate){
        task.completedDate = new Date().toISOString().split('T')[0];
    }
});
saveTasks();

// Basic To-Do List functionality
const input = document.getElementById("task-input");
const filterSelect = document.getElementById("filter-select"); // Optional filter dropdown
const categorySelect = document.getElementById("category-select");

// Function to load quotes
async function loadDailyQuote(){
    const quoteText = document.getElementById("quote-text");
    const quoteAuthor = document.getElementById("quote-author");

    try{
        const res = await fetch("https://api.quotable.io/random");
        const data = await res.json();

        quoteText.textContent = `"${data.content}"`;
        quoteAuthor.textContent = `- ${data.author}`;
    } catch (error){
        console.error("Quote fetch failed:", error);
        quoteText.textContent = `"Stay focused and keep building."`;
        quoteAuthor.textContent = "- AI Coach";
    }
}

window.addEventListener("DOMContentLoaded", loadDailyQuote);

// Animate a single value
function animateValue(element, start, end, duration){
    let startTimestamp = null;
    const step = (timestamp) => {
        if(!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = element.id === 'completion-rate' ? `${value}%` : value;
        if(progress < 1){
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Logic for 5 completed task medal popup
function showMedalPopUp(){
    const medalPopup = document.getElementById("medal-popup");
    if(!medalPopup) return;

    const medalSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_8bcee6994b.mp3"); // free success sound
    medalSound.play();

    medalPopup.classList.add("show", "medal-animate");
    medalPopup.style.display = "block";

    setTimeout(() => {
        medalPopup.classList.remove("medal-animate");
    }, 2500); // remove animation class before hiding

    setTimeout(() => {
        medalPopup.classList.remove("show");
        medalPopup.style.display = "none";
    }, 3000); // 3-second pop-up
}

// Clear completed task button logic
const clearCompletedBtn = document.getElementById("clear-completed-btn");

function updateClearButtonVisibility(){
    const filter = filterSelect?.value || "all";
    const hasCompletedTasks = tasks.some(task => task.completed);
    const clearBtn = document.getElementById("clear-completed-btn");

    if(!clearBtn) return;

    if(filter === "completed" && hasCompletedTasks){
        clearBtn.classList.add("show");
    } else {
        clearBtn.classList.remove("show");
    }
}

function updateStats(){
    const todayStr = new Date().toISOString().split("T")[0];

    const createdToday = tasks.filter(task => 
        String(task.createdAt || '').split('T')[0] === todayStr
    ).length;

    const completedToday = tasks.filter(task => 
        task.completed && task.completedDate === todayStr
    ).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    // Animation logic
    const createdTodayEl = document.getElementById('created-today');
    const completedTodayEl = document.getElementById('completed-today');
    const completionRateEl = document.getElementById('completion-rate');

    animateValue(createdTodayEl, 0, createdToday, 500);
    animateValue(completedTodayEl, 0, completedToday, 500);
    animateValue(completionRateEl, 0, totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0, 500)

    // Logic for achievement of 5 completed tasks
    if(completedToday === 5 && !localStorage.getItem("medalShownToday")){
        showMedalPopUp();
        localStorage.setItem("medalShownToday", new Date().toISOString().split("T")[0]);
    } 

    updateClearButtonVisibility();
}

clearCompletedBtn.addEventListener("click", () => {
    const confirmed = confirm("Are you sure you want to clear all completed tasks?");
    if(confirmed){
        // Remove completed tasks from array
        const remainingTasks = tasks.filter(task => !task.completed);
        tasks.length = 0; // Clear the array in place
        tasks.push(...remainingTasks); // Replace with filtered list
        saveTasks();
        renderTasks(filterSelect.value);
        updateStats(); // Update stats for dashboard task count
        updateClearButtonVisibility();
    }
});

// Helper function to create task and for future scalability
function createTask(text, category){
    return {
        id: crypto.randomUUID(), // Assign a unique ID
        text: text.trim(),
        completed: false,
        category: category,
        createdAt: new Date().toISOString() // Captures exact date and time task is created.
    };
}

const addTaskBtn = document.getElementById("add-task-btn");

addTaskBtn.addEventListener("click", () => {
    const trimmed = input.value.trim();
    const category = categorySelect.value;

    if(trimmed.length === 0) return;

    // Add to tasks array
    tasks.push(createTask(trimmed, category));

    // Save and re-render
    saveTasks();
    renderTasks(filterSelect.value);
    updateStats();
    updateClearButtonVisibility();

    // Clear input
    input.value = "";
});

/* input.addEventListener("keydown", function (e){
    const trimmed = input.value.trim();
    if(e.key === "Enter" && trimmed.length > 0){
        // Add to tasks array
        tasks.push(createTask(trimmed, categorySelect.value));

        // Save and re-render
        saveTasks();
        renderTasks(filterSelect.value);
        updateStats();
        updateClearButtonVisibility();

        // Clear input
        input.value = "";
    }
}); */

// Format Category Function
function formatCategory(value) {
    switch(value) {
        case "urgent-important": return "🔥 Urgent & Important";
        case "urgent-not-important": return "⚡ Urgent, Not Important";
        case "not-urgent-important": return "🌱 Not Urgent, Important";
        case "not-urgent-not-important": return "🌈 Chill (Not Urgent/Important)";
        default: return "📌 Uncategorized";
    }
}


// Function to render tasks
function renderTasks(filter = "all") {
    // Clear all quadrant lists
    document.querySelectorAll(".task-list").forEach(ul => ul.innerHTML = "");

        // Ensure tasks are up-to-date
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

        //const categoryTag = document.createElement("span");
        //categoryTag.classList.add("category-tag");
        //categoryTag.textContent = formatCategory(task.category);

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
        // Confetti when task is completed
            function celebrateBurst(){
                const defaults = {
                    origin: {y: 0.6}
                };
                
                function fire(particleRatio, opts){
                    if(typeof confetti !== "function") return;
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
        
        // Toggle task completion
        checkbox.addEventListener("change", () => {
            const wasCompleted = task.completed; // Save current state
            task.completed = checkbox.checked;

            // Save today's date when task is marked complete
            if(task.completed){
                task.completedDate = new Date().toISOString().split('T')[0];
                task.completedAt = new Date().toISOString(); // Saves the full timestamp
            } else {
                delete task.completedDate;
                delete task.completedAt;
            }

            // Saves and updates local storage
            saveTasks();
            // console.log("Rendering with filter:", filterSelect.value); 
            renderTasks(filterSelect.value);
            updateStats(); // Tracks progress in real-time
            

           // Logic for confetti at task complete only if it's the first time
            if(task.completed && !wasCompleted){
                try {
                    new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_8bcee6994b.mp3').play();
                } catch (e){
                    console.warn("Success sound failed:", e);
                }
                celebrateBurst();
            }
        });

        // Double-click to edit
        taskText.addEventListener("dblclick", () => {
            const originalText = task.text;
            const originalCategory = task.category;

            // Create text input
            const inputEdit = document.createElement("input");
            inputEdit.type = "text";
            inputEdit.value = task.text;
            inputEdit.classList.add("edit-input");

            // Create category dropdown
            const categoryEdit = document.createElement("select");
            categoryEdit.classList.add("edit-category");
            const categories = [
                {value: "urgent-important", label: "🔥 Urgent & Important"},
                {value: "urgent-not-important", label: "⚡ Urgent, Not Important"},
                {value: "not-urgent-important", label: "🌱 Not Urgent, Important"},
                {value: "not-urgent-not-important", label: "🌈 Chill (Not Urgent/Important)"}
            ];
            categories.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.value;
                option.textContent = cat.label;
                if(task.category === cat.value) option.selected = true;
                categoryEdit.appendChild(option);
            });

            // Create save button (hidden initially)
            const saveButton = document.createElement("button");
            saveButton.classList.add("save-btn", "hidden");
            saveButton.innerHTML = "✅ Save";

            // Append elements
            taskContent.innerHTML = ""; // clear existing
            taskContent.appendChild(inputEdit);
            taskContent.appendChild(categoryEdit);
            taskContent.appendChild(saveButton);
            inputEdit.select(); // selects all text for quick edit

            // Save Logic
            const saveEdit = () => {
                const newText = inputEdit.value.trim();
                const newCategory = categoryEdit.value;

                if(!newText) return; // optional: prevent blank task names

                task.text = newText;
                task.category = newCategory;

                // Save and re-render
                saveTasks();
                // Delay rendering to prevent flicker during blur transition
                setTimeout(() => renderTasks(filterSelect.value), 10);
            };

            // Detect changes to show Save button
            const checkForChanges = () => {
                const currentText = inputEdit.value.trim();
                const currentCategory = categoryEdit.value;
                const changed = currentText !== originalText || currentCategory !== originalCategory;

                if(changed){
                    saveButton.classList.remove("hidden");
                    saveButton.classList.add("animate-save-visible");
                } else {
                    saveButton.classList.add("hidden");
                    saveButton.classList.remove("animate-save-visible");
                }
            };

            inputEdit.addEventListener("input", checkForChanges);
            categoryEdit.addEventListener("change", checkForChanges);

            // Button click saves immediately
            saveButton.addEventListener("click", () => {
                saveEdit();
            });

            // Prevent blur save if focus is on Save button
            const handleBlur = () => {
                setTimeout(() => {
                    const active = document.activeElement;
                    if(![inputEdit, categoryEdit, saveButton].includes(active)){
                        saveEdit();
                    }
                }, 100);
            };

            inputEdit.addEventListener("blur", handleBlur);
            categoryEdit.addEventListener("blur", handleBlur);
            inputEdit.addEventListener("keydown", e => {
                if(e.key === "Enter"){
                    if(inputEdit.value.trim() !== ""){
                        saveEdit();
                    } else {
                        inputEdit.classList.add("shake");
                        setTimeout(() => inputEdit.classList.remove("shake"), 500);
                    }
                }
            });
        });

         // Delete button
         const deleteBtn = document.createElement("button");
         deleteBtn.textContent = "🗑️";
         deleteBtn.classList.add("delete-btn");
         // Add click event to delete task

         deleteBtn.addEventListener("click", () => {
            tasks.splice(index, 1); // Remove task
            saveTasks();
            setTimeout(() => renderTasks(filterSelect.value), 10);
            updateStats();
        });
       
          // Assemble the task item
          taskItem.appendChild(dragHandle);
          taskItem.appendChild(checkbox);
         // taskItem.appendChild(categoryTag);
          taskItem.appendChild(taskContent);
          taskItem.appendChild(deleteBtn);
          
          const targetList = document.getElementById(`${task.category}-list`);
          if(targetList) {
            targetList.appendChild(taskItem);
          }

           // Trigger fade-in
       if(!taskItem.classList.contains("show")){
        requestAnimationFrame(() => {
            taskItem.classList.add("show");
        });
       }
    });  

    updateStats();
    updateClearButtonVisibility();
};

// Enable SortableJS (for drag and drop feature)
if(typeof Sortable !== "undefined"){
    document.querySelectorAll('.task-list').forEach(list => {
        new Sortable(list, {
            group: "tasks",
            animation: 150,
            handle: ".drag-handle",
            ghostClass: "placeholder",    // placeholder for where item is dropping
            chosenClass: "dragging",      // the dragged item
            onEnd: function(evt){
                const currentFilter = filterSelect?.value || "all";
                if(currentFilter === "completed") return;

                const draggedList = evt.to;
                const newCategory = draggedList.closest('.matrix-quadrant')?.dataset?.category;
                const oldCategory = evt.from.closest('.matrix-quadrant')?.dataset?.category;

                if(!newCategory || !oldCategory) return;

                const listItems = draggedList.querySelectorAll(".task");
                const droppedEl = listItems[evt.newIndex];
                const draggedText = droppedEl?.querySelector(".task-text")?.textContent?.trim();

                const movedTask = tasks.find(task => task.text === draggedText);
                if(!movedTask) return;

                // Update category in data
                movedTask.category = newCategory;

                // Update color class visually
                droppedEl.classList.remove("urgent-important", "urgent-not-important", "not-urgent-important", "not-urgent-not-important");
                droppedEl.classList.add(newCategory); // matches CSS class naming

                // Reorder within new category
                const filteredTasks = tasks.filter(task => task.category === newCategory && (
                    currentFilter === "all" || (currentFilter === "active" && !task.completed)
                ));

                const oldIndex = filteredTasks.findIndex(t => t.id === movedTask.id);
                filteredTasks.splice(oldIndex, 1);
                filteredTasks.splice(evt.newIndex, 0, movedTask);

                // Update the global tasks list
                const untouchedTasks = tasks.filter(task => task.category !== newCategory);
                tasks.length = 0;
                tasks.push(...untouchedTasks, ...filteredTasks);

                saveTasks();
                updateStats();

                // Animate drop
                if(droppedEl) {
                    droppedEl.classList.add("dropped");
                    setTimeout(() => droppedEl.classList.remove("dropped"), 400);
                }
        }
    }); 
});
} else {
    console.warn("SortableJS not loaded");
}


// Filter Logic
if(filterSelect){
    filterSelect.addEventListener("change", (e) => {
        renderTasks(e.target.value);
        updateClearButtonVisibility();
    });
};

// Initializing everything after DOM loads
window.addEventListener("DOMContentLoaded", () => {
    renderTasks(filterSelect?.value || "all");
    updateStats(); // Keep dashboard in sync on initial load
    loadDailyQuote(); // Load quote only after DOM is ready
});

