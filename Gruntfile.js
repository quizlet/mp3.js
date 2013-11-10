module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['dist/**/*.js'],
        dest: 'dist/<%= pkg.name %>'
      }
    },
    coffee: {
      main: {
        expand: true,
        cwd: "src",
        src: ["**/*.coffee"],
        dest: "dist",
        ext: ".js"
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
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('test', ['copy:test', 'coffee', 'mocha_phantomjs']);
  grunt.registerTask('default', ['coffee:main', 'concat', 'copy:main']);
};