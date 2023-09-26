const express = require("express");
const path = require("path");

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

app.get("/todos/", async (request, response) => {
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
    case hasCategoryStatusProperty(request.query):
      getTodoQuery = `select * from todo where todo like 
        '%${search_q}%' and category = '${category}' and 
        status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `select * from todo like '%${search_q}%' 
        category = '${category}';`;
    case hasCategoryPriorityProperty(request.query):
      getTodoQuery = `select * from todo like '%${search_q}%'
         and category = '${category}' and priority = '${priority}';`;

    default:
      getTodoQuery = `select * from todo where todo like '%${search_q}%'`;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

//Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const particularTodoQuery = `select * from todo where id = '${todoId}';`;
  dbResponse = await db.get(particularTodoQuery);
  response.send(convertDatabaseObjectToResponseObject(dbResponse));
});

//Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const createTodo = request.body;
  const { id, todo, priority, status, category, dueDate } = createTodo;
  const createTodoQuery = `insert into todo (id, todo, priority, status, due_date) values 
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}')`;
  const todoCreated = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateTodoColumn = "";
  const todoUpdate = request.body;
  switch (true) {
    case todoUpdate.status !== undefined:
      updateTodoColumn = "Status";
      break;
    case todoUpdate.priority !== undefined:
      updateTodoColumn = "Priority";
      break;
    case todoUpdate.todo !== undefined:
      updateTodoColumn = "Todo";
      break;
    case todoUpdate.category !== undefined:
      updateTodoColumn = "Category";
      break;
    case todoUpdate.dueDate !== undefined:
      updateTodoColumn = "Due Date";
  }
  const previousTodoQuery = `select * from todo where id = '${todoId}';`;

  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.due_date,
  } = request.body;

  const statusUpdateQuery = `update todo set todo = '${todo}',
    priority = '${priority}', status = '${status}', 
    category = '${category}', due_date = '${dueDate}';`;
  await db.run(statusUpdateQuery);
  response.send(`${updateTodoColumn} Updated`);
});

//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = '${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
