'use strict';

module.exports = function(verb) {
  verb.extendWith('readme');
  verb.docs('docs/*.md', {cwd: __dirname});
};
