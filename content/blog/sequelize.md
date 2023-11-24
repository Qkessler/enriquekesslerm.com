+++
title = "Diving deep into Sequelize"
description = """
In this post we will go deep into the SQL ORM world, highlighting some of the strong points for Sequelize. I find that everyone could find this post interesting, specially if you have heard of the "new" ES6 features. Sequelize is a great option for SQL database management.
"""
date = 2021-05-25
[taxonomies]
tags = ["software"]
[extra]
toc = true
+++

## Introduction

In this post we will go deep into the SQL ORM world, highlighting some of the strong points for Sequelize. I find that everyone could find this post interesting, specially if you have heard of the "new" ES6 features. Sequelize is a great option for SQL database management. Let's get started!

## What is Sequelize?

Per the [Sequelize website](https://sequelize.org/):

> Sequelize is a promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite and Microsoft SQL Server. It features solid transaction support, relations, eager and lazy loading, read replication and more.

But what does it really mean? What does the average Joe (The software engineer Joe, nevertheless) has to know about Sequelize?

In my book, Sequelize is one of the most popular [Node.js](https://nodejs.org/es/) [ORMs (Object Relational Mapper)](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping), which provides extensive functionality to connect and work with relational databases, namely PostgreSQL, MySQL, MariaDB and more. One of the strong points of Sequelize is that the whole implementation hovers around [Promises](#promises) which —as you know, we're all ES6 developers, aren't we?— provide asynchronous support. In this case, to database transitions, which is really interesting.

Even though I will be talking about Promises more in depth in the following paragraphs, let's see a practical example: Image you are working on a web for your company, and you are tasked to connect to a database and perform some long and heavy transactions, all when the user presses a button. One option would be to keep the user waiting for the database to finish its transactions (this is not the way I would go about it) and the better option is to do all the database work asynchronously, using Promises!

You can find about setting up Sequelize with your database —the right way— in the Set up Sequelize in a Node.js project section.

## Promises

Most of the methods provided by Sequelize are asynchronous and therefore return Promises. But what are Promises anyway?

According to the [JavaScript documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise):

> A Promise is a proxy for a value not necessarily known when the promise is created. It allows you to associate handlers with an asynchronous action's eventual success value or failure reason. This lets asynchronous methods return values like synchronous methods: instead of immediately returning the final value, the asynchronous method returns a promise to supply the value at some point in the future.

The practical definition is that we are able to control when and in what situation wait for the result of asynchronous operations, and act accordingly to them. As I mentioned in the example [before](#what-is-sequelize), our developer friend would most likely want to wait for the database to finish if the next redirect is to the page where the information is updated. But let's imagine the case that the user is redirected to another page that doesn't really need to have the information updated. In that case we would benefit from doing work asynchronously, avoiding the wait; Pretty cool, huh?

There are several operations that we can apply to Promises, in order to control the [state](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#description) of the information they are processing. A Promise will initially be `pending`, but then it can either go to `fulfilled` —if the operation hasn't ended in error— or to `rejected`, meaning the operation has failed.

Let's assume we define the following Promise from the `getAllProducts` operation, which applies a series of filters to the list of products of the user:

```javascript
// We can also create Promises with the constructor: new Promise(function)
let productList = getAllProducts(idUser, filters)
```

If we were to print the `productList` variable out (via `console.log`), we would likely get "Promise{ <Pending> }", representing that the Promise is in the `pending` state —it hasn't finished the operation.

The three common Promise operations —which we will use more extensively in Sequelize— are:

## `then()`

The `then()` function is used when we want to run some function when the Promise has resolved. In this case, if we wanted to print the list of products, we would write:

```javascript
// We could also omit the function body, as it's only one line.
productList.then(promiseResult => {
  console.log(promiseResult)
})
```

As we see in the snippet, we get the result of the operation as a parameter to the inside function, which we can then use in the body of the function.

## `catch()`

The `catch()` function is used to literally "Catch" a possible error in the operation. Let's assume we are throwing an error in the `getAllProducts` function if the user (symbolized with `idUser`) doesn't exist. We can then catch the error in the result of the Promise:

```javascript
productList.catch(error => console.log(error))

// This could be: ERROR> The user doesn't exist! 
```

## `finally()`

The `finally()` function is used to run a certain code whether the Promise resulted in a success or an error. It might remind you of the try-catch-finally structure, and it has been inspired in that. Let's redirect the user —with a populated or empty list— to the search page.

```javascript
// Let's assume we have the response variable ('res') declared before.
productList.then(
  promiseResult => {
    console.log(promiseResult)
    return promiseResult
  }).catch(
    err => console.log(err)).finally(
      productList => res.redirect('search', { productList: productList}))
```

This has also been an excellent example of Promise chaining, which is the passing of the callback outputs from one function to the next. The `catch` function catches all errors until that point, so it's common to use several `then` functions that then a `catch` one.

:warning: NOTE: We are returning the `promiseResult` in the `then` function to get the argument for the `finally` call. If we didn't do that, JavaScript wouldn't complain, but the `productList` variable would be 'undefined'.

## Instances vs Models

When you are starting to get in the Sequelize mood, it is crucial to differentiate [Instances](https://sequelize.org/master/manual/model-instances.html) and [Models](https://sequelize.org/master/manual/model-basics.html).

### Model

For cohesion, let's start with Models. `Models` are exactly what you would expect in relational databases. They represent an abstraction of an entity in your application's `domain`, from which you need to store information. It is also commonly known as `Table` —Sequelize handles all the Table creation for you when the model is `defined`.

Models can be defined in [two equivalent ways](https://sequelize.org/master/manual/model-basics.html#model-definition) in Sequelize, from which I will only discuss the one that I find more convenient, no need to get into Sintax Hell when we have ready-to-go shortcut functions. I find that the easier is to use the `define` function, which is defined as:

```javascript
sequelize.define(modelName, attributes, options) // This sequelize object is an instance of the Sequelize class.
```

Going back to the product example, let's define the Product Model.

```javascript
const Product = sequelize.define('Product', {
  idProduct: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  idUser: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'idUser',
    }
  }
})
```

It could be more complex than the previous snippet, but I find that the Product model we defined has all the information I need for the explanation. As we know, every Table should have its `primaryKey`, which then will be used to identify a particular row in the Table.

:warning: We set the `autoIncrement` property to `true`, in order to have ids automatically created for us.

The other Product property that I wanted to mention is the idUser. You might be thinking, why are Users mixed up in all of this. Let me introduce you to the [Foreign Key](https://www.w3schools.com/sql/sql_foreignkey.asp), my friend. The idUser property has the references property, creating a "link" to the `idUser` key —represented with the `key` property— of the `User` model.

If you want to dig more into the possible attributes for Model definition Sequelize offers, see:

-   <https://sequelize.org/master/class/lib/model.js~Model.html#static-method-init>
-   <https://sequelize.org/master/class/lib/model.js~Model.html>
-   <https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-method-define>

## Instance

Citing the Sequelize documentation:

> As you already know, a model is an ES6 class. An instance of the class represents one object from that model (which maps to one row of the table in the database). This way, model instances are DAOs.

Although a Model is a class, you cannot create instances using the default constructor —via `new` — but using special creation and building functions. In this case, even though we have a shortcut to the creation of Instances, I find interesting showing the "long" way of creating them.

```javascript
const createProduct = async () => {
  const product = Product.build({ name: "Headphones" })
  console.log(product.name) // "Headphones"
  await product.save()
}
```

From the snippet we can get gold information out of the build method. You might be thinking to yourself: we are assigning a `Promise` to a constant, and then accessing its attribute. Enrique, your code is wrong.

Mysteriously, the build function is one of the few methods in Sequelize that are not asynchronous, hence we are not assigning a Promise, but a `Product` Instance. Note the save function on the instance —asynchronous. The build function does not insert the new "row" into the Product(s) Table. We need to explicitly save the instance using the `save` function.

Pretty cool, huh? Sequelize provides a shortcut for the combined operations: `create`. The `create` is an asynchronous function, which uses the same parameters as the `build` method, but saving the instance in the database in the process. See:

```javascript
const product = await Product.create(
  {
    name: "Headphones",
    price: 120,
  }
).catch(err => console.log(err))
console.log(product.name) // "Headphones"
```

Note the catch function applied to the Promise to output any possible creation or insertion errors, as discussed in the [Promises](#promises) section. After the create operation, the `product` instance is inserted in the database.

:warning: If you want to log the product instance, use the `toJSON()` function, as the default `toString` is pretty terrifying, printing all the internals.

## Query the database

Why would we want to store information in a database if not to use it later on? Querying in sequelize couldn't be easier, both through raw queries —not here to judge— or Finder methods.

### Raw queries

Just for you hermits out there, let's start with Raw queries. We are working
with SQL databases anyway, right?  You can raw query the database through the
sequelize.query method. From the [Sequelize documentation](https://sequelize.org/master/manual/raw-queries.html):

> By default the function will return two arguments - a results array, and an object containing metadata (such as amount of affected rows, etc). Note that since this is a raw query, the metadata are dialect specific. Some dialects return the metadata "within" the results object (as properties on an array). 

:warning: If you are using MSSQL or MySQL, the two return variables will be the same object.

Here is an update for our Product example.

```javascript
const [results, metadata] = await sequelize.query("UPDATE Product SET price = 42 WHERE idProduct = 1");
// Results will be an empty array and metadata will contain the number of affected rows.
```

Note that the even if we inserted the Product —singular— Model in the database, Sequelize creates both tables: Product and Products. Query away with your preference.

There are special cases where you don't need change access to the database, just the data, i.e. through a SELECT query. You can then import the QueryType metadata.

```javascript
const { QueryTypes } = require('sequelize');
const products = await sequelize.query("SELECT * FROM `Products`", { type: QueryTypes.SELECT });
```

Passing the QueryType Metadata, the function no longer needs to return two return variables, but the SELECT query's affected rows. If you wouldn't mind, let's go back to abstraction, where I fill a bit more comfortable. Sequelize defines shortcut functions to query the database(s).

## Finder methods

By default, the finder methods return Instances. We can then use those instances to get information, as if we were accessing an ES6 class. Here are the finder functions:

-   `findAll()`: returns an array of Instances for the Model that has been queried:

```javascript
const productList = await Product.findAll();
```

-   `findByPk()`: returns an instance by passing the Primary Key as argument. In our case, the `idProduct`.

```javascript
const idProduct = 1
const product = await Product.findByPk(idProduct);
console.log(product.price) // 42, after the UPDATE.
```

-   `findOne()`: the method returns the first instance matching the options passed. As with all Sequelize methods —I really value the consistency— the format of the options is through objects.
    
```javascript
const product = await Product.findOne({ where: { price: 42 } });
// This product constant is the same for the findByPk method.
```

Although there are others, I find that the ones mentioned are the most important. If you still have the curiosity, see:

-   <https://sequelize.org/master/manual/model-querying-finders.html>
-   <https://sequelize.org/master/manual/model-querying-basics.html>
-   <https://sequelize.org/master/manual/getters-setters-virtuals.html>

:warning: For querying Operators are specially interesting, you can access all the operators you expect: `and`, `or`, `eq`, `between`, `like` and more. Check: [Operators](https://sequelize.org/master/manual/model-querying-basics.html#operators).

## Minimize transactions

When working with databases and specially with a ton of requests to it, it is key to have the mindset of reducing as much database transactions as possible. What do I mean by that?

Instead of having multiple database requests to get and update some information, try to think of an [SQL query](#query-the-database) (remember that you can use both raw and Sequelize methods) to do the job in a single transaction if possible. A nice example of this is the Update functionality by Sequelize.

Sequelize provides several ways of updating instances. The first one —bear with me here— is getting a certain instance, modify the properties you want to update and then save the instance back to the database. For our Product example, let's make it cheaper. With the sequelize methods discussed before, we would achieve that using:

```javascript
const idProduct = 1
const productInstance = Product.getByPk(idProduct)
productInstance.price = 12 // It was 42 before.
await product.save()
```

The previous sequence of operations creates two SQL requests, the first SELECT to get the product by id, and then a second one to update the value —when the instance is saved through the `save()` method). That is the essence of what I mean, instead of being happy with the previous snippet, let's think further.

We know that Sequelize provides an [Update method](https://sequelize.org/master/class/lib/model.js~Model.html#static-method-update) to update multiple instances that match the `were` options. Here would be the snippet for the second option.

```javascript
const idProduct = 1
const [numAffectedRows, product] = Product.update({
  where: {
    idProduct: 1
 }})
 ```

That snippet only produces an UPDATE query, using the WHERE clause to limit the target rows. As you see, you get the number of affected rows as the first deconstructing argument, and the actual affected rows in the second. No need to save the database afterwards, pretty cool, huh?

## Set up Sequelize in a Node.js project

On this section I intend to give you a working Sequelize configuration, done the efficient way. There are multiple ways to use Sequelize in your Node.js project, but I'm sure you will agree with me that there is no need to redefine the Sequelize connection every time you want to access the database.

Instead, we should strive towards having a reusable and maintainable configuration, benefiting from having code that would work well with several DBs —let's image you intend to change from MySQL to PostgreSQL.

I need to give credit where credit is due: I got this information for one of my projects from [bezkoder's](https://bezkoder.com/node-js-express-sequelize-mysql/) blog post, which I highly recommend for a more profound dive on the setup part of Sequelize. Let's get started.

First, Sequelize requires a series of arguments to set up the connection to the database. I recommend defining a `db.config.js` file, where you will insert the constants required for the connection.

```javascript
module.exports = {
  HOST: 'localhost',
  DB: 'bualatok',
  USER: 'root',
  PASSWORD: process.env.DB_PASSWORD,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
}
```

As you can see in the snippet below, you need to setup the IP of the server
you are connecting to —through the `HOST` property. The interesting part is
that you could either have your own server (i.e MySQL server) or connect to
one elsewhere. The `DB` property is the name of the database you will be
connecting to. The `USER` and `PASSWORD` are pretty self-explanatory, but note
the use of the [dotenv package](https://github.com/motdotla/dotenv), which provides easy to use environment variables, that you will then .gitignore. The `dialect` property is picked from a set list, you can find it [here](https://sequelize.org/v5/manual/dialects.html).

The `pool` property is interesting enough to comment on it alone: Sequelize —and databases in general— uses the word ["pool"](https://es.wikipedia.org/wiki/Connection_pool), as a "set" of connections to the database, which can then be used in parallel. We set up a pool of connections to limit the access to the db but still consider the possibility of having multiple "users" creating transactions at the same time.

After having the db.config setup, we need to create the file which will be then imported throughout the application to access the database efficiently. We can even reduce the exports to our liking, or need. Here is the `index.js` file in the `/models` directory:

```javascript
const dbConfig = require("../config/db.config.js")

const { Sequelize, Op, DataTypes } = require("sequelize")
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
})

const db = {}

db.DataTypes = DataTypes
db.Sequelize = Sequelize
db.sequelize = sequelize
db.Op = Op

db.User = require("./user.model.js")(sequelize, DataTypes)
db.Product = require("./product.model.js")(sequelize, DataTypes, db.User)

module.exports = db
```

Using the previous file, we are able to only require the needed aspects from "sequelize" and configure the database connection pool using the `new Sequelize(...)` constructor —note that it uses the dbConfig object defined in the previous snippet. We are able to concentrate everything related to the database, even the `User` and `Product` models and import from that single file.

I find this process the more efficient way to set up Sequelize in a Node.js project, and I would recommend starting with those configuration files.

## Should you use Sequelize?

After all the Sequelize talk, I figure you are thinking whether Sequelize is for you, your project, your team or your own use. This section tries to answer the previous question using pros and cons, and leaves you to the final answer.

PROS:

-   Sequelize provides a layer of abstraction, reducing the possible errors that developers can include in Raw SQL queries.
-   Sequelize is multi-dialect, providing support for the use-case of having multiple databases with different providers at the same time —weird but OK.
-   Using an ORM —Sequelize in this case— speeds up the development process for simple, repetitive queries.
-   If you are concerned about security, ORMs will shield your application from injection attacks, since the framework will filter the requests for you.
-   Sequelize "forces" you to create a maintainable database, that is independent of the database provider you use in that moment, making the switching process seemless.

CONS:

-   If you are trying to pick an ORM to avoid learning SQL, you will be rendered out alone when the ORM goes out of the window. Understand the SQL sintax underneath the ORM's calls.
-   Complex calls in ORMs are usually inefficient. If your queries are not simple or repetitive, you are better off using Raw Queries.
-   Sequelize doens't have a perfect documentation, finding the information you need might be trivial or not.
-   Learning a new ORM might tie you to a different and new sintax.

The Pros and Cons list that everyone was waiting for. If after the list you find that you are getting more and more curious about using Sequelize, go on! As you might know:

> By experimenting with voluntary discomfort, we  learn to appreciate far more of our life, and can be content with a much simpler and more wholesome one.

I intend to keep myself learning every day, and learning additional technologies is always exciting!

## Final conclusions

And there you have it folks, this brief Sequelize introduction is over. I really hope this post has inspired you in some way, to either try Sequelize or keep in mind it exists. I find Sequelize —and ORMs in general— to be the next generation of database transaction processing. If you have any questions or wanna chat with me, hit me up by [email](mailto:enrique.kesslerm@gmail.com) or on [twitter](https://twitter.com/quique_kessler).

## Advanced topics

Now that you have been given the seed of curiosity with Sequelize, I find that learning more is just about finding the right information. Below I provide a list of advanced topics that you might enjoy reading about if you are really taking serious using Sequelize for your project.

-   [Dialect specific configuration](https://sequelize.org/master/manual/dialect-specific-things.html)
-   [Hooks](https://sequelize.org/master/manual/hooks.html)
-   [Constraints](https://sequelize.org/master/manual/constraints-and-circularities.html)
-   [Using legacy tables](https://sequelize.org/master/manual/legacy.html)
-   [Migrate your current project](https://sequelize.org/master/manual/migrations.html)
-   [Using Typescript with Sequelize](https://sequelize.org/master/manual/typescript.html)
-   [Caching information with Sequelize](https://github.com/DanielHreben/sequelize-transparent-cache)
-   [Sequelize temporal records](https://github.com/bonaval/sequelize-temporal)
-   [Role, Permission based Auth with Sequelize](https://jasonwatmore.com/post/2020/08/18/nodejs-mysql-simple-api-for-authentication-registration-and-user-management)
-   [Visual definition of Sequelize models](https://www.datensen.com/)
