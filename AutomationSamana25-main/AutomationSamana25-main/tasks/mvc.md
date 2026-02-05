# Model-view-controller (MVC) pattern for InvParser app


In this task, you will refactor the InvParser app to use the Model-View-Controller (MVC) pattern.

## Guidelines 

- From an up-to-date `main` branch, create a new branch `feature/mvc_refactor` for your work.
- Create a **model** for each entity in the application (e.g., `Invoices`, `Items`).
- Create a DB util that handles database connections for both SQLite and PostgreSQL. 
  Switching between databases should be done by changing the `DB_BACKEND` environment variable.
- Create a function for each model that handles database operations (create, read, update, delete - CRUD).

After your refactor - all API endpoints should use the new model-controller structure, and no raw SQL queries should be present in the FastAPI app.

## Testing 

1. Modify the existing tests to use the new model-controller structure.
2. **In addition**, you have to implement a new set of tests for the app, following the 3rd test strategy approached discussed in class:
   - Integration tests to the DB functionality only
   - API tests for the FastAPI endpoints (You are free to choose mocking the DB operations, or work with real SQLite DB during the tests).

#### Notes

- To execute your tests with `sqlite`, you should set the `DB_BACKEND=sqlite` environment variable.
- During your tests, you should mock the OCI Document Understanding service.
- Make sure you keep the level of code coverage you achieved in the previous task.

#### Testing the app with PostgresSQL DB backend

For the `postgres` DB backend, you should perform only **manual smoke test** to ensure a proper integration.

Unlike SQLite, PostgreSQL is not a lightweight database that can be easily spun up and torn down for each test run. 
Running a PostgreSQL database on your local machine for testing purposes should be avoided, 
as we want our tests to be **isolated** and **consistency**. 

To test the app with PostgreSQL, you can use Docker to run a PostgreSQL instance.

With Docker, you can easily spin up a PostgreSQL instance for testing purposes without affecting your local environment.

1. Install Docker Desktop on your Windows.
2. **Run PostgreSQL in Docker**:
   ```bash
   docker run --rm -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=predictions -p 5432:5432 postgres
   ```
3. **Set the `DB_BACKEND` environment variable** to `postgres`:
   ```bash
   export DB_BACKEND=postgres
   ```
4. **Run your FastAPI app** with the PostgreSQL database:
   ```bash
    python app.py
    ```

5. Perform some sanity requests using `curl` or Postman to ensure the app works as expected with PostgreSQL.
