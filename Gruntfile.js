module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-available-tasks');

  grunt.initConfig({
    availabletasks: {
      tasks: {
        options: {
          showTasks: ['user'],
          filter: 'exclude',
          tasks: ['default']
        }
      }
    },
    jscs: {
      src: "./"
    },
    eslint: {
      target: ['./']
    },
    exec: {
      clean: "node main.server.js _.clean",
      buildcore: "node main.server.js _.build.core",
      distcore: "node main.server.js _.dist.core",
      buildcluster: "node main.server.js _.build.cluster",
      distcluster: "node main.server.js _.dist.cluster",
    }
  });

  grunt.registerTask('default', [ 'availabletasks' ]);

  grunt.registerTask('test', [
    'jscs',
    'eslint'
  ]);

  grunt.registerTask('dist', [
    'exec:clean',
    'exec:buildcore',
    'exec:distcore',
    'exec:buildcluster',
    'exec:distcluster'
  ]);
};