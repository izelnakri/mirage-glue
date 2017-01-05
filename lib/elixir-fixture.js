const fs = require('fs');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const inflector = require('i')();

const ArgumentParser = require('./argument-parser');

module.exports = {
  writeFile: function(targetFile, fixtureData) {
    if (!fs.existsSync('../backend/test/support')) {
      // Ignoring elixir fixtures since no elixir backend found under ../backend/test/support'
      return;
    }

    const projectName = ArgumentParser.get('elixir-app');
    const model = inflector.singularize(targetFile.replace('mirage/fixtures/', '').replace('.js', ''));
    const modelCamelCase = inflector.camelize(inflector.underscore(model));
    const elixirFixturePath = `../backend/test/support/fixtures/${inflector.underscore(model)}.ex`;

    if (projectName) {
      mkdirp('../backend/test/support/fixtures', (error) => {
        if (error) { throw error; }

        fs.writeFileSync(elixirFixturePath,`
  defmodule ${projectName}.${modelCamelCase}Fixtures do
    alias ${projectName}.${modelCamelCase}

    def list do
    ${formatJSObjectsToElixir(fixtureData)}
    end

    def map_with_iso_string_parser(single_map) do
      single_map |> Map.keys |> Enum.map_reduce(%{}, fn(key, accum) ->
        value = Map.get(single_map, key)

        case Timex.parse(value, "{ISO:Extended}") do
          {:ok, data} -> {:ok, Map.put(accum, key, data)}
          _ -> {:ok, Map.put(accum, key, value)}
        end
      end) |> elem(1)
    end

    def insert_all do
      ecto_array = Enum.map(list, fn(each_map) -> map_with_iso_string_parser(each_map) end)

      Fixturist.insert_all(${modelCamelCase}, ecto_array, returning: true)
    end

    def insert_by_id(id) do
      ecto_map = Enum.find(list, fn(each_map) ->
        each_map.id == id
      end) |> map_with_iso_string_parser

      struct(${modelCamelCase}, ecto_map) |> Fixturist.insert!
    end
  end
  `.trim());

        const fileSizeInKb = (fs.statSync(elixirFixturePath).size / 1000.0).toFixed(2);

        console.log(
          chalk.cyan(`Data written to ${elixirFixturePath}`), `(File size: ${fileSizeInKb} KB)`
        );
      });
    }

    function formatJSObjectsToElixir(fixtureData) {
      return fixtureData.replace(/\{/g, '%{').replace(/"/g, '\\"')
                      .replace(/\'/g, '"').replace(/(: null)/g, ": nil");
    }
  }
};
