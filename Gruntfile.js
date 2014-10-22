module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      main: {
        options: { join: true },
        files: {
          'dist/<%= pkg.name %>': ['src/web_audio_player.coffee', 'src/html_audio_player.coffee', 'src/flash_audio_player.coffee', 'src/player.coffee'],
          'dist/player.js': 'src/player.coffee',
          'dist/flash_audio_player.js': 'src/flash_audio_player.coffee',
          'dist/html_audio_player.js': 'src/html_audio_player.coffee',
          'dist/web_audio_player.js': 'src/web_audio_player.coffee'
        }
      },
      test: {
        expand: true,
        cwd: "spec",
        src: ["**/*.coffee"],
        dest: "build",
        ext: ".js"
      }
    },
    copy: {
      main: {
        src: 'dist/<%= pkg.name %>',
        dest: '<%= pkg.name %>'
      },
      test: {
        expand: true,
        flatten: true,
        src: 'spec/*',
        dest: 'build/'
      }
    },
    mocha_phantomjs: {
      all: ['build/**/*.html']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('test', ['copy:test', 'coffee', 'mocha_phantomjs']);
  grunt.registerTask('default', ['coffee:main', 'copy:main']);
};
