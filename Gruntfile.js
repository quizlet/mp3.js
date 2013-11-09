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
  });

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['coffee', 'concat']);

};