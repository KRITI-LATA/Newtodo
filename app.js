const express = require("express");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
module.exports = app;
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializerDatabaseServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializerDatabaseServer();

const convertDatabaseObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const checkRequestsQueries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsArray = categoryArray.includes(category);
    if (categoryIsArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsArray = priorityArray.includes(priority);
    if (priorityIsArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsArray = statusArray.includes(status);
    if (statusIsArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );

      const isValidDate = isValid(result);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

const checkRequestBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;
  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsArray = categoryArray.includes(category);
    if (categoryIsArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsArray = priorityArray.includes(priority);
    if (priorityIsArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsArray = statusArray.includes(status);
    if (statusIsArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const result = toDate(new Date(formatedDate));

      const isValidDate = isValid(result);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.Duedate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.todo = todo;
  request.id = id;

  next();
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//API1

app.get("/todos/", checkRequestsQueries, async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `select * from todo where todo like 
            '%${search_q}%' and
             priority = '${priority}' 
            and status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%'
             and priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%'
       and status = '${status}';`;
      break;
    case hasCategoryStatusProperty(request.query):
      getTodoQuery = `select * from todo where todo like 
        '%${search_q}%' and category = '${category}' and 
        status = '${status}';`;
      break;

    case hasCategoryProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and
      category = '${category}'`;
      break;

    case hasCategoryPriorityProperty(request.query):
      getTodoQuery = `select * from todo like '%${search_q}%'
         and category = '${category}' and priority = '${priority}';`;
      break;

    default:
      getTodoQuery = `select * from todo where todo like '%${search_q}%'`;
  }

  data = await db.all(getTodoQuery);
  response.send(
    data.map((eachData) => convertDatabaseObjectToResponseObject(eachData))
  );
});

//Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", checkRequestsQueries, async (request, response) => {
  const { todoId } = request.params;
  const particularTodoQuery = `select * from todo where id = '${todoId}';`;
  dbResponse = await db.get(particularTodoQuery);
  response.send(convertDatabaseObjectToResponseObject(dbResponse));
});

//Create a todo in the todo table
app.post("/todos/", checkRequestBody, async (request, response) => {
  const createTodo = request.body;
  const { id, todo, priority, status, category, dueDate } = createTodo;
  const newDate = new Date(dueDate);
  const createTodoQuery = `insert into todo (id, todo, priority, status, category, due_date) values 
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDate}')`;
  const todoCreated = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 3

app.get("/agenda/", checkRequestsQueries, async (request, response) => {
  const { date } = request.params;

  const newDate = new Date(date);
  console.log(newDate);
  const selectDueDateQuery = `select * from todo where 
    due_date = '${newDate}';`;

  const todoArray = await db.all(selectDueDateQuery);

  response.send(
    todoArray.map((eachDate) => convertDatabaseObjectToResponseObject(eachDate))
  );
});

//Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { todoId } = request.params;
  let updateTodoQuery = null;
  const todoUpdate = request.body;
  const { priority, todo, status, category, dueDate } = todoUpdate;
  switch (true) {
    case todoUpdate.status !== undefined:
      updateTodoQuery = `update todo set status = '${status}'
      where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case todoUpdate.priority !== undefined:
      updateTodoQuery = `update todo set priority = '${priority}'
       where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case todoUpdate.todo !== undefined:
      updateTodoQuery = `update todo set todo = '${todo}' 
     where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case todoUpdate.category !== undefined:
      updateTodoQuery = `update todo set category = '${category}'
       where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
      break;
    case todoUpdate.dueDate !== undefined:
      updateTodoQuery = `update todo set due_date = '${dueDate}' 
     where id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
      break;
  }
});

//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = '${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
