module.exports = {
  get: function(key) {
    const optionArguments = process.argv.slice(3, process.argv.length);
    const argument = optionArguments.find((argument) => argument.match(key));

    if (!argument) {
      return;
    }

    const valueStartIndex = argument.indexOf(key) + key.length + 1;
    const value = argument.slice(valueStartIndex, argument.length) || argument;

    return value;
  }
};
