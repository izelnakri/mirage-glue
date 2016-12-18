```{r, engine='bash', count_lines}
  $ npm install -g mirage-glue

  $ mirage-glue localhost:4000/unicorns
  writing operation finished for ./mirage/fixtures/unicorns.js
  Fixture file has 20 elements

  $ mirage-glue localhost:4000/unicorns/55
  appending operation finished for ./mirage/fixtures/unicorns.js
  Fixture file has 21 elements
```
