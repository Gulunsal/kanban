document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('addColumnBtn').addEventListener('click', addColumn);

let taskIdCounter = 0;
let columnIdCounter = 0;

/*--------------------------------------------------------------------
  1  -loadFromLocalStorage fonksiyonu ile locale storage'daki verileri yükler.
    -saveToLocalStorage fonksiyonu ile önce verileri oluşturup ardından kaydedeceğiz.
    -board datası, task datası ve column datası oluşturup kaydedeceğiz.
    -saveToLocalStorage fonksiyonu, board datasını JSON formatına çevirip, localStorage'a kaydedecektir.
    -JSON.stringify fonksiyonu, bir JavaScript nesnesini JSON dizgesi (string) haline getirir.

  ---------------------------------------------------------------------*/

loadFromLocalStorage();

function saveToLocalStorage() {
    const boardData = {
        tasks: {},
        columns: []
    }

    document.querySelectorAll('.task').forEach(task => {
        boardData.tasks[task.id] = {
            text: task.querySelector('span').textContent,
            column: task.parentElement.id
        }
    })
   
    document.querySelectorAll('.kanban-column').forEach(column => {
        boardData.columns.push({
            id: column.id,
            name: column.querySelector('h2').textContent.trim(),
            tasks: Array.from(column.querySelectorAll('.task')).map(task => task.id)
        })
    })

    localStorage.setItem('kanbanBoard', JSON.stringify(boardData))
}

/*----------------------------------------------------------------------------------------------------
 2- Kanban panosu verilerini localStorage'dan yükler ve panoyu sütunlar ve görevlerle doldurur.
   -Panoda veri bulunamazsa, varsayılan sütunlar eklenir.

 ----------------------------------------------------------------------------------------------------*/
function loadFromLocalStorage() {
    const boardData = JSON.parse(localStorage.getItem('kanbanBoard'))
    if (!boardData) {
        // Varsayılan sütunlar eklenir.
        addColumnWithDefault('To Do', 'todo')
        addColumnWithDefault('In Progress', 'inProgress')
        addColumnWithDefault('Done', 'done')
        return
    }

    taskIdCounter = 0
    columnIdCounter = boardData.columns.length

    boardData.columns.forEach(columnData => {
        const column = document.createElement('div')
        column.classList.add('kanban-column');
        column.setAttribute('id', columnData.id)
        column.innerHTML = `
            <h2>${columnData.name}
                <div class="progress-bar"><div class="progress" id="progress-${columnData.id}"></div></div>
            </h2>
            <button onclick="deleteColumn(this)">❌</button>  `

        document.getElementById('kanbanBoard').appendChild(column)

        columnData.tasks.forEach(taskId => {
            const taskData = boardData.tasks[taskId]
            const task = document.createElement('div')
            task.classList.add('task')
            task.setAttribute('draggable', 'true')
            task.setAttribute('id', taskId)
            task.innerHTML = `
                <span>${taskData.text}</span>
                <div class="actions">
                    <button onclick="editTask(this)">✏️</button>
                    <button onclick="deleteTask(this)">❌</button>
                </div>   `
            column.appendChild(task)
            addDragAndDropListeners(task)

            taskIdCounter = Math.max(taskIdCounter, parseInt(taskId.split('-')[1]) + 1)
        });

        column.addEventListener('dragover', dragOver)
        column.addEventListener('dragenter', dragEnter)
        column.addEventListener('dragleave', dragLeave)
        column.addEventListener('drop', drop)
    });

    updateProgressBars();
}

/*-------------------------------------------------------------------------------------------------
 3- Kanban panosuna varsayılan ayarlarla yeni bir sütun ekler.

---------------------------------------------------------------------------------------------------*/
function addColumnWithDefault(name, id) {
    const board = document.getElementById('kanbanBoard')

    const newColumn = document.createElement('div')
    newColumn.classList.add('kanban-column')
    newColumn.setAttribute('id', id)
    newColumn.innerHTML = `
        <h2>${name}
            <div class="progress-bar"><div class="progress" id="progress-${id}"></div></div>
        </h2>
        <button onclick="deleteColumn(this)">❌</button> `

    board.appendChild(newColumn)

    newColumn.addEventListener('dragover', dragOver)
    newColumn.addEventListener('dragenter', dragEnter)
    newColumn.addEventListener('dragleave', dragLeave)
    newColumn.addEventListener('drop', drop)

    columnIdCounter++
}

/*--------------------------------------------------------------------------------------------------
  4- Kanban panosuna bir görev ekler.

  ---------------------------------------------------------------------------------------------------*/
function addTask() {
    const taskInput = document.getElementById('taskInput')
    const taskText = taskInput.value.trim()

    if (taskText === '') {
        alert('Please enter a task')
        return
    }

    const task = document.createElement('div')
    task.classList.add('task')
    task.setAttribute('draggable', 'true')
    task.setAttribute('id', 'task-' + taskIdCounter++)
    task.innerHTML = `
        <span>${taskText}</span>
        <div class="actions">
            <button onclick="editTask(this)">✏️</button>
            <button onclick="deleteTask(this)">❌</button>
        </div>  `

    document.getElementById('todo').appendChild(task)

    taskInput.value = ''
    addDragAndDropListeners(task)
    updateProgressBars()
    saveToLocalStorage()
}

