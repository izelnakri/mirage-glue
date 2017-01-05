Ember Mirage factories are great for testing form data, however for pages that show models or lists of models and relationships, fixtures are better source than factories.

This library fetches server api endpoints you provide and writes or appends to mirage fixture files, saves significant amount of time and mental energy. It also removes the possibility of human error from manual fixture entries. Written for ember apps that uses RestAdapter.

```{r, engine='bash', count_lines}
  $ npm install -g mirage-glue

  $ mirage-glue localhost:4000/unicorns
  Data written to ./mirage/fixtures/unicorns.js (File size: 24 KB)
  Fixture file has 20 records (+20)

  $ mirage-glue localhost:4000/unicorns/55
  Data written to ./mirage/fixtures/unicorns.js (File size: 26 KB)
  Fixture file has 21 records (+1)
```
If you have an embedded hasOne() or belongsTo() relationship in your json API response the embedded record also gets created in its relevant fixture file!!

Example:

```{r, engine='bash', count_lines}
  $ mirage-glue localhost:4000/blog-posts
  Data written to ./mirage/fixtures/blog-posts.js (File size: 82 KB)
  Fixture file has 20 elements (+20)
  appending data to file: mirage/fixtures/categories.js
  Data written to ./mirage/fixtures/categories.js (File size: 22 KB)
  Fixture file has 21 elements (+1)
```

If you want to ignore nested parsing/fixture creation of relationships/objects you can provide ```--ignore-nesting``` option flag:

```{r, engine='bash', count_lines}
  $ mirage-glue localhost:4000/blog-posts --ignore-nesting
  Data written to ./mirage/fixtures/blog-posts.js (File size: 102 KB)
  Fixture file has 20 elements (+20)
```

#### Bonus: Using the same fixture data in Phoenix/Elixir tests:

When you provide an elixir-app=YourElixirAppName option, elixir fixture files are generated under ../backend/test/support/fixtures folder we gets loaded automatically by mix every time you run ```mix test```:

```{r, engine='bash', count_lines}
  $ mirage-glue localhost:4000/hackers elixir-app=TheMatrix
  Data written to ./mirage/fixtures/hackers.js (File size: 17 KB)
  Fixture file has 6 elements (+6)
  Data written to ../backend/test/support/fixtures/hacker.ex (File size: 21 KB)
  appending data to file: mirage/fixtures/human-subjects.js
  Data written to ./mirage/fixtures/human-subjects.js (File size: 68 KB)
  Fixture file has 8 elements (+6)
  Data written to ../backend/test/support/fixtures/human_subject.ex (File size: 72 KB)
```

You can read the contents of the fixture files to understand how the use fixtures in Elixir tests. One big caveat of using fixtures in the backend is you might not have the referenced relationship of the fixture record thus foreign_key constraints prevent your fixtures from getting inserted to the database. The generated elixir fixture files use the `fixturist` elixir library to source referenced relationship from development database to the test database along with your fixture insertion.
