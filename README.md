Ember Mirage factories are great for testing form data, however for pages that show models or lists of models and relationships, fixtures are better source than factories.

This library fetches server api endpoints you provide and writes or appends to mirage fixture files, saves significant amount of time and mental energy. It also removes the possibility of human error from manual fixture entries. Written for ember apps that uses ember RestAdapter.

```{r, engine='bash', count_lines}
  $ npm install -g mirage-glue

  $ mirage-glue localhost:4000/unicorns
  writing operation finished for ./mirage/fixtures/unicorns.js
  Fixture file has 20 elements

  $ mirage-glue localhost:4000/unicorns/55
  appending operation finished for ./mirage/fixtures/unicorns.js
  Fixture file has 21 elements
```
