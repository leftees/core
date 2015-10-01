module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-available-tasks');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-release');

  grunt.initConfig({
    availabletasks: {
      tasks: {
        options: {
          filter: 'include',
          tasks: [
            'clean',
            'test',
            'build',
            'release'
          ]
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
    },
    release: {
      options: {
        bump: true,
        changelog: false,
        add: true,
        commit: true,
        tag: true,
        push: true,
        pushTags: true,
        npm: true,
        tagName: '<%= version %>',
        commitMessage: 'Released <%= version %>.',
        tagMessage: 'Tagged release <%= version %>', //default: 'Version <%= version %>',
      }
    }
  });

  grunt.registerTask('default', [ 'availabletasks' ]);

  grunt.registerTask('clean', [
    'shell:clean'
  ]);

  grunt.registerTask('test', [
    'jscs',
    'eslint'
  ]);

  grunt.registerTask('build', [
    'shell:clean',
    'shell:buildcore',
    'shell:distcore',
    'shell:buildcluster',
    'shell:distcluster'
  ]);

};