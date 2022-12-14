module.exports = {
  apps : [{
    name   : "ibcd-library",
    script : "index.js",
    exec_mode          : 'cluster',
    instances          : 'max',
    max_memory_restart : '260M',

    ignore_watch       : ['node_modules', "Images"],
    watch              : true,
}]
}
