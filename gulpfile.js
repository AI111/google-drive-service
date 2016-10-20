var gulp = require('gulp');
var tslint = require('gulp-tslint');
var exec = require('child_process').exec;
var mocha = require('gulp-mocha');
var gulp = require('gulp-help')(gulp);
var path = require('path');
var del = require('del');
var ts = require('gulp-typescript');
var tslintCustom = require('tslint'); // for tslint-next https://github.com/panuhorsmalahti/gulp-tslint#specifying-the-tslint-module
require('dotbin');

var tsFilesGlob = (function (c) {
  return c.filesGlob || c.files || 'src/**/*.ts';
})(require('./tsconfig.json'));

var tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', 'Cleans the generated js files from lib directory', function () {
  return del([
    'dst/**/*'
  ]);
});

gulp.task('lint', 'Lints all TypeScript source files', function () {
  return gulp.src(tsFilesGlob)
    .pipe(tslint({
      tslint: tslintCustom,
      formatter: 'verbose'
    }))
    .pipe(tslint.report());
});

gulp.task('scripts', function() {
    var tsResult = tsProject.src() // instead of gulp.src(...)
        .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('dst'));
});

gulp.task('build', 'Compiles all TypeScript source files', function (cb) {
  exec('tsc --version', function (err, stdout, stderr) {
    console.log('Using TypeScript ', stdout);
    if (stderr) {
      console.log(stderr);
    }
  });

  return exec('tsc', function (err, stdout, stderr) {
    console.log(stdout);
    if (stderr) {
      console.log(stderr);
    }
    cb(err);
  });
});

gulp.task('test', 'Runs the Jasmine test specs', ['build'], function () {
  return gulp.src('test/*.ts')
    .pipe(mocha({
      require: ['ts-node/register']
    }));
});

gulp.task('watch', 'Watches ts source files and runs build on change', function () {
  gulp.watch(tsFilesGlob, ['scripts']);
});