/*----------------------------------------------------------------------------------------------------
 5- Bir görevi, metin içeriğini güncelleyerek düzenler.
 ----------------------------------------------------------------------------------------------------*/
function editTask(button) {
    const task = button.parentElement.parentElement
    const newTaskText = prompt('Edit task:', task.querySelector('span').textContent)

    if (newTaskText !== null && newTaskText.trim() !== '') {
        task.querySelector('span').textContent = newTaskText.trim()
    }
    saveToLocalStorage()
}

/*-----------------------------------------------------------------------------------------------------
 6- Bir görevi kanban panosundan siler.

 ----------------------------------------------------------------------------------------------------*/
function deleteTask(button) {
    const task = button.parentElement.parentElement
    task.remove()
    updateProgressBars()
    saveToLocalStorage()
}

/*------------------------------------------------------------------------------------------------
 7- Bir görev öğesine dragstart ve dragend olayları için olay dinleyicileri ekler.

-------------------------------------------------------------------------------------------------*/
function addDragAndDropListeners(task) {
    task.addEventListener('dragstart', dragStart)
    task.addEventListener('dragend', dragEnd)
}

/*-----------------------------------------------------------------------------------------------
 8-Sürükleme başlatma olayını yönetir.
 
-------------------------------------------------------------------------------------------------*/
function dragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id)
    setTimeout(() => {
        event.target.classList.add('hide')
    }, 0)
}

/*----------------------------------------------------------------------------------------------
9- Sürükleme olayının sonunu, hedef öğeden 'hide' sınıfını kaldırarak,
 - ilerleme çubuklarını güncelleyerek ve değişiklikleri local storage'a kaydederek işler.

------------------------------------------------------------------------------------------------*/
function dragEnd(event) {
    event.target.classList.remove('hide')
    updateProgressBars()
    saveToLocalStorage()
}

/*----------------------------------------------------------------------------------------------
 10- Dragover olayının varsayılan eylemini engeller.

 ------------------------------------------------------------------------------------------------*/
function dragOver(event) {
    event.preventDefault()
}

/*----------------------------------------------------------------------------------------------
11- Kanban sütunları için sürükleyip bırakma olayını yönetir.

 ----------------------------------------------------------------------------------------------*/
function dragEnter(event) {
    event.preventDefault()
    if (event.target.classList.contains('kanban-column')) {
        event.target.classList.add('over')
    }
}

/*-----------------------------------------------------------------------------------------------
12- Hedef öğede 'kanban-column' sınıfı varsa 'over' sınıfını kaldırır.
 ----------------------------------------------------------------------------------------------*/
function dragLeave(event) {
    if (event.target.classList.contains('kanban-column')) {
        event.target.classList.remove('over')
    }
}

/*------------------------------------------------------------------------------------------------
13- Drop olayını yönetir.

------------------------------------------------------------------------------------------------*/
function drop(event) {
    event.preventDefault()

    const id = event.dataTransfer.getData('text/plain')

    if (event.target.classList.contains('kanban-column')) {
        event.target.classList.remove('over')

        const draggable = document.getElementById(id)
        event.target.appendChild(draggable)
    }

    updateProgressBars()
    saveToLocalStorage()
}

/*----------------------------------------------------------------------------------------------
14 - Kanban panosuna yeni bir sütun ekler.

-----------------------------------------------------------------------------------------------*/
function addColumn() {
    const columnName = document.getElementById('columnInput').value.trim()
    if (columnName === '') {
        alert('Please enter a column name')
        return;
    }

    const board = document.getElementById('kanbanBoard')

    const newColumn = document.createElement('div')
    newColumn.classList.add('kanban-column')
    newColumn.setAttribute('id', 'column-' + columnIdCounter)
    newColumn.innerHTML = `
        <h2>${columnName}
            <div class="progress-bar"><div class="progress" id="progress-column-${columnIdCounter}"></div></div>
        </h2>
        <button onclick="deleteColumn(this)">❌</button> `

    board.appendChild(newColumn)
    columnIdCounter++

    newColumn.addEventListener('dragover', dragOver)
    newColumn.addEventListener('dragenter', dragEnter)
    newColumn.addEventListener('dragleave', dragLeave)
    newColumn.addEventListener('drop', drop)

    document.getElementById('columnInput').value = ''
    updateProgressBars()
    saveToLocalStorage()
}

/*-------------------------------------------------------------------------------
 15- Kanban panosundan bir sütunu siler.

 -------------------------------------------------------------------------------*/
function deleteColumn(button) {
    const column = button.parentElement
    column.remove()
    updateProgressBars()
    saveToLocalStorage()
}

/*------------------------------------------------------------------------------------------------------
  16- Her sütundaki görev sayısına göre kanban panosundaki ilerleme çubuklarını (progress bar) günceller.

 ---------------------------------------------------------------------------------------------------*/
function updateProgressBars() {
    const columns = document.querySelectorAll('.kanban-column')
    columns.forEach(column => {
        const tasks = column.querySelectorAll('.task').length
        const progressBar = column.querySelector('.progress')
        const totalTasks = document.querySelectorAll('.task').length
        const progressPercentage = totalTasks > 0 ? (tasks / totalTasks) * 100 : 0
        progressBar.style.width = `${progressPercentage}%`
    })
}
