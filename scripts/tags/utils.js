//解析tag参数
function parseArgs(args, list) {
  var parsed = {}
  for (var i = 0; i < args.length; i++) {
    var arg = args[i]
    if (!arg) {
      continue
    }
    var kv = arg.split(':')
    if (kv.length < 2) {
      continue
    }
    if (list.indexOf(kv[0])+1) {
      parsed[kv[0]] = arg.substring(kv[0].length + 1)
    }
  }
  return parsed
}

module.exports = {
  parseArgs: parseArgs,
};
