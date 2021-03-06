'use strict';

/**
 * @file ActionMethod like restart, stop, monitor... are here
 * @author Alexandre Strzelewicz <as@unitech.io>
 * @project PM2
 */

var util = require('util');

module.exports = function(God) {

  God.lock = function(opts, cb) {
    var proc_name = opts.name;
    var metadata  = opts.meta || {};
    var processes = God.findByName(opts.name);
    var is_locked = false;
    var proc_keys = Object.keys(processes);

    for (var i = 0; i < proc_keys.length ; i++) {
      var proc = processes[proc_keys[i]];
      var _metadata;

      if (proc.pm2_env.command.locked === true) {
        is_locked = true;
        break;
      }

      console.log('Locking %s', proc.pm2_env.pm_id);

      proc.pm2_env.command.locked     = true;
      proc.pm2_env.command.started_at = Date.now();

      try {
        _metadata = JSON.parse(JSON.stringify(metadata));
      } catch(e) {
        console.error(e.stack);
        _metadata = metadata;
      }

      proc.pm2_env.command.metadata   = _metadata;
    }

    process.nextTick(function() {
      if (is_locked === true)
        cb(new Error('Processes cannot be re-locked'));
      else
        cb(null, processes);
      return false;
    });
  };

  God.unlock = function(opts, cb) {
    var proc_name = opts.name;
    var metadata  = opts.meta || {};
    var processes = God.findByName(opts.name);

    var proc_keys = Object.keys(processes);

    for (var i = 0; i < proc_keys.length ; i++) {
      var proc = processes[proc_keys[i]];
      var _metadata;

      console.log('Unlocking %s', proc.pm2_env.pm_id);

      proc.pm2_env.command.locked      = false;
      proc.pm2_env.command.finished_at = Date.now();

      try {
        _metadata = JSON.parse(JSON.stringify(metadata));
      } catch(e) {
        console.error(e.stack);
        _metadata = metadata;
      }

      if (typeof(proc.pm2_env.command.metadata) === 'object')
        util._extend(proc.pm2_env.command.metadata, _metadata);
      else
        proc.pm2_env.command.metadata = _metadata;
    }

    process.nextTick(function() {
      return cb(null, processes);
    });
  };

};
