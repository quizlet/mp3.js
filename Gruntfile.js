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
      glob_to_multiple: {
        expand: true,
        cwd: "src",
        src: ["**/*.coffee"],
        dest: "dist",
        ext: ".js"
      }
    },
    copy: {
      main: {
        src: 'dist/<%= pkg.name %>',
        dest: '<%= pkg.name %>'
      }
    },
    mocha_phantomjs: {
        all: ['build®/**/*.html']
      }
  });

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('test', ['mocha_phantomjs']);
  grunt.registerTask('default', ['coffee', 'concat', 'copy']);
};