# User documentation

## Install dependencies

Dependencies must be installed before use.

```cmd
npm install
```

Or use your favorite package manager.

## Generate config file

The settings are located in a file called:

* .env

To generate the .env file:

```cmd
node op conf:generate
```

### Test configurations file generate

```cmd
node op testconf:generate
```

Result: .env.test file.

## App key generation

Te generate the application key:

```cmd
node op key:generate
```

## Database setup

Edit the .env file.

## Endpoints

All endpoint have a /api prefix.

| Endpoint | Method | Auth | Description |
|-|-|-|-|
| /register | POST  | no |  create user |
| /login    | POST  | no |  login  |
| /users    | GET   | yes |  read users |
| /users/:id | GET  | yes | read user |
| /users/:id/password | PUT  | yes | change password |

## The register endpoint

```json
{
    "name": "joe",
    "email": "joe@green.lan",
    "password": "secret",
    "password_confirmation": "secret"
}
```

## The login endpoint

```json
{
    "name": "joe",
    "password": "secret"
}
```

You receive the bearear token with accessToken key.

## The users endpoint

To query users or user, send the bearer token to endpoint.

## Model and controller generation

Use the following instructions to generate models and controllers:

```cmd
node op make:model thing
node op make:controller thing
```

## Key generation

You can generate the application key with the following command:

```cmd
node op key:generate
```

## Generate admin user

You can create an admin user if it does not already exist in the database:

```cmd
node op admin:generate
```

## Database import

It is possible to import data from JSON and CSV files.

```cmd
node op db:import thing things.json
node op db:import thing things.csv
node op db:import thing things.csv ,
node op db:import thing things.csv ";"
node op db:import thing things.csv :
```

The last option is the separator.

For example JSON file:

employees.json:

```json
[
    { "id": 1, "name": "Tom Large" },
    { "id": 2, "name": "Jack Small" }
]
```

The default separator is comma.

```cmd
node op db:import employee employees.json
```

For example CSV file:

employees.csv:

```csv
id,name
1,Joe Kitin
2,Peter Fall
```

If you have colon separator, use sep parameter.

```csv
id:name
1:Joe Kitin
2:Peter Fall
```

```cmd
node op db:import employee employees.csv --sep :
```

If the file has semicolon separator, use sep parameter, for example:

```csv
id;name
1;Joe Kitin
2;Peter Fall
```

Use next command:

```cmd
node op db:import employee employees.csv --sep ";"
```

## Database

### Database synchronization

Models and database tables can be synchronized, but this can be dangerous.

Database synchronization can be set up in the app/models/modrels.js file. Default values are:

```js
{ alter: true }
```

This preserves the data and existing structure.

Possible values:

```js
{ force: true }
```

The latter deletes the contents of the database table!

If the value is false, there is no synchronization in either case.

### Migration

Generate a migration:

```bash
node op make/migration thing
```

For example migration for employee table:

```bash
node op make/migration employee
```

```javascript
import { DataTypes } from 'sequelize';

async function up({context: QueryInterface}) {
  await QueryInterface.createTable('employees', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE }
  });
}

async function down({context: QueryInterface}) {
  await QueryInterface.dropTable('employees');
}

export { up, down }
```

Run all migration:

```bash
node op migration:run
node op migrate
```

Run a migration:

```bash
node op migration:run <migration_name>
node op migrate <migration_name>
```

Rollback the last migration:

```bash
node op migration:rollback
node op migrate:rollback
```

Rollback two migrations:

```bash
node op migration:rollback 2
node op migrate:rollback 2
```

Reset the database:

```bash
node op migration:reset
node op migrate:reset
```

This command also undoes seeder operations.

Reset the database and run all migrations:

```bash
node op migration:fresh
node op migrate:fresh
```

### Database seed

Generate a seeder:

```bash
node op make/seeder thing
```

Example seeder for employee table:

```bash
node op make/seeder employee
```

```javascript

async function up({context: QueryInterface}) {
  if(db.Employee) {
    await db.Employee.bulkCreate([
      { id: 1, name: "John Smith" },
      { id: 2, name: "Alice Johnson" }
    ]);
  }else {
    const now = new Date()
    await QueryInterface.bulkInsert('things', [
      { 
        id: 1, name: "John Smith", 
        createdAt: now, updatedAt: now
      },
      { 
        id: 2, name: "Alice Johnson", 
        createdAt: now, updatedAt: now
      }
    ]);
  }
}

async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('things', null, {});
}

export { up, down }
````

Run all seeders:

```bash
node op db:seed
```

Run a seeder:

```bash
node op db:seed path_thing
```
