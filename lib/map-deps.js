'use strict';

var annonyomousCount = 0;
module.exports = function (dep) {
  if (typeof dep === 'function') {
    var depName = dep.name || dep.taskName || '[annonyomous (' + (++annonyomousCount) + ')]';
    this.register(depName, dep);
    return depName;
  }
  return dep;
};
