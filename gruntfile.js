module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-available-tasks');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-replace');

  grunt.initConfig({
    availabletasks: {
      tasks: {
        options: {
          filter: 'include',
          tasks: [
            'clean',
            'test',
            'build',
            'dockerize',
            'publish'
          ]
        }
      }
    },
    jscs: {
      src: './'
    },
    eslint: {
      target: ['./']
    },
    shell: {
      clean: {
        command: 'node main.server.js _.clean',
        options: {}
      },
      buildcore: {
        command: 'node main.server.js _.build.core',
        options: {
          execOptions: {
            maxBuffer: 1024*1024
          }
        }
      },
      distcore: {
        command: 'node main.server.js _.dist.core',
        options: {}
      },
      buildcluster: {
        command: 'node main.server.js _.build.cluster',
        options: {
          execOptions: {
            maxBuffer: 1024*1024
          }
        }
      },
      distcluster: {
        command: 'node main.server.js _.dist.cluster',
        options: {}
      },
      dockerinit: {
        command: 'cp dockerfile.in Dockerfile',
        options: {}
      }
      ,
      dockerbuild: {
        command: 'docker build -t ljveio/core:latest .',
        options: {
          execOptions: {
            maxBuffer: 1024*1024
          }
        }
      },
      dockerpush: {
        command: 'docker push ljveio/core:latest',
        options: {
          execOptions: {
            maxBuffer: 1024*1024
          }
        }
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
        tagMessage: 'Tagged release <%= version %>.',
        remote: 'public'
      }
    },
    replace: {
      dockerfile: {
        options: {
          patterns: [
            {
              match: 'UBUNTU',
              replacement: 'latest'
            },
            {
              match: 'NODE',
              replacement: 'stable'
            },
            {
              match: 'LJVE',
              replacement: function(){
                var fs = require('fs');
                var path = require('path');
                packagejson = JSON.parse(fs.readFileSync(path.join(process.cwd(),'package.json'), 'utf8'));
                return packagejson.version;
              }
            },
          ]
        },
        files: [
          { expand: true,
           flatten: true,
           src: ['Dockerfile']
          }
        ]
      }
    }
  });

  grunt.registerTask('default', [ 'availabletasks' ]);

  grunt.registerTask('publish', [
    'clean'
    'build',
    'release',
    'dockerize',
    'shell:dockerpush'
  ]);

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

  grunt.registerTask('dockerize', [
    'shell:dockerinit',
    'replace:dockerfile',
    'shell:dockerbuild'
  ]);

};