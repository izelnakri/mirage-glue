const fs = require('fs');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const inflector = require('i')();

module.exports = {
  writeFile: function(targetFile, fixtureData) {
    if (!fs.existsSync('../backend/test/support')) {
      // Ignoring elixir fixtures since no elixir backend found under ../backend/test/support'
      return;
    }

    const projectName = process.argv[3]; // this will change
    const model = inflector.singularize(targetFile.replace('mirage/fixtures/', '').replace('.js', ''));
    const modelCamelCase = inflector.camelize(inflector.underscore(model));
    const modelPlural = inflector.underscore(inflector.pluralize(model));
    const elixirFixturePath = `../backend/test/support/fixtures/${inflector.underscore(model)}.ex`;

    if (projectName) {
      mkdirp('../backend/test/support/fixtures', (error) => {
        if (error) { throw error; }

        fs.writeFileSync(elixirFixturePath,`
  defmodule ${projectName}.${modelCamelCase}Fixtures do
    alias ${projectName}.${modelCamelCase}

    def ${modelPlural} do
    ${formatJSObjectsToElixir(fixtureData)}
    end

    def insert_all do
      Repo.insert_all(${modelCamelCase}, ${modelPlural}, returning: true)
    end

    # maybe make this with (id) argument
    def insert do
      struct(${modelCamelCase}, List.first(${modelPlural})) |> Repo.insert!
    end
  end
  `.trim());

      const fileSizeInKb = fs.statSync(elixirFixturePath).size / 1000.0;

      console.log(chalk.cyan(`Data written to ${elixirFixturePath}`), `(File size: ${fileSizeInKb} KB)`);
      });
    }

    function formatJSObjectsToElixir(fixtureData) {
      return fixtureData.replace(/\{/g, '%{').replace(/"/g, '\\"')
                      .replace(/\'/g, '"').replace(/(: null)/g, ": nil");
    }
  }
};
