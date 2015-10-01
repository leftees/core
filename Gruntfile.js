module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-shell');
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
    shell: {
      clean: {
        command: "node main.server.js _.clean",
        options: {}
      },
      buildcore: {
        command: "node main.server.js _.build.core",
        options: {
          execOptions: {
            maxBuffer: 1024*1024
          }
        }
      },
      distcore: {
        command: "node main.server.js _.dist.core",
        options: {}
      },
      buildcluster: {
        command: "node main.server.js _.build.cluster",
        options: {
          execOptions: {
            maxBuffer: 1024*1024
          }
        }
      },
      distcluster: {
        command: "node main.server.js _.dist.cluster",
        options: {}
      }
    }
  });

  grunt.registerTask('default', [ 'availabletasks' ]);

  grunt.registerTask('test', [
    'jscs',
    'eslint'
  ]);

  grunt.registerTask('dist', [
    'shell:clean',
    'shell:buildcore',
    'shell:distcore',
    'shell:buildcluster',
    'shell:distcluster'
  ]);
};